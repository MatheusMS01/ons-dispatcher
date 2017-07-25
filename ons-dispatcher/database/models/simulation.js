////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const State = {
   Pending:    0,
   Executing:  1,
   Finished:   2
}

module.exports.State = State;

const simulationSchema = Schema({
   userId: {
      type: Schema.ObjectId,
      ref: 'User',
      required: true
   },
   binaryId: {
      type: Schema.ObjectId,
      ref: 'Binary',
      required: true
   },
   //configurationId: {
   //   type: Schema.ObjectId,
   //   ref: 'Configuration',
   //   required: true
   //},
   state: {
      type: Number,
      default: State.Pending
   },
   seed: {
      type: Number,
      required: true,
   },
   priority: {
      type: Number,
      default: 0
   },
   load: {
      min: Number,
      max: Number,
      step: Number,
      current: Number
   },
   worker: {
      type: String
   }
})

simulationSchema.index({ userId: 1, binaryId: 1/*, configurationId: 1*/ }, { unique: true });

module.exports.Schema = mongoose.model('Simulation', simulationSchema);