////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const Simulation = require('../../database/models/simulation');
const SimulationInstance = require('../../database/models/simulation_instance');
const EventEmitter = require('events');
const communication = require('./communication');

const event = new EventEmitter();

module.exports.event = event;

event.on('new_simulation', (id) => {

   Simulation.find({ _simulationGroup: id })
      .populate({
         path: '_simulationGroup',
         select: 'seedAmount load'
      })
      .exec((err, simulations) => {
         if (err) return console.log(err);

         var simulationInstanceArray = [];

         for (var index = 0; index < simulations.length; ++index) {

            for (var seed = 1; seed < simulations[index].seedAmount; ++seed) {
               for (var load = simulations[index].load.minimum;
                  load < simulations[index].load.maximum;
                  load += simulations[index].load.step) {

                     const simulationInstance = new SimulationInstance({
                        _simulation: simulation[index].id,
                        seed: seed,
                        load: load
                     });

                     simulationInstanceArray.push(simulationInstance);
               }

               SimulationInstance.insertMany(simulationInstanceArray, (err, simulationInstances) => {
                  if (err) return console.log(err);

                  communication.event.emit('request_resources');
               });
            }
         }
      });
});