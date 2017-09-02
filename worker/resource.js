////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const os = require('os');
const os_utils = require('os-utils')

module.exports.getMemoryAvailable = function () {
   return os.freemem() / os.totalmem();
}

module.exports.getCPUAvailable = function (callback) {
   os_utils.cpuUsage(callback);
}