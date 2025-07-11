export enum EventType {
  PAGE_VIEW = 'page_view',
  CLICK = 'click',
  SCROLL = 'scroll',
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  CUSTOM = 'custom',
}

export enum ScrollDirection {
  UP = 'up',
  DOWN = 'down',
}

export type MetadataType = string | number | boolean | string[];

// Type guards
export function isMetadataType(value: unknown): value is MetadataType {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every((item) => typeof item === 'string');
  }

  return false;
}

export function isValidMetadataRecord(value: unknown): value is Record<string, MetadataType> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  return Object.values(obj).every((val) => isMetadataType(val));
}

export function isEventType(value: unknown): value is EventType {
  return typeof value === 'string' && Object.values(EventType).includes(value as EventType);
}

export function isScrollDirection(value: unknown): value is ScrollDirection {
  return typeof value === 'string' && Object.values(ScrollDirection).includes(value as ScrollDirection);
}

// Branded types for better type safety
export type UserId = string & { readonly __brand: 'UserId' };
export type SessionId = string & { readonly __brand: 'SessionId' };
export type Timestamp = number & { readonly __brand: 'Timestamp' };
export type URL = string & { readonly __brand: 'URL' };

// Type constructors
export function createUserId(id: string): UserId {
  if (typeof id !== 'string' || id.length === 0) {
    throw new Error('Invalid user ID');
  }
  return id as UserId;
}

export function createSessionId(id: string): SessionId {
  if (typeof id !== 'string' || id.length === 0) {
    throw new Error('Invalid session ID');
  }
  return id as SessionId;
}

export function createTimestamp(timestamp?: number): Timestamp {
  const ts = timestamp ?? Date.now();
  if (typeof ts !== 'number' || ts <= 0) {
    throw new Error('Invalid timestamp');
  }
  return ts as Timestamp;
}

export function createURL(url: string): URL {
  if (typeof url !== 'string' || url.length === 0) {
    throw new Error('Invalid URL');
  }

  try {
    new URL(url);
  } catch (error) {
    throw new Error('Invalid URL format');
  }

  return url as URL;
}

export interface TracelogEventScrollData {
  depth: number;
  direction: ScrollDirection;
}

export interface TracelogEventClickData {
  x: number;
  y: number;
  relativeX: number;
  relativeY: number;
  elementId?: string;
  elementClass?: string;
  elementTag?: string;
  elementText?: string;
  elementHref?: string;
  elementTitle?: string;
  elementAlt?: string;
  elementRole?: string;
  elementAriaLabel?: string;
  elementDataAttributes?: Record<string, string>;
}

export interface TracelogEventCustomData {
  name: string;
  metadata?: Record<string, MetadataType>;
}

