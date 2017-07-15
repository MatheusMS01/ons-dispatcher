'use strict';

const fs = require('fs')
const mongoose = require('mongoose');
//const Binary = require('./binary')
const User = require('../../ons-dispatcher/database/models/user')

mongoose.connect('mongodb://localhost/ons', { useMongoClient: true });

var db = mongoose.connection;

db.on('error', function (err) {
   console.log(err);
});

fs.readFile(__dirname + '/binary/eonsim.jar', 'utf8', function (err, data) {
   if (err) {
      return console.log(err);
   }

   var user = new User({
      email: 'matheus.m.sarmento@gmail.com',
      name: 'Matheus Medeiros Sarmento',
      password: '16180'
   })

   user.save(function (err, user) {
      if (err) return console.log(err);

      console.log(user);
   })

   //var binary = new Binary({
   //   name: 'eonsim.jar',
   //   username: 'andre',
   //   binary: data
   //});

   //binary.save(function (err, binary) {
   //   if (err) return console.error(err);

   //   console.log(binary.length);
   //});

   //var id = '_id'

   //Binary.findOne({username: 'andre'}, function (err, test) {
   //   console.log(test[id])
   //})
});