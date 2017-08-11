const router = require('../router');

const User = require('../../../database/models/user');
const Binary = require('../../../database/models/binary');
const Document = require('../../../database/models/document');
const Simulation = require('../../../database/models/simulation');

module.exports = function (app) {
   app.get('/simulation/:id', router.authenticationMiddleware(), (req, res) => {

      const query = Simulation.find({ _simulationProperty: req.params.id, result: { $ne: null } }).select({ result: 1, _id: 0 }).sort('result.load');

      query.exec((err, results) => {
         results = JSON.stringify(results)
         res.render('simulation', {
            title: "Simulation",
            results: results
         });

      });
   })

   app.post('/simulation/:id', (req, res) => {

      res.redirect('/simulation/' + req.params.id);

   });

   app.post('/cancel', (req, res) => {

      {
         const simulationFilter = {
            _simulationProperty: req.body._simulationProperty,
            state: Simulation.State.Pending
         };

         Simulation.update(simulationFilter, { state: Simulation.State.Canceled }, { multi: true }, (err) => {
            if (err) res.sendStatus(400);

            const simulationPropertyFilter = {
               _id: req.body._simulationProperty
            }

            SimulationProperty.update(simulationPropertyFilter, { state: SimulationProperty.State.Finished }, (err) => {
               if (err) res.sendStatus(400);

               res.sendStatus(200);
            });
         });
      }

   });

   app.post('/remove', (req, res) => {

      {
         const simulationFilter = {
            _simulationProperty: req.body._simulationProperty
         }

         Simulation.find(simulationFilter).remove((err) => {
            if (err) res.sendStatus(400);

            const simulationPropertyFilter = {
               _id: req.body._simulationProperty
            }

            SimulationProperty.findByIdAndRemove(simulationPropertyFilter, (err) => {
               if (err) res.sendStatus(400);

               res.sendStatus(200);
            });
         });
      }

   });

   // New Simulation
   app.get('/new_simulation', router.authenticationMiddleware(), (req, res) => {
      res.render('new_simulation', {
         title: "New Simulation"
      })
   });

   app.post('/new_simulation', (req, res) => {

      if (!req.body.simulationName) {
         req.flash('error_msg', "Simulation name not filled");
         res.redirect('/new_simulation');
         return;
      }

      if (!req.files.simulator) {
         req.flash('error_msg', "Simulator was not uploaded");
         res.redirect('/new_simulation');
         return;
      }

      if (!req.files.document) {
         req.flash('error_msg', "Configuration was not uploaded");
         res.redirect('/new_simulation');
         return;
      }

      if (!req.body.seedAmount) {
         req.flash('error_msg', "Seed amount not filled");
         res.redirect('/new_simulation');
         return;
      }

      if (!req.body.minLoad) {
         req.flash('error_msg', "Minimum load not filled");
         res.redirect('/new_simulation');
         return;
      }

      if (!req.body.maxLoad) {
         req.flash('error_msg', "Maximum load not filled");
         res.redirect('/new_simulation');
         return;
      }

      if (!req.body.step) {
         req.flash('error_msg', "Step not filled");
         res.redirect('/new_simulation');
         return;
      }

      const simulationName = req.body.simulationName;
      const seedAmount = Number(req.body.seedAmount);
      const minLoad = Number(req.body.minLoad);
      const maxLoad = Number(req.body.maxLoad);
      const step = Number(req.body.step);

      if (minLoad > maxLoad) {
         req.flash('error_msg', "Minimum load must be lesser or equal to Maximum load");
         res.redirect('/new_simulation');
         return;
      }

      if (seedAmount <= 0) {
         req.flash('error_msg', "Seed amount must be greater than zero");
         res.redirect('/new_simulation');
         return;
      }

      const binary = new Binary({
         _user: req.user.id,
         name: req.files.simulator.name,
         content: req.files.simulator.data
      });

      binary.save((err) => {

         if (err) {

            if (err.code === 11000) {
               req.flash('error_msg', "Simulator already exists!");
               res.redirect('/new_simulation');
            } else {
               req.flash('error_msg', "An error occurred. Please try again latter");
               res.redirect('/new_simulation');
            }

            return;
         }

         const document = new Document({
            _user: req.user.id,
            name: req.files.document.name,
            content: req.files.document.data
         });

         document.save((err) => {

            if (err) {

               if (err.code === 11000) {
                  req.flash('error_msg', "Configuration file already exists!");
                  res.redirect('/new_simulation');
               } else {
                  req.flash('error_msg', "An error occurred. Please try again latter");
                  res.redirect('/new_simulation');
               }

               return;
            }

            const simulationProperty = new SimulationProperty({
               _user: req.user.id,
               _binary: binary.id,
               _document: document.id,
               name: simulationName,
               seedAmount: seedAmount,
               load: {
                  Min: minLoad,
                  Max: maxLoad,
                  Step: step,
               }
            });

            simulationProperty.save((err, simulationProperty) => {

               if (err) {

                  if (err.code === 11000) {
                     req.flash('error_msg', "Simulation already exists!");
                     res.redirect('/new_simulation');
                  } else {
                     req.flash('error_msg', "An error occurred. Please try again latter");
                     res.redirect('/new_simulation');
                  }

                  return;
               }

               simulationHandler.event.emit('new_simulation', simulationProperty.id);

               res.redirect('/simulations');
            });
         });
      });
   });

   app.post('/cancel_new_simulation', (req, res) => {
      res.redirect('/simulations');
   });
}