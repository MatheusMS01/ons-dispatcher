////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const ip = require("ip");
const net = require('net');
const log4js = require('log4js');
const factory = require('../../../protocol/dwp/factory')
const worker_discovery = require('./worker_discovery')
const EventEmitter = require('events');

const Simulation = require('../../database/models/simulation');
const SimulationInstance = require('../../database/models/simulation_instance');

const resourceRequest = require('../../../protocol/dwp/pdu/resource_request')
const simulationRequest = require('../../../protocol/dwp/pdu/simulation_request')
const simulationResponse = require('../../../protocol/dwp/pdu/simulation_response')
const simulationTerminateRequest = require('../../../protocol/dwp/pdu/simulation_terminate_request')

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
         Simulation.find({ 'worker': socket.remoteAddress })
            .exec((err, res) => {

               for (let index = 0; index < res.length; ++index) {
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
   server.listen(16180, ip.address(), () => {
      logger.debug("TCP server listening " + server.address().address + ":" + server.address().port);
   });
}

event.on('request_resources', () => {

   // Request resource information from all workers
   for (var index = 0; index < workerPool.length; ++index) {
      workerPool[index].write(resourceRequest.format());
   }

});

event.on('run_simulation', (worker) => {

   // Find simulation with highest priority which is still pending
   SimulationInstance.findOne({ 'state': SimulationInstance.State.Pending }).
      populate({
         path: '_simulation',
         select: '_binary _document _simulationGroup',
         populate: {
            path: '_binary _document _simulationGroup',
         },
         options: {
            sort: { '_simulationGroup.priority': -1 }
         }
      }).
      exec((err, simulationInstance) => {
         if (err) return logger.error(err);

         if (simulationInstance === null) {
            // No simulations are pending
            logger.debug("No simulations are pending");
            return;
         }

         const pdu = simulationRequest.format({ Data: simulationInstance });
         worker.write(pdu, () => {

            simulationInstance.state = Simulation.State.Executing;
            simulationInstance.worker = worker.remoteAddress;

            simulationInstance.save((err) => {
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
         if (object.Result === simulationResponse.Result.Success) {

            // @TODO: Remove this workaround then simulator is adjusted
            var output = object.Output;
            output = output.replace(/,([^,]*)$/, '$1');

            try {
               output = JSON.parse(output);
               object.Output = JSON.stringify(output);
            } catch (err) {
               return logger.error(err);
            }

            var simulationInstanceUpdate = {
               result: object.Output,
               state: Simulation.State.Finished,
               $unset: { worker: 1 }
            }

            SimulationInstance.findByIdAndUpdate(object.SimulationId, 
                  simulationInstanceUpdate, 
                  (err, simulationInstance) => {
               if (err) return logger.error(err);
               // Count if there are simulations that are not finished yet
               SimulationInstance.count({
                  _simulation: simulationInstance._simulation,
                  $or: [{ state: SimulationInstance.State.Pending }, 
                        { state: SimulationInstance.State.Executing }]
               },
                  (err, count) => {
                     if (err) return logger.error(err);

                     if (count === 0) {
                        // Update simulation to finished
                        Simulation.findByIdAndUpdate(simulationInstance._simulation, {
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

            SimulationInstance.findByIdAndUpdate(object.SimulationId, {
               state: Simulation.State.Pending,
               $unset: { worker: 1 },
            }, (err) => {
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