////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const communication = require('./communication');
const worker_discovery = require('./worker_discovery')
const simulation_handler = require('./simulation_handler')

module.exports = function () {
   communication.execute();
   worker_discovery.execute();
   simulation_handler.execute();
}