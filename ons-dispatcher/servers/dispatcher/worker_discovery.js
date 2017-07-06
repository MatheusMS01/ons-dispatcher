// Copyright (c) 2017 Matheus Medeiros Sarmento
const dgram = require('dgram');
var log4js = require('log4js');
const EventEmitter = require('events');
var dwp_handler = require('./dwp_handler');

log4js.configure({
   appenders: [
      { type: 'console' },
      { type: 'file', filename: 'logs/worker_discovery.log', category: 'worker_discovery' }
   ]
});

// Responsible for loggin into console and log file
const logger = log4js.getLogger('worker_discovery');

// UDP socket which will receive workers requests
const server = dgram.createSocket('udp4');

// List which is necessary for UDP lack of error treatment
var pendingList = [];

class Responder extends EventEmitter { }
const responder = new Responder();

responder.on('event', (workerInfo) => {

   // Send response to worker
   server.send(server.address().address, workerInfo.port, workerInfo.address);

   pendingList.push(workerInfo.address);
});

module.exports = function () {

   // Remove from local cache
   dwp_handler.event.on('new_worker', function (workerAddress) {

      var index = pendingList.indexOf(workerAddress);

      if (index > -1) {
         pendingList.splice(index, 1);
      }
   });

   server.on('error', (err) => {
      logger.error(err.stack);
      server.close();
   });

   server.on('message', (message, rinfo) => {

      if (pendingList.indexOf(rinfo.address) === -1) {
         // New worker identified
         responder.emit('event', rinfo);
      }
   });

   server.on('listening', () => {
      logger.debug("UDP server listening " + server.address().address + ":" + server.address().port);
   });

   server.bind(16180, 'localhost');
}