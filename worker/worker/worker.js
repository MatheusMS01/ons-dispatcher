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

this.socket;
this.dispatcherAddress;
this.dispatcherPort;

module.exports = function () {

   this.parser = new xml2js.Parser();

   fs.readFile('./Config/Config.xml', function (error, data) {
      parser.parseString(data, function (error, result) {
         this.dispatcherAddress = String(result.Dispatcher.Address);
         this.dispatcherPort = Number(result.Dispatcher.Port);
      });
   });

   // @TODO: verify why this.dispatcherPort(61337) is not acceptable here
   this.socket = net.connect(61337, this.dispatcherAddress);

   this.socket.on('data', (data) => {

      logger.warn(data);

      this.buffer += data;

      if (buffer.match('...END...')) {

         var lines = this.buffer.split("\n");

         this.buffer = this.buffer.replace(/undefined/, '');
         this.buffer = this.buffer.replace(lines[lines.length - 1], '');
         this.buffer = this.buffer.replace(lines[0], '');


         fs.writeFile(__dirname + "/tmp/simulation.xml", this.buffer, function (err) {
            if (err) {
               return logger.error(err);
            }

            logger.debug("Successfully saved!");
         });
      }
   });

}

