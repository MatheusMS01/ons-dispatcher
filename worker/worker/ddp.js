////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////


// Dispatcher Discovery Protocol

const dgram = require('dgram');
const EventEmitter = require('events');

var event = new EventEmitter();
module.exports.event = event;

module.exports.execute = function () {
   const socket = dgram.createSocket('udp4');

   socket.on('listening', function () {

      const message = "NewWorker";

      socket.setBroadcast(true);
      socket.send(message, 0, message.length, 16180, '255.255.255.255');
   });

   socket.on('message', (message, rinfo) => {
      event.emit('dispatcher_response', rinfo.address);
   });

   // Bind to any port
   socket.bind();
}