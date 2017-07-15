////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const communication = require('./communication');
const EventEmitter = require('events');
const User = require('../../database/models/user')

var event = new EventEmitter();
module.exports.event = event;

module.exports.execute = function () {

   event.on('new_simulation', function () {
      communication.event.emit('new_simulation');
   });

   // @TODO
   event.on('finished_simulation', function () {

   });
}