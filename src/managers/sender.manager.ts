import {
  QUEUE_KEY,
  RATE_LIMIT_KEY,
  HEALTH_BEACON_KEY,
  EVENT_EXPIRY_HOURS,
  MAX_EVENT_AGE_MS_ON_RECOVERY,
  REQUEST_TIMEOUT_MS,
  PERMANENT_ERROR_LOG_THROTTLE_MS,
  MAX_BEACON_PAYLOAD_SIZE,
  PERSISTENCE_THROTTLE_MS,
  MAX_SEND_RETRIES,
  RETRY_BACKOFF_BASE_MS,
  RETRY_BACKOFF_JITTER_MS,
  LIB_VERSION,
  MAX_CONSECUTIVE_NETWORK_FAILURES,
  MAX_RECOVERY_FAILURES,
  CIRCUIT_BREAKER_COOLDOWN_MS,
  RATE_LIMIT_COOLDOWN_MS,
  MAX_RESPONSE_CODE_LENGTH,
  HEALTH_BEACON_THROTTLE_MS,
  MAX_BEACON_ERROR_LENGTH,
} from '../constants';
import {
  PersistedEventsQueue,
  EventsQueue,
  SpecialApiUrl,
  PermanentError,
  RateLimitError,
  TimeoutError,
  type IngestionReceipt,
} from '../types';
// Deep import: these are transport internals, deliberately not re-exported by the types barrel.
import { hasIngestEnvelopeSignature, parseCollectReceipt } from '../types/ingestion-receipt.types';
import { log } from '../utils';
import { StorageManager } from './storage.manager';
import { StateManager } from './state.manager';

interface SendCallbacks {
  onSuccess?: (eventCount?: number, events?: any[], body?: EventsQueue, receipt?: IngestionReceipt) => void;
  onFailure?: (receipt?: IngestionReceipt) => void;
}

/**
 * Outcome of one `send()` call. The receipt travels back as a return value rather than on the
 * instance so it can never be attributed to a different batch: `sendEventsQueue()` has no
 * in-flight guard, so two overlapping sends would otherwise race over one shared field.
 */
interface SendResult {
  ok: boolean;
  receipt: IngestionReceipt | null;
}

/** Every failure path returns the same receipt-less result. */
const FAILED_SEND: SendResult = Object.freeze({ ok: false, receipt: null });

/**
 * Client-emitted diagnostic beacon reasons. `events_blocked` (403 at the domain gate) and
 * `unknown_project` (404 — the identifier the snippet carries doesn't resolve to a project)
 * are both browser-detectable; `ingest_unreachable` (NXDOMAIN) is detected server-side via DNS
 * and intentionally NOT emitted from here.
 * Mirror of `PROJECT_CLIENT_ERROR_REASONS` in tracelog-api — keep the subset in lockstep when
 * adding reasons.
 */
type HealthBeaconReason = 'events_blocked' | 'unknown_project';

/**
 * The ingest error code that authorizes an `unknown_project` beacon.
 *
 * Emitted by tracelog-middleware for every flavour of unresolvable identifier (fresh miss, cached
 * miss, and query joiner alike) and by nothing else — an upstream 404 the middleware merely relays
 * carries a different code, so "project is being deleted" can never be reported as "your project id
 * is unknown". A response without this code is not one TraceLog authored.
 */
const UNKNOWN_PROJECT_ERROR_CODE = 'UNKNOWN_PROJECT';

/** Guards against treating an oversized or empty `error` field as a machine-readable code. */
function isUsableErrorCode(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_RESPONSE_CODE_LENGTH;
}

/**
 * Manages sending event queues to the TraceLog SaaS endpoint with persistence,
 * recovery, retry, circuit breaker, and 429 cooldown.
 *
 * **Storage Keys**:
 * - Queue: `tlog:{userId}:queue`
 * - Rate limit cooldown: `tlog:{userId}:rate_limit`
 * - Health beacon throttle: `tlog:beacon:{projectId}:{reason}`
 *
 * **Multi-Tab Protection**: Persisted events include `lastPersistTime`; recovery
 * skips events persisted within 1 second (active tab may retry).
 */
