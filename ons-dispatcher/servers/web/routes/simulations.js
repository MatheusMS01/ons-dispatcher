const SimulationGroup = require('../../../database/models/simulation');

const router = require('../router');

module.exports = function (app) {
   // Simulations
   app.get('/simulations', router.authenticationMiddleware(), (req, res) => {
      SimulationGroup.find({
         _user: req.user.id,
      }, (err, simulationGroups) => {
         res.render('simulations', {
            title: "Simulations",
            active: "simulations",
            simulationGroups: simulationGroups
         });
      });
   });
}