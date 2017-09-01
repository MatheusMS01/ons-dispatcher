const net = require('net');
const fs = require('fs');
const log4js = require('log4js');

log4js.configure({
   appenders: [
      { type: 'console' },
      { type: 'file', filename: 'logs/dispatcher.log', category: 'dispatcher' }
   ]
});

const logger = log4js.getLogger('dispatcher'); 

var m_server;
var m_socketList = [];

function createServer () {
   m_server = net.createServer();

   m_server.on('connection', function (socket) {

      m_socketList.push(socket);

      logger.debug(socket.remoteAddress + ':' + socket.remotePort + ' connected');

      socket.once('close', function () {
         const idx = m_socketList.indexOf(socket);

         if (idx > -1) {
            // Remove socket from list
            m_socketList.splice(idx, 1);
         }

         logger.debug(socket.remoteAddress + ':' + socket.remotePort + ' closed connection')
      });

      socket.on('error', function (error) {
         logger.error('Socket ' + socket.remoteAddress + ':' + socket.remotePort + ' error: ' + error.message)
      });
   });

   // Listen for connections
   m_server.listen(61337, 'localhost', function () {
      logger.debug('Listening on port ' + m_server.address().port);
   });
}

function dispatch(remoteAddress) {

   var scratchDirectory = 'cache/' + remoteAddress.replace(/:/g, '');
   var simulatorDirectory = scratchDirectory + '/simulator';
   var configurationDirectory = scratchDirectory + '/configuration';

   var simulatorName;
   var configurationName;

   fs.readdirSync(simulatorDirectory).forEach(file => {
      simulatorName = file;
   });

   fs.readdirSync(configurationDirectory).forEach(file => {
      configurationName = file;
   });

   // Send configuration:
   m_socketList.forEach(function (socket) {
      sendFile(socket, configurationDirectory + '/' + configurationName, configurationName)
   });

   // Send simulator:
   //m_socketList.forEach(function (socket) {
   //   sendFile(socket, simulatorDirectory + '/' + simulatorName, simulatorName)
   //});
}

function sendFile(socket, filePath, fileName) {

   var file = fs.readFileSync(filePath, 'utf8');

   socket.write(file, function () {
      // Send end string in order to worker know file end
      socket.write('...END(' + fileName + ')...');
   });
}

module.exports = { createServer, dispatch };