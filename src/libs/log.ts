const _log = console.log.bind(console);
export const log = (message: any) => _log(`${new Date().toLocaleString()} :: ${message}`);
