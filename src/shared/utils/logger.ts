export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => {
    console.log(JSON.stringify({ level: 'INFO', message: msg, ...meta, timestamp: new Date().toISOString() }));
  },
  warn: (msg: string, meta?: Record<string, unknown>) => {
    console.warn(JSON.stringify({ level: 'WARN', message: msg, ...meta, timestamp: new Date().toISOString() }));
  },
  error: (msg: string, meta?: Record<string, unknown>) => {
    console.error(JSON.stringify({ level: 'ERROR', message: msg, ...meta, timestamp: new Date().toISOString() }));
  },
};
