////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const State = {
   Executing:  0,
   Finished:   1,
}

const simulationGroupSchema = Schema({

   _user: {
      type: Schema.ObjectId,
      ref: 'User',
      required: true,
   },
   name: {
      type: String,
      required: true,
      unique: true,
   },
   seedAmount: {
      type: Number,
      required: true,
   },
   load: {
      minimum: Number,
      maximum: Number,
      step: Number,
   },
   priority: {
      type: Number,
      default: 0,
   },
   state: {
      type: Number,
      default: State.Executing,
   },
   startTime: {
      type: Date,
      default: Date.now
   },
   endTime: {
      type: Date
   }

});

simulationGroupSchema.statics.State = State;

simulationGroupSchema.index({ _user: 1, _binary: 1, _document: 1 }, { unique: true });

module.exports = mongoose.model('SimulationGroup', simulationGroupSchema);