export class SenderManager extends StateManager {
  private readonly storeManager: StorageManager;
  private readonly apiUrl: string;
  private lastPermanentErrorLog: { key: string; timestamp: number } | null = null;
  /**
   * In-memory fallback for the beacon throttle when localStorage is
   * unavailable. The primary throttle state lives in localStorage (see
   * {@link HEALTH_BEACON_KEY}) so it survives MPA navigations and is shared
   * across tabs.
   */
  private readonly lastBeaconAt: Partial<Record<HealthBeaconReason, number>> = {};
  private recoveryInProgress = false;
  private lastMetadataTimestamp = 0;
  private readonly pendingControllers = new Set<AbortController>();
  /**
   * Counts consecutive fetch() rejections where no HTTP response was received
   * (DNS failure, connection refused). Resets on success. When this reaches
   * MAX_CONSECUTIVE_NETWORK_FAILURES the circuit opens and further send attempts
   * are skipped until CIRCUIT_BREAKER_COOLDOWN_MS elapses.
   */
  private consecutiveNetworkFailures = 0;
  private circuitOpenedAt = 0;
  /**
   * Timestamp (epoch ms) before which `send()` must skip fetch() calls due to a
   * prior 429 response. Mirrored to `localStorage` (keyed by userId) so the
   * cooldown survives page navigations on traditional server-rendered sites and
   * is discoverable by other tabs on the same origin.
   */
  private rateLimitedUntil = 0;
  /**
   * Storage key used when the current in-memory cooldown was armed. Captured at
   * arm time so identity changes mid-cooldown can't make persist/clear
   * operations target the wrong key.
   */
  private rateLimitStorageKeyAtArm: string | null = null;

  constructor(storeManager: StorageManager, apiUrl: string) {
    super();

    this.storeManager = storeManager;
    this.apiUrl = apiUrl;
    this.migrateLegacyV2Keys();
    this.rateLimitedUntil = this.loadRateLimitCooldown();
  }

  /**
   * Migrates v2 multi-integration localStorage keys to the v3 single-integration layout.
   *
   * V2 stored per-integration suffixes (`tlog:{userId}:queue:saas`,
   * `tlog:{userId}:queue:custom`, plus matching `:rate_limit:saas` / `:rate_limit:custom`).
   * V3 is SaaS-only, so the `:saas` queue is merged into the new unscoped key
   * `tlog:{userId}:queue` while preserving the original `timestamp` (so the
   * expiry check still applies) and bumping `recoveryFailures` if both keys
   * carry one. The `:custom` queue is intentionally discarded — its events were
   * destined for a different backend that no longer exists in v3; forwarding
   * them to SaaS would be data leakage. The legacy keys are removed in all
   * cases so the migration is one-shot per browser.
   */
  private migrateLegacyV2Keys(): void {
    const userId = this.get('userId') || 'anonymous';
    const legacySaasQueueKey = `${QUEUE_KEY(userId)}:saas`;
    const legacyCustomQueueKey = `${QUEUE_KEY(userId)}:custom`;
    const legacySaasRateLimitKey = `${RATE_LIMIT_KEY(userId)}:saas`;
    const legacyCustomRateLimitKey = `${RATE_LIMIT_KEY(userId)}:custom`;

    try {
      const legacyRaw = this.storeManager.getItem(legacySaasQueueKey);
      if (legacyRaw) {
        const targetKey = this.getQueueStorageKey();
        const currentRaw = this.storeManager.getItem(targetKey);

        if (!currentRaw) {
          this.storeManager.setItem(targetKey, legacyRaw);
          log('debug', 'Migrated v2 SaaS queue to v3 unscoped key');
        } else {
          this.mergeLegacyIntoCurrent(targetKey, legacyRaw, currentRaw);
        }

        this.storeManager.removeItem(legacySaasQueueKey);
      }
    } catch (error) {
      log('debug', 'Failed to migrate v2 SaaS queue, discarding legacy key', { error });
      try {
        this.storeManager.removeItem(legacySaasQueueKey);
      } catch {
        // Already best-effort; nothing more to do.
      }
    }

    [legacyCustomQueueKey, legacySaasRateLimitKey, legacyCustomRateLimitKey].forEach((key) => {
      try {
        if (this.storeManager.getItem(key) !== null) {
          this.storeManager.removeItem(key);
        }
      } catch {
        // Best-effort cleanup — leaving an orphan key is harmless.
      }
    });
  }

  private mergeLegacyIntoCurrent(targetKey: string, legacyRaw: string, currentRaw: string): void {
    try {
      const legacy = JSON.parse(legacyRaw) as PersistedEventsQueue;
      const current = JSON.parse(currentRaw) as PersistedEventsQueue;

      if (!Array.isArray(legacy?.events) || !Array.isArray(current?.events)) {
        log('debug', 'Legacy or current queue malformed, keeping current only');
        return;
      }

      const seen = new Set<string>(current.events.map((e) => e.id));
      const mergedEvents = [
        ...current.events,
        ...legacy.events.filter((e) => typeof e.id === 'string' && !seen.has(e.id)),
      ];

      const merged: PersistedEventsQueue = {
        ...current,
        events: mergedEvents,
        timestamp:
          typeof current.timestamp === 'number' && typeof legacy.timestamp === 'number'
            ? Math.min(current.timestamp, legacy.timestamp)
            : (current.timestamp ?? legacy.timestamp ?? Date.now()),
        recoveryFailures: Math.max(current.recoveryFailures ?? 0, legacy.recoveryFailures ?? 0) || undefined,
      };

      this.storeManager.setItem(targetKey, JSON.stringify(merged));
      log('debug', 'Merged v2 SaaS queue into existing v3 queue', {
        data: { added: mergedEvents.length - current.events.length, total: mergedEvents.length },
      });
    } catch (error) {
      log('debug', 'Failed to merge legacy queue, keeping current', { error });
    }
  }

