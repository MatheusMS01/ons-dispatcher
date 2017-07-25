////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const net = require('net');
const log4js = require('log4js');
const factory = require('../../../protocol/dwp/factory')
const worker_discovery = require('./worker_discovery')
const EventEmitter = require('events');

const Simulation = require('../../database/models/simulation');

const resource_request = require('../../../protocol/dwp/pdu/resource_request')
const simulation_request = require('../../../protocol/dwp/pdu/simulation_request')
const simulation_response = require('../../../protocol/dwp/pdu/simulation_response')
const simulation_terminate_request = require('../../../protocol/dwp/pdu/simulation_terminate_request')

log4js.configure({
   appenders: [
      { type: 'console' },
      { type: 'file', filename: 'logs/communication.log', category: 'communication' }
   ]
});

// Responsible for logging into console and log file
const logger = log4js.getLogger('communication');

// TCP socket in which all the dispatcher-workers communication will be accomplished
const server = net.createServer();

var workerPool = [];

var availabilityList = [];

var buffer = "";

var event = new EventEmitter();
module.exports.event = event;

module.exports.execute = function () {

   server.on('connection', (socket) => {

      workerPool.push(socket);

      event.emit('new_worker', socket.remoteAddress);
      event.emit('request_resources');

      logger.debug(socket.remoteAddress + ":" + socket.remotePort + " connected");

      socket.once('close', () => {

         removeWorker(socket);

         logger.debug("Worker " + socket.remoteAddress + " left the pool");

         if (workerPool.length === 0) {
            logger.warn("There are no workers left");
         }
      });

      socket.on('data', (data) => {
         // Treat chunk data
         buffer += data;

         try {
            do {
               treat(factory.expose(buffer), socket);
               buffer = factory.remove(buffer);
            } while (buffer.length !== 0)
         } catch (err) {
            return;
         }
      });

      socket.on('error', () => {
      });
   });

   // Open Socket
   require('dns').lookup(require('os').hostname(), function (err, add) {
      server.listen(16180, add, () => {
         logger.debug("TCP server listening " + server.address().address + ":" + server.address().port);
      });
   });
}

event.on('request_resources', () => {

   // Request resource information from all workers
   for (var itr = 0; itr < workerPool.length; ++itr) {
      workerPool[itr].write(resource_request.format());
   }

});

event.on('run_simulation', (worker) => {

   // Find simulation with highest priority which is still pending
   Simulation.Schema.findOne({
      'state': Simulation.State.Pending
   }).populate('binaryId').
      sort('-priority').
      exec((err, simulation) => {
         if (err) return logger.error(err);

         if (simulation === null) {
            // No simulations are pending
            return;
         }

         if (simulation.load.current === undefined) {
            // First execution
            simulation.load.current = simulation.load.min;
            simulation.save();
         }

         const pdu = simulation_request.format({ Data: simulation });
         worker.write(pdu);

         //simulation.state = Simulation.State.Executing;
         //simulation.worker = worker.remoteAddress;
      });

   // Find simulation with highest priority which is executing, but no worker is executing
   Simulation.Schema.findOne({
      'state': Simulation.State.Executing,
   }).exists('worker', false).
      populate('binaryId').
      sort('-priority').
      exec((err, simulation) => {
         if (err) return logger.error(err);

         if (simulation === null) {
            return;
         }

         const pdu = simulation_request.format({ Data: simulation });
         worker.write(pdu);
      });

})

function removeWorker(worker) {

   {
      const index = workerPool.indexOf(worker);

      if (index > -1) {
         workerPool.splice(index, 1);
      }
   }

   // Worker leaves network while computing most idle machine
   // This might be a rare scenario, but must be prevented since may cause locking
   {
      for (var index = 0; index < availabilityList.length; ++index) {
         if (availabilityList[index].Worker === worker) {
            availabilityList.splice(index, 1);
         }
      }
   }

}

function treat(data, socket) {
   var object = JSON.parse(data.toString());

   try {
      factory.validate(object);
   } catch (err) {
      return logger.error(err);
   }

   switch (object.Id) {

      case factory.Id.ResourceResponse:

         availabilityList.push({ Worker: socket, Memory: object.Memory });

         if (availabilityList.length !== workerPool.length) {
            // Not all resources were received
            return;
         }

         // Temporary map to store most idle worker
         var mostIdle = { Memory: 0 };

         for (var itr = 0; itr < availabilityList.length; ++itr) {
            if (availabilityList[itr].Memory > mostIdle.Memory) {
               mostIdle.Worker = availabilityList[itr].Worker;
               mostIdle.Memory = availabilityList[itr].Memory;
            }
         }

         // Clean list
         availabilityList = [];

         // 10% of free memory. This parameter was chosen in order to avoid lag
         if (mostIdle.Memory >= 0.10) {
            // Emit event announcing that every worker sent its resources and this is the most idle
            event.emit('run_simulation', mostIdle.Worker);
         }

         break;

      case factory.Id.SimulationResponse:

         if (object.Result === simulation_response.Result.Success) {
            logger.debug(object.SimulationId + " executed with Success " + object.Output);
         } else {
            logger.error(object.SimulationId + " executed with Failure " + object.ErrorMessage );
         }

         break;

      default:
         return logger.error("Invalid message received from " + socket.remoteAddress);

   }
}

// Query to obtain simulation with user + binary

//Simulation.
//   findById({ _id: simulationId }).
//   populate('userId').
//   populate('binaryId').
//   exec(function (err, simulation) {
//      if (err) return handleError(err);
//      console.log(simulation.state);

//   });