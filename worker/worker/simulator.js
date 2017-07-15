////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const spawn = require('child_process').spawn;

var log4js = require('log4js');

log4js.configure({
   appenders: [
      { type: 'console' },
      { type: 'file', filename: 'logs/simulator.log', category: 'simulator' }
   ]
});

const logger = log4js.getLogger('simulator');

module.exports = function () {

   for (var index = 0; index < 5; ++index) {
      var child = spawn('java', ['-jar', __dirname + '/tmp/ONS_Default.jar', __dirname + '/tmp/simulation-myrmlsa.xml', '1', '-trace']);

      child.on('close', (code) => {
         logger.debug('child process exited with code ' + code);
      });

      logger.warn('Passed here');
   }

}