  private getQueueStorageKey(): string {
    const userId = this.get('userId') || 'anonymous';
    return QUEUE_KEY(userId);
  }

  private getRateLimitStorageKey(): string {
    const userId = this.get('userId') || 'anonymous';
    return RATE_LIMIT_KEY(userId);
  }

  private getActiveRateLimitKey(): string {
    return this.rateLimitStorageKeyAtArm ?? this.getRateLimitStorageKey();
  }

  private armRateLimitCooldown(until: number): void {
    this.rateLimitedUntil = until;
    this.rateLimitStorageKeyAtArm = this.getRateLimitStorageKey();
    this.persistRateLimitCooldown(until);
  }

  private loadRateLimitCooldown(): number {
    const key = this.getRateLimitStorageKey();
    try {
      const raw = this.storeManager.getItem(key);
      if (!raw) return 0;
      const value = Number(raw);
      if (!Number.isFinite(value) || value <= Date.now()) {
        this.storeManager.removeItem(key);
        return 0;
      }
      this.rateLimitStorageKeyAtArm = key;
      return value;
    } catch {
      return 0;
    }
  }

  private persistRateLimitCooldown(until: number): void {
    const key = this.getActiveRateLimitKey();
    try {
      const raw = this.storeManager.getItem(key);
      if (raw) {
        const existing = Number(raw);
        if (Number.isFinite(existing) && existing >= until) {
          return;
        }
      }
      this.storeManager.setItem(key, String(until));
    } catch {
      // Storage full or disabled — cooldown still works in-memory for this instance
    }
  }

  private clearRateLimitCooldown(): void {
    const key = this.getActiveRateLimitKey();
    try {
      const raw = this.storeManager.getItem(key);
      if (raw) {
        const stored = Number(raw);
        if (Number.isFinite(stored) && stored > Date.now()) {
          this.rateLimitedUntil = stored;
          return;
        }
      }
      this.storeManager.removeItem(key);
    } catch {
      // Ignore — cleared in-memory is enough
    }
    this.rateLimitedUntil = 0;
    this.rateLimitStorageKeyAtArm = null;
  }

  private isRateLimited(): boolean {
    if (this.rateLimitedUntil === 0) {
      this.rateLimitedUntil = this.loadRateLimitCooldown();
    }
    if (this.rateLimitedUntil === 0) return false;
    if (Date.now() >= this.rateLimitedUntil) {
      this.clearRateLimitCooldown();
      if (this.rateLimitedUntil === 0) return false;
    }
    return true;
  }

  /**
   * Sends events synchronously using `navigator.sendBeacon()`.
   *
   * Falls back to localStorage persistence on rate-limit cooldown, beacon
   * rejection, or oversized payloads.
   */
  sendEventsQueueSync(body: EventsQueue): boolean {
    if (this.isRateLimited()) {
      log('debug', 'Rate-limit cooldown active, skipping sync send', {
        data: {
          cooldownRemainingMs: this.rateLimitedUntil - Date.now(),
          events: body.events.length,
        },
      });
      const stableBody = this.ensureBatchMetadata(body);
      const existing = this.getPersistedData();
      const existingFailures =
        typeof existing?.recoveryFailures === 'number' && Number.isFinite(existing.recoveryFailures)
          ? existing.recoveryFailures
          : 0;
      this.persistEventsWithFailureCount(stableBody, existingFailures, true);
      return false;
    }

    if (this.apiUrl.includes(SpecialApiUrl.Fail)) {
      log('warn', 'Fail mode: simulating network failure (sync)', { data: { events: body.events.length } });
      return false;
    }

    if (this.apiUrl.includes(SpecialApiUrl.Localhost)) {
      log('debug', 'Success mode: simulating successful send (sync)', { data: { events: body.events.length } });
      return true;
    }

    return this.sendQueueSyncInternal(body);
  }

  /**
   * Sends events asynchronously using `fetch()` with retry, circuit breaker, and 429 cooldown.
   * Persists on failure for recovery on next page load.
   */
  async sendEventsQueue(body: EventsQueue, callbacks?: SendCallbacks): Promise<boolean> {
    const stableBody = this.ensureBatchMetadata(body);

    try {
      const { ok, receipt } = await this.send(stableBody);

      if (ok) {
        this.clearPersistedEvents();
        callbacks?.onSuccess?.(stableBody.events.length, stableBody.events, stableBody, receipt ?? undefined);
      } else {
        this.persistEvents(stableBody);
        callbacks?.onFailure?.(receipt ?? undefined);
      }

      return ok;
    } catch (error) {
      if (error instanceof PermanentError) {
        this.logPermanentError('Permanent error, not retrying', error);
        this.clearPersistedEvents();
        callbacks?.onFailure?.(error.ingestionReceipt);
        return false;
      }

      this.persistEvents(stableBody);
      callbacks?.onFailure?.();
      return false;
    }
  }

