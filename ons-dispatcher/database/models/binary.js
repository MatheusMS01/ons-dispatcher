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
   userId: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
   }
   ],
   binary: {
      type: Buffer,
      required: true
   }
})

binarySchema.index({ name: 1, username: 1 }, { unique: true });

module.exports = mongoose.model('Binary', binarySchema);