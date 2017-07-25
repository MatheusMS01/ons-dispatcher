////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

// Dispatcher Discovery Protocol

const dgram = require('dgram');
const EventEmitter = require('events');
const log4js = require('log4js');

log4js.configure({
   appenders: [
      { type: 'console' },
      { type: 'file', filename: 'logs/ddp.log', category: 'ddp' }
   ]
});

var event = new EventEmitter();
module.exports.event = event;

var receivedResponse = false;

// Responsible for loggin into console and log file
const logger = log4js.getLogger('ddp');


module.exports.execute = function () {
   const socket = dgram.createSocket('udp4');

   socket.on('listening', () => {

      const message = "NewWorker";

      socket.setBroadcast(true);

      // Send message and wait for dispatcher's response
      // If it did not respond, send another time for each 1 second
      socket.send(message, 0, message.length, 16180, '255.255.255.255');

      var tries = 0;

      var intervalId = setInterval(() => {

         if (tries >= 10) {
            logger.warn("Dispatcher not found after " + tries + " tries");
            process.exit();
         }

         if (receivedResponse) {
            clearInterval(intervalId);
            return;
         }

         socket.send(message, 0, message.length, 16180, '255.255.255.255');

         ++tries;
      }, 1000);
   });

   socket.on('message', (message, rinfo) => {

      // @TODO: Validate message

      if (!receivedResponse) {
         // Avoid duplicates
         event.emit('dispatcher_response', rinfo.address);
         receivedResponse = true;
      }
   });

   // Bind to any port
   socket.bind();
}