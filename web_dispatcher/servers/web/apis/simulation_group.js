////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const SimulationGroup = require('../../../database/models/simulation_group');

module.exports = function (app) {

   app.get('/api/count_executing_simulation_groups', (req, res) => {

      const simulationGroupFilter = {
         state: SimulationGroup.State.Executing,
         _user: req.user.id
      };

      var promise = SimulationGroup.count(simulationGroupFilter);

      promise.then(function (count) {

         res.send({ 'result': count });

      }).catch(function (e) {

         res.sendStatus(500);

      });
   });

   app.get('/api/count_finished_simulation_groups', (req, res) => {

      const simulationGroupFilter = {
         state: SimulationGroup.State.Finished,
         _user: req.user.id
      };

      var promise = SimulationGroup.count(simulationGroupFilter);

      promise.then(function (count) {

         res.send({ 'result': count });

      }).catch(function (e) {

         res.sendStatus(500);

      });
   });
}