  /**
   * Recovers and attempts to resend events persisted from a previous session.
   *
   * Idempotent: safe to call multiple times (recovery flag prevents concurrent attempts).
   */
  async recoverPersistedEvents(callbacks?: SendCallbacks): Promise<void> {
    if (this.recoveryInProgress) {
      log('debug', 'Recovery already in progress, skipping duplicate attempt');
      return;
    }

    this.recoveryInProgress = true;

    let recoveryBody: EventsQueue | null = null;
    let recoveryFailures = 0;

    try {
      const persistedData = this.getPersistedData();

      if (!persistedData || !this.isDataRecent(persistedData) || persistedData.events.length === 0) {
        this.clearPersistedEvents();
        return;
      }

      const rawFailures = persistedData.recoveryFailures;
      recoveryFailures =
        typeof rawFailures === 'number' && Number.isFinite(rawFailures) && rawFailures >= 0 ? rawFailures : 0;
      if (recoveryFailures >= MAX_RECOVERY_FAILURES) {
        log('debug', `Discarding persisted events after ${recoveryFailures} failed recovery attempts`);
        this.clearPersistedEvents();
        callbacks?.onFailure?.();
        return;
      }

      if (this.isRateLimited()) {
        log('debug', 'Rate-limit cooldown active, deferring recovery', {
          data: { cooldownRemainingMs: this.rateLimitedUntil - Date.now() },
        });
        callbacks?.onFailure?.();
        return;
      }

      recoveryBody = this.ensureBatchMetadata(this.createRecoveryBody(persistedData));

      if (recoveryBody.events.length === 0) {
        log('debug', 'All persisted events exceeded the recovery age cutoff; discarding batch');
        this.clearPersistedEvents();
        return;
      }

      const { ok, receipt } = await this.send(recoveryBody);

      if (ok) {
        this.clearPersistedEvents();
        callbacks?.onSuccess?.(persistedData.events.length, persistedData.events, recoveryBody, receipt ?? undefined);
      } else {
        this.persistEventsWithFailureCount(recoveryBody, recoveryFailures + 1, true);
        callbacks?.onFailure?.(receipt ?? undefined);
      }
    } catch (error) {
      if (error instanceof PermanentError) {
        this.logPermanentError('Permanent error during recovery, clearing persisted events', error);
        this.clearPersistedEvents();
        callbacks?.onFailure?.(error.ingestionReceipt);
        return;
      }

      log('error', 'Failed to recover persisted events', { error });
      if (recoveryBody) {
        this.persistEventsWithFailureCount(recoveryBody, recoveryFailures + 1, true);
      }
      callbacks?.onFailure?.();
    } finally {
      this.recoveryInProgress = false;
    }
  }

  /**
   * Cleanup method called during `App.destroy()`. No-op — persisted events
   * intentionally kept in localStorage for recovery.
   */
  stop(): void {}

  private async backoffDelay(attempt: number): Promise<void> {
    const exponentialDelay = RETRY_BACKOFF_BASE_MS * Math.pow(2, attempt);
    const jitter = Math.random() * RETRY_BACKOFF_JITTER_MS;
    return new Promise((resolve) => setTimeout(resolve, exponentialDelay + jitter));
  }

