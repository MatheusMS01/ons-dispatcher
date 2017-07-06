// Copyright (c) 2017 Matheus Medeiros Sarmento
const net = require('net');
var log4js = require('log4js');
var dwp = require("../../../protocol/dwp/dwp")
const worker_discovery = require("./worker_discovery")
const EventEmitter = require('events');

log4js.configure({
   appenders: [
      { type: 'console' },
      { type: 'file', filename: 'logs/dwp_handler.log', category: 'dwp_handler' }
   ]
});

// Responsible for loggin into console and log file
const logger = log4js.getLogger('dwp_handler');

// TCP socket in which all the communication dispatcher-workers will be accomplished
const server = net.createServer();

var workerList = []

var eventEmitter = new EventEmitter();
module.exports.event = eventEmitter;

module.exports.execute = function () {

   server.on("connection", function (socket) {

      logger.debug("New worker connected");

      workerList.push(socket);

      eventEmitter.emit('new_worker', socket.remoteAddress);

      socket.once("close", function () {

      });

      socket.on("error", function (error) {

      });

   });

   // Listen for connections
   server.listen(16180, "localhost", function () {
      logger.debug("TCP server listening " + server.address().address + ":" + server.address().port);
   });
}