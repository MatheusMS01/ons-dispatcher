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

const SimulationProperty = require('../../database/models/simulation_property');
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

      // Insert new worker to the pool
      workerPool.push(socket);

      // Emit to UDP discovery
      event.emit('new_worker', socket.remoteAddress);

      // Since new worker is online, check if there are simulations pending
      event.emit('request_resources');

      logger.debug(socket.remoteAddress + ":" + socket.remotePort + " connected");

      socket.once('close', () => {

         removeWorker(socket);

         // All simulations from that worker were not completed
         // Set state to pending again
         Simulation.find(
            {
               'worker': socket.remoteAddress
            }).
            exec((err, res) => {
               for (var index = 0; index < res.length; ++index) {
                  res[index].worker = undefined;
                  res[index].state = Simulation.State.Pending;

                  res[index].save((err) => {
                     if (err) return logger.error(err);

                     // Simulation is pending again
                     event.emit('request_resources');
                  });
               }
            });

         logger.debug("Worker " + socket.remoteAddress + " left the pool");

         if (workerPool.length === 0) {
            logger.warn("There are no workers left");
            return;
         }

         computeMostIdleWorker();
      });

      socket.on('data', (data) => {
         // Treat chunk data
         buffer += data;

         var packet;
         try {
            do {
               packet = factory.expose(buffer);
               buffer = factory.remove(buffer);
            } while (buffer.length !== 0)
         } catch (err) {
            return;
         }

         treat(packet, socket);
      });

      socket.on('error', () => { });
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
   for (var index = 0; index < workerPool.length; ++index) {
      workerPool[index].write(resource_request.format());
   }

});

event.on('run_simulation', (worker) => {

   // Find simulation with highest priority which is still pending
   Simulation.findOne({ 'state': Simulation.State.Pending }).
      populate({
         path: '_simulationProperty',
         select: '_binary _document priority',
         populate: {
            path: '_binary _document',
         },
         options: {
            sort: { 'priority': -1 }
         }
      }).
      exec((err, simulation) => {
         if (err) return logger.error(err);

         if (simulation === null) {
            // No simulations are pending
            logger.debug("No simulations are pending");
            return;
         }

         const pdu = simulation_request.format({ Data: simulation });
         worker.write(pdu, () => {

            simulation.state = Simulation.State.Executing;
            simulation.worker = worker.remoteAddress;

            simulation.save((err) => {
               if (err) return logger.error(err);

               //event.emit('request_resources');
            });
         });
      });
});

function removeWorker(worker) {

   {
      const index = workerPool.indexOf(worker);

      if (index > -1) {
         workerPool.splice(index, 1);
      }
   }

   // Worker leaves network while computing most idle machine
   // This might be a rare scenario, but must be prevented since may cause locking
   for (var index = 0; index < availabilityList.length; ++index) {
      if (availabilityList[index].Worker === worker) {
         availabilityList.splice(index, 1);
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

         availabilityList.push({ Worker: socket, Memory: object.Memory, CPU: object.CPU });

         computeMostIdleWorker();

         break;

      case factory.Id.SimulationResponse:

         // treat_simulation_response
         if (object.Result === simulation_response.Result.Success) {

            // @TODO: Remove this workaround then simulator is adjusted
            var output = object.Output;
            output = output.replace(/,([^,]*)$/, '$1');

            try {
               output = JSON.parse(output);
               object.Output = JSON.stringify(output);
            } catch (err) {
               return logger.error(err);
            }

            //const keys = Object.keys(output);

            //for (var index = 0; index < keys.length; ++index) {
            //   console.log(keys[index] + ":" + output[keys[index]]);
            //}

            Simulation.findByIdAndUpdate(object.SimulationId,
               {
                  result: object.Output,
                  state: Simulation.State.Finished,
                  $unset: { worker: 1 }
               },
               (err, simulation) => {
                  if (err) return logger.error(err);
                  // Count if there are simulations that are not finished yet
                  Simulation.count(
                     {
                        _simulationProperty: simulation._simulationProperty,
                        $or: [{ state: Simulation.State.Pending }, { state: Simulation.State.Executing }]
                     },
                     (err, count) => {
                        if (err) return logger.error(err);

                        if (count === 0) {
                           // Update simulation property to finished
                           SimulationProperty.findByIdAndUpdate(simulation._simulationProperty,
                              {
                                 state: SimulationProperty.State.Finished
                              },
                              (err) => {
                                 if (err) return logger.error(err);
                              });
                        }

                        event.emit('request_resources');
                     });
               });

         } else {
            logger.error(object.SimulationId + " executed with Failure " + object.ErrorMessage);

            Simulation.findByIdAndUpdate(object.SimulationId,
               {
                  state: Simulation.State.Pending,
                  $unset: worker,
               },
               (err) => {
                  if (err) return logger.error(err);

                  event.emit('request_resources');
               });
         }

         break;

      default:
         return logger.error("Invalid message received from " + socket.remoteAddress);

   }
}

function computeMostIdleWorker() {

   if (availabilityList.length !== workerPool.length) {
      // Not all resources were received
      return;
   }

   // Temporary map to store most idle worker
   var mostIdle = { Memory: 0, CPU: 0 };

   for (var index = 0; index < availabilityList.length; ++index) {
      if (availabilityList[index].CPU > mostIdle.CPU) {
         mostIdle.Worker = availabilityList[index].Worker;
         mostIdle.CPU = availabilityList[index].CPU;
      }
   }

   // Clean list
   availabilityList = [];

   // 30% of free CPU. This parameter was chosen in order to avoid lag
   if (mostIdle.CPU >= 0.30) {
      // Emit event announcing that every worker sent its resources and this is the most idle
      event.emit('run_simulation', mostIdle.Worker);
   }

}