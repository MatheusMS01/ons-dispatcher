/* Copyright (c) 2017 Matheus Medeiros Sarmento */

module.exports = function(app) {

app.get('/', function(request, response) {
   response.send(request.rawHeaders);
});

};