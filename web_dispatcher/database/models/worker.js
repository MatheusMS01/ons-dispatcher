////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

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
   }
});

module.exports = mongoose.model( 'Worker', workerSchema );