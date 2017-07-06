var simulation_result = require('./simulation_result')

// Works as an Enum
const ProtocolId = {
   SimulationResult: 1,
   SimulationFinished: 2,
   RequestResourceInformation: 3,
   SimulationRequest: 4,
   SimulationTerminate: 5,
}

function stringfy(protocolId) {

   var object;
   object = {
      "ProtocolId": protocolId
   }

   switch (protocolId) {
      case ProtocolId.SimulationResult:
         break;
   }


   console.log(object);
}

module.exports = { stringfy }

exports.ProtocolId = ProtocolId;