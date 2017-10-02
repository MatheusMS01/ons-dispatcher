////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const communication = require('./communication');
const worker_discovery = require( './worker_discovery' )

const log4js = require( 'log4js' );

log4js.configure( {
   appenders: {
      out: { type: 'stdout' },
      app: { type: 'file', filename: 'log/dispatcher.log' }
   },
   categories: {
      default: { appenders: ['out', 'app'], level: 'debug' }
   }
});

const logger = log4js.getLogger();

module.exports = function () {

   try {
      communication.execute();
      worker_discovery.execute();
   } catch (err) {
      logger.error(err);
   }

}