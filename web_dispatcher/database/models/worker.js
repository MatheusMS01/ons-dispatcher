////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

const SimulationInstance = require( './simulation_instance' );

const workerSchema = Schema( {
   _user: {
      type: Schema.ObjectId,
      ref: 'User'
   },
   address: {
      type: String,
      required: true,
      unique: true
   },
   lastResource: {
      cpu: Number,
      memory: Number
   },
   runningInstances: {
      type: Number,
      default: 0
   }
});

module.exports = mongoose.model( 'Worker', workerSchema );