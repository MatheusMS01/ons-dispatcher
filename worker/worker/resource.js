////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const os = require('os');

module.exports.getMemoryAvailable = function () {
   return os.freemem() / os.totalmem();
}

module.exports.getArchitecture = function () {
   return os.arch();
}