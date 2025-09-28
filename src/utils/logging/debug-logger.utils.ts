import { Mode } from '../../types';
import { StateManager } from '../../managers/state.manager';

type LogLevel = 'CLIENT_ERROR' | 'CLIENT_WARN' | 'INFO' | 'ERROR' | 'WARN' | 'DEBUG' | 'VERBOSE';

class DebugLogger extends StateManager {
  clientError = (ns: string, msg: string, data?: unknown): void => this.log('CLIENT_ERROR', ns, msg, data);
  clientWarn = (ns: string, msg: string, data?: unknown): void => this.log('CLIENT_WARN', ns, msg, data);
  info = (ns: string, msg: string, data?: unknown): void => this.log('INFO', ns, msg, data);
  error = (ns: string, msg: string, data?: unknown): void => this.log('ERROR', ns, msg, data);
  warn = (ns: string, msg: string, data?: unknown): void => this.log('WARN', ns, msg, data);
  debug = (ns: string, msg: string, data?: unknown): void => this.log('DEBUG', ns, msg, data);
  verbose = (ns: string, msg: string, data?: unknown): void => this.log('VERBOSE', ns, msg, data);

  private log(level: LogLevel, ns: string, msg: string, data?: unknown): void {
    const mode = this.get('config')?.mode;

    if (!this.shouldShow(level, mode)) return;

    const formattedMsg = `[TraceLog:${ns}] ${msg}`;
    const method = this.getMethod(level);

    if (data !== undefined) {
      console[method](formattedMsg, data);
    } else {
      console[method](formattedMsg);
    }
  }

  private shouldShow(level: LogLevel, mode?: Mode): boolean {
    if (['CLIENT_ERROR', 'ERROR'].includes(level)) return true;
    if (!mode) return level === 'CLIENT_WARN';
    if (mode === 'qa') return ['INFO', 'CLIENT_ERROR', 'CLIENT_WARN'].includes(level);
    if (mode === 'debug') return true; // Debug mode shows all logs

    return false;
  }

  private getMethod(level: LogLevel): 'error' | 'warn' | 'log' {
    if (['CLIENT_ERROR', 'ERROR'].includes(level)) return 'error';
    if (['CLIENT_WARN', 'WARN'].includes(level)) return 'warn';

    return 'log';
  }
}

export const debugLog = new DebugLogger();
