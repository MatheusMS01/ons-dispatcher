////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const passport = require('passport');

module.exports = function (app) {

   app.get('/login', (req, res) => {
      res.render('login', {
         title: 'Login',
         active: 'login'
      })
   });

   app.post('/login', passport.authenticate('local', {
      successRedirect: '/profile',
      failureRedirect: '/login'
   }));

   app.get('/logout', (req, res) => {
      req.logout();
      req.session.destroy();
      res.redirect('/');
   });
}