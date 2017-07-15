// Copyright (c) 2017 Matheus Medeiros Sarmento

const net = require('net');
const log4js = require('log4js');
const factory = require('../../../protocol/dwp/factory')
const worker_discovery = require('./worker_discovery')
const EventEmitter = require('events');

const resource_request = require('../../../protocol/dwp/pdu/resource_request')

log4js.configure({
   appenders: [
      { type: 'console' },
      { type: 'file', filename: 'logs/communication.log', category: 'communication' }
   ]
});

// Responsible for loggin into console and log file
const logger = log4js.getLogger('communication');

// TCP socket in which all the dispatcher-workers communication will be accomplished
const server = net.createServer();

var workerPool = [];

var event = new EventEmitter();
module.exports.event = event;

module.exports.execute = function () {

   server.on('connection', function (socket) {

      workerPool.push(socket);

      event.emit('new_worker', socket.remoteAddress);
      event.emit('new_simulation');

      logger.debug(socket.remoteAddress + ":" + socket.remotePort + " connected");

      socket.once('close', function () {

         removeWorker(socket);

         logger.warn("Worker " + socket.remoteAddress + " left the pool");

         if (workerPool.length === 0) {
            logger.warn("There are no workers left");
         }
      });

      socket.on('data', function (data) {
         treat(data.toString())
      });

      socket.on('error', function () {
      });
   });

   // Open Socket
   require('dns').lookup(require('os').hostname(), function (err, add) {
      server.listen(16180, add, function () {
         logger.debug("TCP server listening " + server.address().address + ":" + server.address().port);
      });
   });
}

event.on('new_simulation', function () {
   for (var itr = 0; itr < workerPool.length; ++itr) {
      workerPool[itr].write(resource_request.format())
   }
});

function removeWorker(worker) {
   const index = workerPool.indexOf(worker);

   if (index > -1) {
      workerPool.splice(index, 1);
   }
}

function treat(data) {

}