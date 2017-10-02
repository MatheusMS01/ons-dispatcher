////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const config = require( './configuration' ).getConfiguration();

var workers = [];

module.exports.add = function add(workerAddress) {

   for (var idx = 0; idx < workers.length; ++idx) {

      var worker = workers[idx];

      if (worker.address !== workerAddress) {
         continue;
      }

      return;
   }

   workers.push({ address: workerAddress, runningInstances: 0 });
}

module.exports.update = function update(workerAddress, update) {

   for (var idx = 0; idx < workers.length; ++idx) {

      var worker = workers[idx];

      if (worker.address !== workerAddress) {
         continue;
      }

      for (var key in update) {
         worker[key] = update[key];
      }

      break;
   }
}

module.exports.get = function get(workerAddress) {

   for (var idx = 0; idx < workers.length; ++idx) {

      var worker = workers[idx];

      if (worker.address !== workerAddress) {
         continue;
      }

      return worker;
   }

   return {};
}

module.exports.getAll = function() {

   var workersSubset = [];

   for (var idx = 0; idx < workers.length; ++idx) {

      if( workers[idx].lastResource === undefined ) {
         continue;
      }

      workersSubset.push(workers[idx]);
   }

   return workersSubset;
}

module.exports.getMostIdle = function getMostIdle() {

   var mostIdle = { address: '', weightedMean: 0 };

   for (var idx = 0; idx < workers.length; ++idx) {

      if( workers[idx].lastResource === undefined ) {
         continue;
      }

      const address = workers[idx].address;

      const cpu = workers[idx].lastResource.cpu;
      const memory = workers[idx].lastResource.memory;

      const cpuWeight = config.cpu.weight;
      const memoryWeight = config.memory.weight;

      const weightedMean = ( ( cpu * cpuWeight ) + ( memory * memoryWeight ) ) / ( cpuWeight + memoryWeight );

      if( weightedMean > mostIdle.weightedMean ) {
         mostIdle.address = address;
         mostIdle.weightedMean = weightedMean;
         mostIdle.cpu = cpu;
         mostIdle.memory = memory;
      }
   }

   return mostIdle;
}

module.exports.remove = function remove(workerAddress) {

   for (var idx = 0; idx < workers.length; ++idx) {

      var worker = workers[idx];

      if (worker.address !== workerAddress) {
         continue;
      }

      workers.splice(idx, 1);
      break;
   }
}