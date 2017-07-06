


function parse(object) {
   return JSON.parse(object);
}

function stringfy(simulationId, seed, success, load, data) {
   var object = {
      "SimulationId": simulationId,
      "Seed": seed,
      "Success": success,
      "Load": load,
      "Data": data
   }

   return JSON.stringify(object);
}

module.exports = { parse, stringfy };