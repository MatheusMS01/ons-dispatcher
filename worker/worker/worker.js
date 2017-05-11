const net = require('net');
const xml2js = require('xml2js')
const fs = require('fs');

var log4js = require('log4js');

log4js.configure({
   appenders: [
      { type: 'console' },
      { type: 'file', filename: 'logs/worker.log', category: 'worker' }
   ]
});

const logger = log4js.getLogger('worker');

var m_socket;
var m_dispatcherAddress;
var m_dispatcherPort;

module.exports = function () {

   var parser = new xml2js.Parser();

   fs.readFile('./Config/Config.xml', function (error, data) {
      parser.parseString(data, function (error, result) {
         m_dispatcherAddress = String(result.Dispatcher.Address);
         m_dispatcherPort = Number(result.Dispatcher.Port);
      });
   });

   // @TODO: verify why m_dispatcherPort is not acceptable here
   m_socket = net.connect(61337, m_dispatcherAddress);

   m_socket.on('data', (data) => {
      logger.debug(data.toString());
   });

}