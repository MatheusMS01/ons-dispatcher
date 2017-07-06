// Copyright (c) 2017 Matheus Medeiros Sarmento

var dwp_handler = require("./dwp_handler");
const worker_discovery = require("./worker_discovery")

module.exports = function () {
   dwp_handler.execute();
   worker_discovery();
}