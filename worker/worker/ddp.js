const dgram = require('dgram');

const os = require('os');

module.exports = function () {
   //var socket = dgram.createSocket('udp4');

   //socket.on('listening', function () {

   //   socket.setBroadcast(true);

   //   socket.send('hello', 0, 5, 16180, '255.255.255.255');

     
   //});

   //// Bind to random port
   //socket.bind();

   console.log(os.freemem());
   console.log(os.hostname());
   console.log(os.platform());
   console.log(os.tmpdir());
   console.log(os.totalmem());
   console.log(os.freemem() / os.totalmem());
   console.log(os.EOL);
}

function buildDatagram() {

}