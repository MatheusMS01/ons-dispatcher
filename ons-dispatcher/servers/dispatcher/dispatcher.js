////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const communication = require('./communication');
const worker_discovery = require('./worker_discovery')
const log4js = require('log4js');

log4js.configure({
   appenders: [
      { type: 'console' },
      { type: 'file', filename: 'logs/dispatcher.log', category: 'dispatcher' }
   ]
});

module.exports = function () {
   try {
      communication.execute();
      worker_discovery.execute();
   } catch (err) {
      logger.error(err);
   }

}