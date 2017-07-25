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
const simulation_response = require('../../protocol/dwp/pdu/simulation_response')
const fs = require('fs');
const exec = require('child_process').exec;

log4js.configure({
   appenders: [
      { type: 'console' },
      { type: 'file', filename: 'logs/communication.log', category: 'communication' }
   ]
});

// Responsible for loggin into console and log file
const logger = log4js.getLogger('communication');

var buffer = "";

var simulationPID = [];

module.exports = function () {

   // Remove from local cache
   ddp.event.on('dispatcher_response', (dispatcherAddress) => {

      logger.debug('Response received! Trying to connect to ' + dispatcherAddress + ':16180');
      // TCP socket in which all the communication dispatcher-workers will be accomplished
      var socket = new net.Socket();

      socket.connect(16180, dispatcherAddress, () => {

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

      socket.on('error', (err) => {
         socket.destroy();
         process.exit();
      })
   });
}

function treat(data, socket) {

   var object = JSON.parse(data);

   try {
      factory.validate(object);
   } catch (err) {
      return logger.error(err);
   }

   const id = Number(object.Id);

   switch (id) {

      case factory.Id.ResourceRequest:
         var data = { Memory: resource.getMemoryAvailable() };

         // Respond dispatcher
         socket.write(resource_response.format(data));
         break;

      case factory.Id.SimulationRequest:

         logger.debug("New simulation received!");

         var compileit = 'java -jar ONS_Default.jar simulation-myrmlsa.xml 5 10 10 1';

         var commandLine = "java -jar ";
         commandLine += object.Data.binaryId.name + " ";
         //commandLine += object['Data']['configurationId']['name'] + " ";
         commandLine += object.Data.seed + " ";
         commandLine += object.Data.load.current + " ";
         commandLine += object.Data.load.current + " 0";

         var child = exec(compileit, (err, stdout, stderr) => {

            var simulationId;

            for (var index = 0; index < simulationPID.length; ++index) {
               if (simulationPID[index].PID == child.pid) {
                  simulationId = simulationPID[index].SimulationId;
                  simulationPID.splice(index, 1);
                  break;
               }
            }

            var data = {};

            data.SimulationId = simulationId;

            if (err) {
               data.Result = simulation_response.Result.Failure;
               data.ErrorMessage = err;
            }

            if (stderr) {
               data.Result = simulation_response.Result.Failure;
               data.ErrorMessage = stderr;
            }

            if (stdout) {
               data.Result = simulation_response.Result.Success;
               data.Output = stdout;
               // Treat simulator output
            }

            socket.write(simulation_response.format(data));
         });

         simulationPID.push({
            'SimulationId': object.Data._id,
            'PID': child.pid,
         });

         // @FIXME: Apperantly, binary register is not saving properly. Size is bigger and file comes corrupted
         //var binary = new Buffer(object['Data']['binaryId']['binary']['data']);

         //fs.writeFile(object['Data']['binaryId']['name'], binary, (err) => {
         //   if (err) return logger.error(err);
         //});

         break;

      case factory.Id.SimulationTerminateRequest:
         var pid;

         for (var index = 0; index < simulationPID.length; ++index) {
            if (simulationPID[index].SimulationId == object.SimulationId) {
               pid = simulationPID[index].PID;
            }
         }

         if (pid !== undefined) {
            process.kill(pid);
         }

         break;

      default:
         return logger.error("Invalid Id!");
   }
}