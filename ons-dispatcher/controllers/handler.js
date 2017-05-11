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

   app.post('/upload', function(request, response){

      // create an incoming form object
      var form = new formidable.IncomingForm();

      // Create the Scratch directory, where every data from this user will be stored
      // Since remoteAddress uses IPv6, and has invalid characters for folder name, replace it
      var dir = __dirname + '/../cache/' + request.connection.remoteAddress.replace(/:/g, '');

      if (!fs.existsSync(dir)){
         fs.mkdirSync(dir);
      }

      form.uploadDir = path.join(dir);

      // every time a file has been uploaded successfully, rename it to it's original name
      form.on('file', function(field, file) {
         fs.rename(file.path, path.join(form.uploadDir, file.name));
      });

      // log any errors that occur
      form.on('error', function(err) {
         console.log('An error has occured: \n' + err);
      });

      // once all the files have been uploaded, send a response to the client
      form.on('end', function() {
         response.end('success');
      });

      // parse the incoming request containing the form data
      form.parse(request);

   });

   app.post('/run', urlencodedParser, function (request, response) {
      dispatcher.dispatch(request.connection.remoteAddress);
   });
};