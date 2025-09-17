export interface ConsoleMonitor {
  consoleMessages: string[];
  traceLogErrors: string[];
  traceLogWarnings: string[];
  traceLogInfo: string[];
  debugLogs: string[];
  cleanup: () => void;
  getAnomalies: () => string[];
}
