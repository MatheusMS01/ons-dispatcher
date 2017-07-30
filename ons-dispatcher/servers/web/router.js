////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const User = require('../../database/models/user');
const Binary = require('../../database/models/binary');
const Document = require('../../database/models/document');
const Simulation = require('../../database/models/simulation');
const SimulationProperty = require('../../database/models/simulation_property');
const passport = require('passport');
const simulationHandler = require('../dispatcher/simulation_handler');

module.exports = function (app) {

   // Home
   app.get('/', (req, res) => {

      res.render('home', {
         'title': "Home"
      });
   });

   // Login
   app.get('/login', (req, res) => {
      res.render('login', {
         title: "Login"
      })
   });

   app.post('/login', passport.authenticate('local', {
      successRedirect: '/profile',
      failureRedirect: '/login'
   }));

   // Profile
   app.get('/profile', authenticationMiddleware(), (req, res) => {
      res.render('profile', {
         title: "Profile"
      })
   });

   // Simulations
   app.get('/simulations', authenticationMiddleware(), (req, res) => {
      SimulationProperty.find({
         _user: req.user.id,
      }, (err, simulationProperties) => {
         res.render('simulations', {
            title: "Simulations",
            simulationProperties: simulationProperties
         });
      });
   });

   app.get('/simulation/:id', (req, res) => {
      // CALCULAR AS ESTATISTICAS ANTES DE PASSAR!
      const query = Simulation.find({ _simulationProperty: req.params.id }).select({ result: 1, _id: 0 });

      query.exec((err, results) => {

         res.render('simulation', {
            title: "Simulation",
            results: results
         });

      });
   })

   app.post('/simulation/:id', (req, res) => {

      res.redirect('/simulation/' + req.params.id);

   });

   // New Simulation
   app.get('/new_simulation', authenticationMiddleware(), (req, res) => {
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


   // Logout
   app.get('/logout', (req, res) => {
      req.logout();
      req.session.destroy();
      res.redirect('/');
   });

   // Registration
   app.get('/registration', (req, res) => {
      res.render('registration', {
         'title': "Registration"
      });
   });

   app.post('/registration', (req, res) => {

      // Validation
      {
         req.checkBody('name', 'Name must be between 4-50 characters long.').len(4, 50);
         req.checkBody('email', 'The email you entered is invalid, please try again.').isEmail();
         req.checkBody('password', 'Password must be between 8-100 characters long.').len(8, 100);
         //req.checkBody("password", "Password must include one lowercase character, one uppercase character, a number, and a special character.").matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.* )(?=.*[^a-zA-Z0-9]).{8,}$/, "i");
         req.checkBody('passwordMatch', 'Passwords do not match, please try again.').equals(req.body.password);
      }

      // @TODO: update to newer version
      const errors = req.validationErrors();

      if (errors) {
         res.render('registration', {
            'title': "Registration",
            'errors': errors
         });

         return;
      }

      const name = req.body.name;
      const email = req.body.email;
      const password = req.body.password;
      const passwordMatch = req.body.passwordMatch;

      // Encrypt password
      User.encryptPassword(password, (err, hash) => {
         if (err) {
            res.render('registration', {
               'title': "Registration",
               errors: [{
                  'msg': "An error occurred. Please try again"
               }]
            });
         }

         const user = new User({
            'name': name,
            'email': email,
            'password': hash,
         })

         user.save((err, user) => {
            if (err) {
               if (err.code === 11000) {
                  // Unique conflict
                  res.render('registration', {
                     'title': "Registration",
                     errors: [{
                        'msg': "User already exists"
                     }]
                  });
               }
               else {
                  res.render('registration', {
                     'title': "Registration",
                     errors: [{
                        'msg': "An error occurred. Please try again"
                     }]
                  });
               }

               return;
            }

            req.login(user, (err) => {
               if (err) {
                  console.log(err);
                  return;
               }

               res.redirect('/profile');
            });
         });
      });
   });
}

passport.serializeUser((user, done) => {
   done(null, user.id);
});

passport.deserializeUser((id, done) => {
   User.findById(id, (err, user) => {
      done(err, user);
   });
});

function authenticationMiddleware() {
   return (req, res, next) => {

      if (req.isAuthenticated()) {
         return next();
      }

      res.redirect('/login')
   }
}