  private async send(body: EventsQueue): Promise<SendResult> {
    const requestBody = this.ensureBatchMetadata(body, body._metadata?.idempotency_token);

    if (this.apiUrl.includes(SpecialApiUrl.Fail)) {
      log('debug', 'Fail mode: simulating network failure', { data: { events: requestBody.events.length } });
      return FAILED_SEND;
    }

    if (this.apiUrl.includes(SpecialApiUrl.Localhost)) {
      log('debug', 'Success mode: simulating successful send', { data: { events: requestBody.events.length } });
      return { ok: true, receipt: null };
    }

    if (this.isRateLimited()) {
      log('debug', 'Rate-limit cooldown active, skipping send', {
        data: {
          cooldownRemainingMs: this.rateLimitedUntil - Date.now(),
          events: requestBody.events.length,
        },
      });
      return FAILED_SEND;
    }

    if (this.consecutiveNetworkFailures >= MAX_CONSECUTIVE_NETWORK_FAILURES) {
      const elapsed = Date.now() - this.circuitOpenedAt;
      if (elapsed < CIRCUIT_BREAKER_COOLDOWN_MS) {
        log('debug', 'Network circuit open, skipping send', {
          data: {
            consecutiveNetworkFailures: this.consecutiveNetworkFailures,
            cooldownRemainingMs: CIRCUIT_BREAKER_COOLDOWN_MS - elapsed,
          },
        });
        return FAILED_SEND;
      }
      // Half-open: allow one probe batch through.
    }

    const { url, payload } = this.prepareRequest(requestBody);
    let allTimeouts = true;
    let hadHttpResponse = false;

    for (let attempt = 1; attempt <= MAX_SEND_RETRIES + 1; attempt++) {
      try {
        const response = await this.sendWithTimeout(url, payload);

        if (response.ok) {
          const receipt = await this.readIngestionReceipt(response);
          if (attempt > 1) {
            log('info', `Send succeeded after ${attempt - 1} retry attempt(s)`, {
              data: { events: requestBody.events.length, attempt },
            });
          }

          this.consecutiveNetworkFailures = 0;
          this.circuitOpenedAt = 0;
          return { ok: true, receipt };
        }

        return FAILED_SEND;
      } catch (error) {
        const isLastAttempt = attempt === MAX_SEND_RETRIES + 1;

        if (error instanceof PermanentError) {
          this.consecutiveNetworkFailures = 0;
          this.circuitOpenedAt = 0;
          // A 403 means something rejected the batch at the gate; a 404 means the project identifier
          // itself doesn't resolve (typo, stale/regenerated id). Both leave the backend blind — the
          // browser is the only place that can report either. Emit a diagnostic beacon to the
          // gate-bypassing endpoint. An NXDOMAIN/network failure can't reach any host anyway and is
          // server-detected via DNS, so it stays out of this branch.
          //
          // The two are gated differently on purpose. "Your events are being blocked" is true no
          // matter who answered — a WAF or CDN in front of ingest returning 403 is exactly the
          // outage the merchant needs told about — so 403 needs no proof of authorship. "Your
          // project id is unknown" is a claim only TraceLog can make: in accuracy mode the collect
          // URL is the merchant's own CNAME'd subdomain, and a parked page, a default CDN backend,
          // or a captive portal answering 404 there must never be reported as a bad project id.
          if (error.statusCode === 403) {
            this.emitHealthBeacon('events_blocked', error.message);
          } else if (error.statusCode === 404 && error.responseCode === UNKNOWN_PROJECT_ERROR_CODE) {
            this.emitHealthBeacon('unknown_project', error.message);
          }
          throw error;
        }

        if (error instanceof RateLimitError) {
          this.consecutiveNetworkFailures = 0;
          this.circuitOpenedAt = 0;
          // No `allTimeouts` / `hadHttpResponse` bookkeeping: this branch breaks
          // out of the retry loop, and both are only read on the last-attempt
          // path below, which the break skips.
          this.armRateLimitCooldown(Date.now() + RATE_LIMIT_COOLDOWN_MS);
          log('warn', 'Rate limited, skipping retries', {
            data: { events: body.events.length, attempt, cooldownMs: RATE_LIMIT_COOLDOWN_MS },
          });
          break;
        }

        if (!(error instanceof TimeoutError)) {
          allTimeouts = false;
        }

        if (!(error instanceof TypeError)) {
          hadHttpResponse = true;
        }

        log(
          isLastAttempt ? 'error' : 'warn',
          `Send attempt ${attempt} failed${isLastAttempt ? ' (all retries exhausted)' : ', will retry'}`,
          {
            error,
            data: {
              events: body.events.length,
              url: url.replace(/\/\/[^/]+/, '//[DOMAIN]'),
              attempt,
              maxAttempts: MAX_SEND_RETRIES + 1,
            },
          },
        );

        if (!isLastAttempt) {
          await this.backoffDelay(attempt);
          continue;
        }

        if (allTimeouts) {
          log('debug', 'All retry attempts timed out, preserving batch for retry', {
            data: { events: requestBody.events.length },
          });
          return FAILED_SEND;
        }

        if (!hadHttpResponse) {
          this.consecutiveNetworkFailures = Math.min(
            this.consecutiveNetworkFailures + 1,
            MAX_CONSECUTIVE_NETWORK_FAILURES,
          );

          if (this.consecutiveNetworkFailures >= MAX_CONSECUTIVE_NETWORK_FAILURES) {
            this.circuitOpenedAt = Date.now();
          }
        } else {
          this.consecutiveNetworkFailures = 0;
          this.circuitOpenedAt = 0;
        }

        return FAILED_SEND;
      }
    }

    return FAILED_SEND;
  }

