////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const mongoose = require('mongoose');
const log4js = require('log4js');

log4js.configure({
   appenders: [
      { type: 'console' },
      { type: 'file', filename: 'logs/db_driver.log', category: 'db_driver' }
   ]
});

// Responsible for loggin into console and log file
const logger = log4js.getLogger('db_driver');

module.exports = function ( mongoUrl, mongoOptions ) {

   mongoose.Promise = require( 'bluebird' );
   mongoose.connect(mongoUrl, mongoOptions);

   var connection = mongoose.connection;

   connection.on('error', (err) => {
      throw err;
   });

}