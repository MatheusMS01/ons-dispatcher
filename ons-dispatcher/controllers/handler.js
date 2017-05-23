// Copyright (c) 2017 Matheus Medeiros Sarmento

var bodyParser = require('body-parser')
var express = require('express');
var formidable = require('formidable');
var fs = require('fs');
var path = require('path');
const dispatcher = require('./dispatcher');

var urlencodedParser = bodyParser.urlencoded({extended: false});

module.exports = function(app) {

   // var builder = require('xmlbuilder');
   // var xml = builder.create('root')
   //       .ele('xmlbuilder')
   //       .ele('repo', {'type': 'git'}, 'git://github.com/oozcitak/xmlbuilder-js.git')
   //       .end({ pretty: true});
   //
   // console.log(xml);

   app.get('/', function(request, response) {
      response.render('index');
   });

   app.get('/simulation', function(request, response) {
      response.render('simulation');
   });

   app.get('/topology', function(request, response) {
      response.render('topology');
   });

   app.post('/upload', function(request, response) {

      var form = new formidable.IncomingForm();

      form.parse(request, function (err, fields, files) {

         if (err) {
            return err;
         }

         // Create the Scratch directory, where every data from this user will be temporarily stored
         this.dir = __dirname + '/../cache/' + request.connection.remoteAddress.replace(/:/g, '') + "/" + fields.type;

         // Create directories recursively
         this.dir.split('/').forEach((dir, index, splits) => {
            const parent = splits.slice(0, index).join('/');
            const dirPath = path.resolve(parent, dir);
            if (!fs.existsSync(dirPath)) {
               fs.mkdirSync(dirPath);
            }
         });

         // Rename cached file (persist it) to scratch directory
         fs.rename(files.upload.path, path.join(this.dir, files.upload.name));
      });

   });

   app.post('/run', urlencodedParser, function (request, response) {
      dispatcher.dispatch(request.connection.remoteAddress);

      response.redirect(307, '/');

      // Delete from cache
   });
};