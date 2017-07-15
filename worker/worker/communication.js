////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const net = require('net');
const log4js = require('log4js');
const ddp = require('./ddp')
const factory = require('../../protocol/dwp/factory')
const resource = require('./resource')
const resource_response = require('../../protocol/dwp/pdu/resource_response')

log4js.configure({
   appenders: [
      { type: 'console' },
      { type: 'file', filename: 'logs/communication.log', category: 'communication' }
   ]
});

// Responsible for loggin into console and log file
const logger = log4js.getLogger('communication');

module.exports = function () {

   // Remove from local cache
   ddp.event.on('dispatcher_response', function (dispatcherAddress) {

      logger.debug('Response received! Trying to connect to ' + dispatcherAddress + ':16180');
      // TCP socket in which all the communication dispatcher-workers will be accomplished
      var socket = new net.Socket();

      socket.connect(16180, dispatcherAddress, function () {

      });

      socket.on('data', function (data) {
         treat(data, socket);
      });

      socket.on('error', function (err) {
         socket.destroy();
         process.exit();
      })
   });
}

function treat(data, socket) {
   var object = JSON.parse(data.toString());

   if (object['Id'] === undefined) {
      logger.error('Id not found in message!');
      return;
   }

   const id = Number(object['Id']);

   switch (id) {

      case factory.Id.ResourceRequest:
         // Format response
         var response = resource_response.format({
            Memory: resource.getMemoryAvailability()
         });

         // Verify if format succeeded
         if (response === false) {
            logger.error("Message was built incorrectly");
            return;
         }

         // Respond dispatcher
         socket.write(response);
         break;

      default:
         logger.error("Invalid Id!");
         return;
   }
}