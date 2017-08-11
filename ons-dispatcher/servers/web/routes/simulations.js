const SimulationProperty = require('../../../database/models/simulation_property');

const router = require('../router');

module.exports = function (app) {
   // Simulations
   app.get('/simulations', router.authenticationMiddleware(), (req, res) => {
      SimulationProperty.find({
         _user: req.user.id,
      }, (err, simulationProperties) => {
         res.render('simulations', {
            title: "Simulations",
            simulationProperties: simulationProperties
         });
      });
   });
}