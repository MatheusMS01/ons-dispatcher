////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

'use strict';

const simulator = require('./simulator');
const worker = require('./worker');
const ddp = require('./ddp');
const communication = require('./communication');
const log4js = require('log4js');

log4js.configure({
   appenders: [
      { type: 'console' },
      { type: 'file', filename: 'logs/app.log', category: 'app' }
   ]
});

try {
   //simulator();
   //worker();
   ddp.execute();
   communication();
} catch (err) {
   // Unhandled catch
   logger.error(err);
}
