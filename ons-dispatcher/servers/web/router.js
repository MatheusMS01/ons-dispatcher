////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const User = require('../../database/models/user');
const Binary = require('../../database/models/binary');
const Document = require('../../database/models/document');
const Simulation = require('../../database/models/simulation');
const passport = require('passport');
const simulationHandler = require('../dispatcher/simulation_handler');

// Routes
const home = require('./routes/home');
const login = require('./routes/login');
const profile = require('./routes/profile');
const sign_up = require('./routes/sign_up');
const simulation = require('./routes/simulation');
const simulations = require('./routes/simulations');

module.exports.execute = function (app) {
   home(app);
   login(app);
   profile(app);
   sign_up(app);
   simulation(app);
   simulations(app);
}

passport.serializeUser((user, done) => {
   done(null, user.id);
});

passport.deserializeUser((id, done) => {
   User.findById(id, (err, user) => {
      done(err, user);
   });
});

module.exports.authenticationMiddleware = function authenticationMiddleware() {
   return (req, res, next) => {

      if (req.isAuthenticated()) {
         return next();
      }

      res.redirect('/login')
   }
}