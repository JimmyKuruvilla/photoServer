const _log = console.log.bind(console);
export const log = (message: any) => _log(`${new Date().toLocaleString()} :: ${message}`);
export const createLogger = (prefix:string) => (message: any) => _log(`${prefix} :: ${new Date().toLocaleString()} :: ${message}`);
