// Copyright (c) 2017 Matheus Medeiros Sarmento

var bodyParser = require('body-parser')
var express = require('express');
var formidable = require('formidable');
var fs = require('fs');
var path = require('path');

var urlencodedParser = bodyParser.urlencoded({extended: false});

module.exports = function(app) {

   app.get('/', function(request, response) {
      response.render('index');
   });

   app.get('/simulation', function(request, response) {
      response.render('simulation');
   });

   app.post('/topology', function(request, response) {
      response.render('topology');
   });

   app.post('/upload', function(req, res){

      // create an incoming form object
      var form = new formidable.IncomingForm();

      // store all uploads in the /uploads directory
      form.uploadDir = path.join(__dirname, '/../cache');

      // every time a file has been uploaded successfully,
      // rename it to it's orignal name
      form.on('file', function(field, file) {
         console.log(file.type);
         fs.rename(file.path, path.join(form.uploadDir, file.name));
      });

      // log any errors that occur
      form.on('error', function(err) {
         console.log('An error has occured: \n' + err);
      });

      // once all the files have been uploaded, send a response to the client
      form.on('end', function() {
         res.end('success');
      });

      // parse the incoming request containing the form data
      form.parse(req);

   });

   app.post('/configuration', urlencodedParser, function(req, res) {
      console.log(req.body);
   });

};