export interface TracelogEventUtm {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface TracelogEventPageView {
  referrer?: string;
  title?: string;
  pathname?: string;
  search?: string;
  hash?: string;
}

export interface TracelogEventHandler {
  evType: EventType;
  url?: string;
  fromUrl?: string;
  referrer?: string;
  utm?: TracelogEventUtm;
  scrollData?: TracelogEventScrollData;
  clickData?: TracelogEventClickData;
  customEvent?: TracelogEventCustomData;
  pageView?: TracelogEventPageView;
  trigger?: string;
}

export interface TracelogEvent {
  type: EventType;
  page_url: string;
  timestamp: Timestamp;
  referrer?: string;
  from_page_url?: string;
  scroll_data?: TracelogEventScrollData;
  click_data?: TracelogEventClickData;
  custom_event?: TracelogEventCustomData;
  page_view?: TracelogEventPageView;
  utm?: TracelogEventUtm;
  tags?: string[];
  excluded_route?: boolean;
}

// Type guard for TracelogEvent
export function isTracelogEvent(value: unknown): value is TracelogEvent {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const event = value as Record<string, unknown>;

  // Required fields
  if (!isEventType(event.type)) {
    return false;
  }

  if (typeof event.page_url !== 'string') {
    return false;
  }

  if (typeof event.timestamp !== 'number') {
    return false;
  }

  // Optional fields validation
  if (event.referrer !== undefined && typeof event.referrer !== 'string') {
    return false;
  }

  if (event.from_page_url !== undefined && typeof event.from_page_url !== 'string') {
    return false;
  }

  if (event.scroll_data !== undefined) {
    const scrollData = event.scroll_data as any;
    if (typeof scrollData.depth !== 'number' || !isScrollDirection(scrollData.direction)) {
      return false;
    }
  }

  if (event.click_data !== undefined) {
    const clickData = event.click_data as any;
    if (
      typeof clickData.x !== 'number' ||
      typeof clickData.y !== 'number' ||
      typeof clickData.relativeX !== 'number' ||
      typeof clickData.relativeY !== 'number'
    ) {
      return false;
    }
  }

  if (event.custom_event !== undefined) {
    const customEvent = event.custom_event as any;
    if (typeof customEvent.name !== 'string') {
      return false;
    }
    if (customEvent.metadata !== undefined && !isValidMetadataRecord(customEvent.metadata)) {
      return false;
    }
  }

  return true;
}

export interface TracelogQueue {
  user_id: string;
  session_id: string;
  device: string;
  events: TracelogEvent[];
  global_metadata?: Record<string, MetadataType>;
}

// Type guard for TracelogQueue
export function isTracelogQueue(value: unknown): value is TracelogQueue {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const queue = value as Record<string, unknown>;

  if (typeof queue.user_id !== 'string' || typeof queue.session_id !== 'string' || typeof queue.device !== 'string') {
    return false;
  }

  if (!Array.isArray(queue.events)) {
    return false;
  }

  if (!queue.events.every((event) => isTracelogEvent(event))) {
    return false;
  }

  if (queue.global_metadata !== undefined && !isValidMetadataRecord(queue.global_metadata)) {
    return false;
  }

  return true;
}

export interface TracelogTag {
  id: string;
  name: string;
  description?: string;
  triggerType: EventType;
  logicalOperator: 'AND' | 'OR';
  conditions: TracelogTagCondition[];
  isActive: boolean;
}

export interface TracelogTagCondition {
  type: 'url_matches' | 'element_matches' | 'device_type' | 'utm_source' | 'utm_medium' | 'utm_campaign';
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'not_equals' | 'not_contains';
  value: string;
  caseSensitive?: boolean;
}

export interface TracelogApiConfig {
  qaMode: boolean;
  samplingRate: number;
  tags: TracelogTag[];
  excludedUrlPaths: string[];
}

export interface TracelogAppConfig {
  sessionTimeout?: number;
  globalMetadata?: Record<string, MetadataType>;
  scrollContainerSelectors?: string | string[];
}

export interface TracelogConfig extends TracelogApiConfig, TracelogAppConfig {}

export interface TracelogAdminError {
  message: string;
  timestamp: number;
  userAgent: string;
  url: string;
  api_key?: string;
  stack?: string;
  severity?: 'low' | 'medium' | 'high';
  context?: string;
}

// Runtime validation utilities
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateRequired<T>(value: T, fieldName: string): NonNullable<T> {
  if (value === null || value === undefined) {
    throw new ValidationError(`${fieldName} is required`, fieldName, value);
  }
  return value as NonNullable<T>;
}

export function validateString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, fieldName, value);
  }
  return value;
}

export function validateNumber(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !isFinite(value)) {
    throw new ValidationError(`${fieldName} must be a valid number`, fieldName, value);
  }
  return value;
}

export function validateBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== 'boolean') {
    throw new ValidationError(`${fieldName} must be a boolean`, fieldName, value);
  }
  return value;
}

export function validateArray<T>(value: unknown, fieldName: string, itemValidator?: (item: unknown) => T): T[] {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an array`, fieldName, value);
  }

  if (itemValidator) {
    return value.map((item, index) => {
      try {
        return itemValidator(item);
      } catch (error) {
        throw new ValidationError(`${fieldName}[${index}] is invalid`, `${fieldName}[${index}]`, item);
      }
    });
  }

  return value as T[];
}

export function validateObject<T>(value: unknown, fieldName: string, validator: (obj: unknown) => T): T {
  if (typeof value !== 'object' || value === null) {
    throw new ValidationError(`${fieldName} must be an object`, fieldName, value);
  }

  return validator(value);
}

// Safe type conversion utilities
export function safeParseInt(value: unknown, defaultValue: number = 0): number {
  if (typeof value === 'number') {
    return Math.floor(value);
  }

  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  return defaultValue;
}

export function safeParseFloat(value: unknown, defaultValue: number = 0): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  return defaultValue;
}

export function safeParseBoolean(value: unknown, defaultValue: boolean = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return defaultValue;
}

export function safeParseArray<T>(value: unknown, defaultValue: T[] = []): T[] {
  if (Array.isArray(value)) {
    return value;
  }

  return defaultValue;
}

export function safeParseObject<T extends Record<string, unknown>>(value: unknown, defaultValue: T): T {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as T;
  }

  return defaultValue;
}
