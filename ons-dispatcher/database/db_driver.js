////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const mongoose = require('mongoose');
const log4js = require('log4js');
const fs = require('fs')

const User = require('./models/user');
const Binary = require('./models/binary');
const Simulation = require('./models/simulation').Schema;

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
      throw err;
   });

   //var simulation = new Simulation({
   //   'userId': '596a64a2300ef417ece08a5d',
   //   'binaryId': '596a6561cbf67d56e4022f28',
   //   'seed': 5,
   //   'priority': 10,
   //   'state': 1,
   //   'load': {
   //      'min': 10,
   //      'max': 100,
   //      'step': 10,
   //      'current': 20,
   //   }
   //})

   //simulation.save(function (err) {
   //   if (err) logger.error(err);
   //})
}