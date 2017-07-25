////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const binarySchema = Schema({
   name: {
      type: String,
      required: true,
      unique: true
   },
   binary: {
      type: Buffer,
      required: true
   }
})

module.exports = mongoose.model('Binary', binarySchema);