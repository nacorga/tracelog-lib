/**
 * Runtime transformer hooks that can be updated after initialization
 * - 'beforeSend': Transform per-event before sending to backend
 * - 'beforeBatch': Transform entire batch before sending to backend
 */
export type TransformerHook = 'beforeSend' | 'beforeBatch';
