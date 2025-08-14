const _log = console.log.bind(console);
export const log = (message: string) => _log(`${new Date().toLocaleString()} :: ${message}`);
