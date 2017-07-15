////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const mongoose = require('mongoose');

const binarySchema = mongoose.Schema({
   name: {
      type: String,
      required: true
   },
   username: {
      type: String,
      required: true
   },
   binary: {
      type: Buffer,
      required: true
   }
})

binarySchema.index({ name: 1, username: 1 }, { unique: true });

module.exports = mongoose.model('Binary', binarySchema);