  private async sendWithTimeout(url: string, payload: string): Promise<Response> {
    const controller = new AbortController();
    this.pendingControllers.add(controller);
    let didTimeout = false;

    const timeoutId = setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: payload,
        keepalive: true,
        credentials: 'include',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const isPermanentError =
          response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429;

        if (isPermanentError) {
          const { responseCode, receipt } = await this.readTraceLogResponseMetadata(response);
          const message = responseCode
            ? `HTTP ${response.status}: ${response.statusText} (${responseCode})`
            : `HTTP ${response.status}: ${response.statusText}`;
          throw new PermanentError(message, response.status, responseCode, receipt ?? undefined);
        }

        if (response.status === 429) {
          throw new RateLimitError(`HTTP 429: ${response.statusText}`);
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      if (error instanceof PermanentError) {
        throw error;
      }
      if (didTimeout) {
        throw new TimeoutError('Request timed out');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
      this.pendingControllers.delete(controller);
    }
  }

  /**
   * Extracts the application error code AND the ingestion receipt from a 4xx body, and with them
   * the proof that a TraceLog host — not an arbitrary server answering the same name — produced
   * the response.
   *
   * Only the ingest error envelope is accepted: `{ statusCode, error, message, timestamp, path, ...receipt }`,
   * the single shape every rejection arrives in (tracelog-middleware's `AllExceptionsFilter`, which
   * renders an exception's own `code` into `error`). Both readings count only when `statusCode`
   * echoes the HTTP status — that pairing is the envelope's signature, and neither a generic
   * `{"error":"Not Found"}` nor a bare `{"code":"..."}` from a foreign host can produce it.
   *
   * An uncorroborated code is deliberately NOT read: a code is both a log detail and the authorship
   * proof {@link HealthBeaconReason} `unknown_project` gates on, so accepting one nobody vouched for
   * would let any responder authorize a claim about TraceLog's own records. The receipt is held to
   * the same bar for the same reason — it reports how much of the merchant's traffic was dropped and
   * why, so an unvouched one is a lie about their data, not a missing log detail. A `null` receipt
   * and an `undefined` code both mean exactly "nothing here identifies the responder as TraceLog".
   *
   * {@link parseCollectReceipt} then adds the consistency half: a rejection whose receipt reports
   * `dropped: 0` is discarded, because the server derives `outcome`/`coverage` from `dropped` and
   * such a body arrives claiming the refused batch was accepted and complete.
   */
  private async readTraceLogResponseMetadata(
    response: Response,
  ): Promise<{ responseCode?: string; receipt: IngestionReceipt | null }> {
    try {
      const body = (await response.clone().json()) as { statusCode?: unknown; error?: unknown };

      // The envelope signature gates BOTH readings, and it is checked before either is taken.
      // A receipt asserts more than a code does — `dropped`, and `account_paused`/`project_paused`
      // are statements about TraceLog's own account records — so the claim that needs the most
      // authorship proof must never be the one that skips it.
      if (!hasIngestEnvelopeSignature(body, response.status)) {
        return { receipt: null };
      }

      const receipt = this.noteReceipt(parseCollectReceipt(body, response));
      return isUsableErrorCode(body.error) ? { responseCode: body.error, receipt } : { receipt };
    } catch {
      // Best-effort only. Status still determines permanence.
    }
    return { receipt: null };
  }

  /**
   * Surfaces a receipt that reports data loss, and returns it unchanged so it can wrap a parse.
   *
   * `dropped` is the only counter worth a line: it is the one that means events were refused
   * against the caller's intent. `filtered` is the project's own sampling or exclusions working
   * exactly as configured, so keying on it would emit on every batch of a healthy project.
   *
   * `debug` with no `visibility` is deliberate per the logging policy. A refusal is a server-side
   * account, quota, or guardrail decision that a visitor to the merchant's site can do nothing
   * about and must never see, so this stays development-only — production is silent even under
   * `?tlog_mode=qa`, which is reserved for custom-event verification.
   */
  private noteReceipt(receipt: IngestionReceipt | null): IngestionReceipt | null {
    if (receipt && receipt.dropped > 0) {
      log('debug', 'Ingestion receipt reports dropped events', {
        data: {
          outcome: receipt.outcome,
          accepted: receipt.accepted,
          dropped: receipt.dropped,
          coverage: receipt.coverage,
          ...(receipt.reason ? { reason: receipt.reason } : {}),
          ...(receipt.retryAt ? { retryAt: receipt.retryAt } : {}),
        },
      });
    }

    return receipt;
  }

  /**
   * Reads the receipt off a 2xx collect response.
   *
   * No envelope signature is required here — the success body is `CollectResponse`, which carries
   * no `statusCode` to echo, and a 2xx already means the responder accepted the batch, so the
   * receipt only refines an acceptance the status itself established. What remains is
   * {@link parseCollectReceipt}'s structural strictness (three non-negative integers plus two
   * closed literal unions, a shape nothing answering the route by accident produces) and its
   * refusal of a receipt that accounts for no events at all.
   */
  private async readIngestionReceipt(response: Response): Promise<IngestionReceipt | null> {
    try {
      return this.noteReceipt(parseCollectReceipt(await response.clone().json(), response));
    } catch {
      return null;
    }
  }

  private sendQueueSyncInternal(body: EventsQueue): boolean {
    const stableBody = this.ensureBatchMetadata(body);
    const requestBody = this.ensureBatchMetadata(stableBody, stableBody._metadata?.idempotency_token);
    const { url, payload } = this.prepareRequest(requestBody);

    if (payload.length > MAX_BEACON_PAYLOAD_SIZE) {
      log('warn', 'Payload exceeds sendBeacon limit, persisting for recovery', {
        data: { size: payload.length, limit: MAX_BEACON_PAYLOAD_SIZE, events: requestBody.events.length },
      });
      this.persistEvents(stableBody);
      return false;
    }

    const blob = new Blob([payload], { type: 'application/json' });

    if (!this.isSendBeaconAvailable()) {
      log('warn', 'sendBeacon not available, persisting events for recovery');
      this.persistEvents(stableBody);
      return false;
    }

    const accepted = navigator.sendBeacon(url, blob);

    if (!accepted) {
      log('warn', 'sendBeacon rejected request, persisting events for recovery');
      this.persistEvents(stableBody);
    }

    return accepted;
  }

  private prepareRequest(body: EventsQueue): { url: string; payload: string } {
    let timestamp = Date.now();

    if (timestamp < this.lastMetadataTimestamp) {
      timestamp = this.lastMetadataTimestamp;
    }
    this.lastMetadataTimestamp = timestamp;

    const enrichedBody = {
      ...body,
      _metadata: {
        ...body._metadata,
        idempotency_token: body._metadata?.idempotency_token ?? this.computeContentToken(body),
        referer: typeof window !== 'undefined' ? window.location.href : undefined,
        timestamp,
        client_version: LIB_VERSION,
      },
    };

    return {
      url: this.apiUrl,
      payload: JSON.stringify(enrichedBody),
    };
  }

  private ensureBatchMetadata(body: EventsQueue, preferredToken?: string): EventsQueue {
    const idempotencyToken = body._metadata?.idempotency_token ?? preferredToken ?? this.computeContentToken(body);

    if (body._metadata?.idempotency_token === idempotencyToken) {
      return body;
    }

    return {
      ...body,
      _metadata: {
        ...body._metadata,
        idempotency_token: idempotencyToken,
      },
    };
  }

  /**
   * Deterministic 32-bit FNV-1a hash of sorted event IDs, salted with
   * `user_id` and `session_id`. Produces the same idempotency token for the
   * same set of events across retries.
   */
  private computeContentToken(body: EventsQueue): string {
    const ids = body.events
      .map((e) => e.id)
      .sort()
      .join(',');
    const input = `${body.user_id}|${body.session_id}|${ids}`;

    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619) >>> 0;
    }

