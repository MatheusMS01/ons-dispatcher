////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const SimulationProperty = require('../../database/models/simulation_property')
const Simulation = require('../../database/models/simulation')
const EventEmitter = require('events');
const communication = require('./communication')

const event = new EventEmitter();

module.exports.event = event;

event.on('new_simulation', (id) => {
   SimulationProperty.findById(id, (err, simulationProperty) => {

      for (var seed = 1; seed <= simulationProperty.seedAmount; ++seed) {
         for (var load = simulationProperty.load.Min; load <= simulationProperty.load.Max; load += simulationProperty.load.Step) {
            const simulation = new Simulation({
               _simulationProperty: id,
               seed: seed,
               load: load,
            });

            simulation.save();
         }
      }

      communication.event.emit('request_resources');
   });
});