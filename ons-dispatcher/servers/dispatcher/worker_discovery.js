////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const dgram = require('dgram');
const log4js = require('log4js');
const EventEmitter = require('events');
const communication = require('./communication');

log4js.configure({
   appenders: [
      { type: 'console' },
      { type: 'file', filename: 'logs/worker_discovery.log', category: 'worker_discovery' }
   ]
});

// Responsible for logging into console and log file
const logger = log4js.getLogger('worker_discovery');

// UDP socket which will receive workers requests
const socket = dgram.createSocket('udp4');

// List which is necessary for UDP lack of error treatment
var pendingList = [];

const event = new EventEmitter();

event.on('event', (workerInfo) => {

   logger.debug("Sending response to " + workerInfo.address + ":" + workerInfo.port)

   // Send response to worker
   socket.send(socket.address().address, workerInfo.port, workerInfo.address);

   pendingList.push(workerInfo.address);
});

module.exports.execute = function () {

   // Remove from local cache
   communication.event.on('new_worker', function (workerAddress) {

      var index = pendingList.indexOf(workerAddress);

      if (index > -1) {
         pendingList.splice(index, 1);
      }
   });

   socket.on('error', (err) => {
      logger.error(err.stack);
      socket.close();
   });

   socket.on('message', (message, rinfo) => {

      if (message.indexOf("NewWorker") <= -1) {
         // Discard this message
         logger.error("Invalid message!");
         return;
      }

      logger.debug(message.toString() + " from: " + rinfo.address);

      if (pendingList.indexOf(rinfo.address) === -1) {
         // New worker identified
         event.emit('event', rinfo);
      }
   });

   socket.on('listening', () => {
      logger.debug("UDP socket listening " + socket.address().address + ":" + socket.address().port);
   });

   require('dns').lookup(require('os').hostname(), function (err, add, fam) {
      socket.bind(16180, add);
   });
}