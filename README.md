# SimpleProtocol

A very simple header-and-body protocol.

Originally written as an example in a Node API doc.

## Usage

```javascript
var sp = require('simple-protocol');
var Incoming = sp.Incoming;
var Outgoing = sp.Outgoing;

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

  req.on('header', function(h) {
    console.log('SERVER header', h);
  });

  req.on('data', function(chunk) {
    console.log('SERVER message %j', chunk.toString());
  });

  req.on('end', function() {
    console.log('SERVER end');
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

    res.on('header', function(h) {
      console.log('CLIENT header', h);
    });
    res.on('data', function(chunk) {
      console.log('CLIENT message %j', chunk.toString());
    });
    res.on('end', function() {
      console.log('CLIENT end');
    });

    req.write('this is body chunks');
    req.write('.  and it will stream and stream\n');
    req.end('because there is no I in example.\n');
  });
});
```

And the output goes like:

```
SERVER header { hello: 'alice', this: 'is bob' }
SERVER message "this is body chunks.  and it will stream and stream\nbecause there is no I in example.\n"
SERVER end
CLIENT header { well: 'that was fun' }
CLIENT message "ok, goodbye, now"
CLIENT end
```

## Compatibility

If you want to use this with node v0.8 and before, you'll need to also
install the `readable-stream` module.  It's not added as a dependency,
because the future is larger than the past.
