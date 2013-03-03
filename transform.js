switch (process.version.match(/v([0-9]+\.[0-9]+)\.[0-9]+/)[1]) {
  case '0.0': case '0.1':
  case '0.2': case '0.3':
  case '0.4': case '0.5':
  case '0.6': case '0.7':
    throw new Error('your node is too old and crusty for this hotness');

  case '0.8':
    module.exports = require('readable-stream/transform.js');
    break;

  default:
    module.exports = require('stream').Transform;
    break;
}
