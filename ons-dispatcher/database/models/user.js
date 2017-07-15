////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
   email: {
      type: String,
      required: true,
      unique: true
   },
   name: {
      type: String,
      required: true
   },
   password: {
      type: String,
      required: true
   },
   admin: {
      type: Boolean,
      default: false
   }
})

module.exports = mongoose.model('User', userSchema);