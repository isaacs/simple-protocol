var test = require('tap').test;

var sp = require('../');
var Incoming = sp.Incoming;
var Outgoing = sp.Outgoing;

test('test with tcp server', function(t) {
  var serverHeader;
  var serverData = '';
  var serverEnded = false;
  var clientHeader;
  var clientData = '';
  var clientEnded = false;
  var serverDataExpect = 'this is body chunks.  ' +
                         'and it will stream and stream\n' +
                         'because there is no I in example.\n';
  var clientDataExpect = 'ok, goodbye, now';
  var serverHeaderExpect = { hello: 'alice', this: 'is bob' }
  var clientHeaderExpect = { well: 'that was fun' }

  // throw some tcp in there, just for funsies
  // Note that we have to use allowHalfOpen, because we're not
  // explicitly managing the sockets, and we want to not close
  // when we get a FIN from the client.
  // In a real live environment, you'd probably want a client that can
  // pool and reuse connections, do keepAlive, etc., and you'd then
  // want to turn off allowHalfOpen, because the server is not
  // interested in what the client has to say after it's finished
  // sending the response.
  require('net').createServer({ allowHalfOpen: true }, function(sock) {
    var req = new Incoming();
    var res = new Outgoing();
    res.pipe(sock).pipe(req);

    req.setEncoding('utf8');
    req.on('header', function(h) {
      serverHeader = h;
    });

    req.on('data', function(chunk) {
      serverData += chunk;
    });

    req.on('end', function() {
      serverEnded = true;
      res.header = { well: 'that was fun' };
      res.write('ok, ');
      res.end('goodbye, now');
    });

    this.close();
  }).listen(1337, function() {
    var sock = require('net').connect(1337);
    sock.allowHalfOpen = true;
    sock.on('connect', function() {
      var req = new Outgoing();
      var res = new Incoming();
      req.pipe(sock).pipe(res);

      req.header = { hello: 'alice', this: 'is bob' };

      res.setEncoding('utf8');
      res.on('header', function(h) {
        clientHeader = h;
      });
      res.on('data', function(chunk) {
        clientData += chunk;
      });
      res.on('end', function() {
        clientEnded = true;

        t.ok(clientEnded);
        t.ok(serverEnded);

        t.equal(serverData, serverDataExpect);
        t.equal(clientData, clientDataExpect);
        t.same(serverHeader, serverHeaderExpect);
        t.same(clientHeader, clientHeaderExpect);

        t.end();
      });

      req.write('this is body chunks');
      req.write('.  and it will stream and stream\n');
      req.end('because there is no I in example.\n');
    });
  });
});
