////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const mongoose = require('mongoose');
const log4js = require('log4js');
const fs = require('fs')

// Authentication
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const MongoStore = require('connect-mongo')(session);

const User = require('./models/user');
const Binary = require('./models/binary');
const Simulation = require('./models/simulation');
const SimulationProperty = require('./models/simulation_property');
const Document = require('./models/document');

log4js.configure({
   appenders: [
      { type: 'console' },
      { type: 'file', filename: 'logs/db_driver.log', category: 'db_driver' }
   ]
});

// Responsible for loggin into console and log file
const logger = log4js.getLogger('db_driver');


module.exports = function (app) {
   mongoose.connect('mongodb://localhost/ons', { useMongoClient: true });

   var connection = mongoose.connection;

   // Consider moving this code to index.js and pass MongoStore configuration
   {
      app.use(session({
         secret: '4df8jb1arc2r84g',
         resave: false,
         saveUninitialized: false,
         store: new MongoStore({
            mongooseConnection: connection,
            collection: 'session'
         })
      }));

      app.use(passport.initialize());
      app.use(passport.session());

      passport.use(new LocalStrategy((email, password, done) => {
         User.findOne({ email: email }, function (err, user) {
            if (err) { return done(err); }
            if (!user) {
               return done(null, false, { message: 'Incorrect username.' });
            }
            if (!user.validPassword(password)) {
               return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
         });
      }
      ));

      app.use(function (req, res, next) {
         res.locals.success_msg = req.flash('success_msg');
         res.locals.error_msg = req.flash('error_msg');
         res.locals.error = req.flash('error');
         res.locals.isAuthenticated = req.isAuthenticated();
         next();
      });
   }

   connection.on('error', (err) => {
      throw err;
   });

}