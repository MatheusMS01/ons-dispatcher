////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const spawn = require('child_process').spawn;

var log4js = require('log4js');

log4js.configure({
   appenders: [
      { type: 'console' },
      { type: 'file', filename: 'logs/simulator.log', category: 'simulator' }
   ]
});

const logger = log4js.getLogger('simulator');

module.exports = function () {
}