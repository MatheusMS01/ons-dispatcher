// var exec = require('child_process').exec;
//
// module.exports = function(app) {
//    var commandLine = 'java -jar ' + __dirname + '\\..\\cache\\1\\eonsim.jar ' + __dirname + '\\..\\cache\\1\\simulation.xml $1 50 290 30';
//
//    console.log(commandLine);
//    exec(commandLine, function(error, stdout, stderr) {
//    });
// }

const net = require("net");
var log4js = require('log4js');

var server;

function createServer() {
   server = net.createServer();

   server.on("connection", function() {

   });

   // Listen for connections
   server.listen(61337, "localhost", function () {
      console.log("Server: Listening");
   });
}

function dispatch(remoteAddress) {
   // Let's response with a hello message
   conn.write(
      JSON.stringify({ response: "Hey there client!" })
   );
}

module.exports = { createServer }