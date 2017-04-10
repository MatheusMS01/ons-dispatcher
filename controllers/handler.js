// Copyright (c) 2017 Matheus Medeiros Sarmento

module.exports = function(app) {

   app.get('/', function(request, response) {
      response.render('index');
   });

   app.get('/simulation', function(request, response) {
      response.render('simulation');
   });

};