    return hash.toString(16).padStart(8, '0');
  }

  private getPersistedData(): PersistedEventsQueue | null {
    try {
      const storageKey = this.getQueueStorageKey();
      const persistedDataString = this.storeManager.getItem(storageKey);

      if (persistedDataString) {
        return JSON.parse(persistedDataString);
      }
    } catch (error) {
      log('debug', 'Failed to parse persisted data', { error });
      this.clearPersistedEvents();
    }

    return null;
  }

  private isDataRecent(data: PersistedEventsQueue): boolean {
    if (!data.timestamp || typeof data.timestamp !== 'number') {
      return false;
    }

    const ageInHours = (Date.now() - data.timestamp) / (1000 * 60 * 60);
    return ageInHours < EVENT_EXPIRY_HOURS;
  }

  private createRecoveryBody(data: PersistedEventsQueue): EventsQueue {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { timestamp, recoveryFailures, ...queue } = data;
    const originalEvents = queue.events ?? [];
    const cutoff = Date.now() - MAX_EVENT_AGE_MS_ON_RECOVERY;
    const filteredEvents = originalEvents.filter((event) => {
      const eventTimestamp =
        typeof event.timestamp === 'number' ? event.timestamp : new Date(event.timestamp).getTime();
      return Number.isFinite(eventTimestamp) && eventTimestamp >= cutoff;
    });

    if (filteredEvents.length < originalEvents.length) {
      log('debug', 'Recovery dropped stale events', {
        data: {
          dropped: originalEvents.length - filteredEvents.length,
          kept: filteredEvents.length,
        },
      });
    }

    return { ...queue, events: filteredEvents };
  }

  private persistEvents(body: EventsQueue): boolean {
    const existing = this.getPersistedData();
    const existingFailures =
      typeof existing?.recoveryFailures === 'number' && Number.isFinite(existing.recoveryFailures)
        ? existing.recoveryFailures
        : 0;
    return this.persistEventsWithFailureCount(body, existingFailures);
  }

  private persistEventsWithFailureCount(body: EventsQueue, recoveryFailures: number, skipThrottle = false): boolean {
    try {
      const existing = this.getPersistedData();

      if (!skipThrottle && typeof existing?.timestamp === 'number') {
        const timeSinceExisting = Date.now() - existing.timestamp;

        if (timeSinceExisting < PERSISTENCE_THROTTLE_MS) {
          log('debug', 'Skipping persistence, another tab recently persisted events', {
            data: { timeSinceExisting },
          });
          return true;
        }
      }

      const persistedData: PersistedEventsQueue = {
        ...body,
        timestamp: Date.now(),
        ...(recoveryFailures > 0 && { recoveryFailures }),
      };

      const storageKey = this.getQueueStorageKey();
      this.storeManager.setItem(storageKey, JSON.stringify(persistedData));

      return !!this.storeManager.getItem(storageKey);
    } catch (error) {
      log('debug', 'Failed to persist events', { error });
      return false;
    }
  }

  private clearPersistedEvents(): void {
    try {
      const key = this.getQueueStorageKey();
      this.storeManager.removeItem(key);
    } catch (error) {
      log('debug', 'Failed to clear persisted events', { error });
    }
  }

  private isSendBeaconAvailable(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function';
  }

  private logPermanentError(context: string, error: PermanentError): void {
    const now = Date.now();
    const key = `${error.statusCode ?? 'unknown'}:${error.responseCode ?? ''}`;
    const shouldLog =
      this.lastPermanentErrorLog?.key !== key ||
      now - this.lastPermanentErrorLog.timestamp >= PERMANENT_ERROR_LOG_THROTTLE_MS;

    if (shouldLog) {
      log('error', context, {
        data: { status: error.statusCode, code: error.responseCode, message: error.message },
      });

      this.lastPermanentErrorLog = { key, timestamp: now };
    }
  }

  /**
   * Emits a low-frequency, deduplicated diagnostic "health beacon" to the gate-bypassing
   * `/client-error` endpoint. Best-effort and silent: never blocks, never throws, never logs to the
   * host page. Opt out via `integrations.tracelog.healthBeacon: false`.
   */
  private emitHealthBeacon(reason: HealthBeaconReason, lastError?: string): void {
    try {
      const tracelog = this.get('config')?.integrations?.tracelog;
      if (!tracelog?.projectId || tracelog.healthBeacon === false) return;

      const url = this.resolveBeaconUrl();
      if (!url) return;

      // The middleware DTO rejects empty origins (@IsNotEmpty), so bail before
      // consuming the throttle window on a payload that can never validate.
      const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
      if (!origin) return;

      if (!this.markBeaconEmitted(tracelog.projectId, reason)) return;

      const payload = JSON.stringify({
        projectId: tracelog.projectId,
        reason,
        origin,
        ...(lastError ? { lastError: lastError.slice(0, MAX_BEACON_ERROR_LENGTH) } : {}),
      });
      this.postBeacon(url, payload);
    } catch {
      // Diagnostic beacon is best-effort; never surface to the host page.
    }
  }

  /**
   * Throttle gate: returns `true` and records the emit timestamp when the
   * beacon may fire, `false` when still inside {@link HEALTH_BEACON_THROTTLE_MS}.
   *
   * State lives in localStorage so the window survives MPA navigations and is
   * shared across tabs; the in-memory map covers storage-disabled browsers.
   * The timestamp is deliberately recorded BEFORE the send attempt: if both
   * transports fail, waiting out the window is fine for a diagnostic signal
   * and avoids turning transport failures into retry bursts.
   */
  private markBeaconEmitted(projectId: string, reason: HealthBeaconReason): boolean {
    const now = Date.now();
    const key = HEALTH_BEACON_KEY(projectId, reason);

    let lastEmit = this.lastBeaconAt[reason] ?? 0;
    try {
      const stored = Number(this.storeManager.getItem(key));
      if (Number.isFinite(stored) && stored > lastEmit) {
        lastEmit = stored;
      }
    } catch {
      // Storage unreadable — in-memory value still applies.
    }

    if (now - lastEmit < HEALTH_BEACON_THROTTLE_MS) return false;

    this.lastBeaconAt[reason] = now;
    try {
      this.storeManager.setItem(key, String(now));
    } catch {
      // Storage full or disabled — throttle still works in-memory for this instance.
    }
    return true;
  }

  /** The collect URL the lib already derived, with the path swapped to the diagnostics route. */
  private resolveBeaconUrl(): string | null {
    if (this.apiUrl.includes(SpecialApiUrl.Localhost) || this.apiUrl.includes(SpecialApiUrl.Fail)) return null;
    if (!/\/collect$/.test(this.apiUrl)) return null;
    return this.apiUrl.replace(/\/collect$/, '/client-error');
  }

  private postBeacon(url: string, payload: string): void {
    if (this.isSendBeaconAvailable()) {
      const blob = new Blob([payload], { type: 'application/json' });
      if (navigator.sendBeacon(url, blob)) return;
    }
    if (typeof fetch === 'function') {
      void fetch(url, {
        method: 'POST',
        body: payload,
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => undefined);
    }
  }
}
