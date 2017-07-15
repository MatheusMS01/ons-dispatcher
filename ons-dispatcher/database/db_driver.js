////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const mongoose = require('mongoose');
const log4js = require('log4js');
const User = require('./models/user')

log4js.configure({
   appenders: [
      { type: 'console' },
      { type: 'file', filename: 'logs/db_driver.log', category: 'db_driver' }
   ]
});

// Responsible for loggin into console and log file
const logger = log4js.getLogger('db_driver');

module.exports = function () {
   mongoose.connect('mongodb://localhost/ons', { useMongoClient: true });

   var db = mongoose.connection;

   db.on('error', function (err) {
      logger.error(err);
   });
}