const _log = console.log.bind(console);
const log = (message) => _log(`${new Date().toLocaleString()} :: ${message}`);

module.exports = {
  log
}
