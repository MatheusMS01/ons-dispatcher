////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const passport = require( 'passport' );

module.exports = function ( app ) {

   app.get( '/login', ( req, res ) => {

      const options = { title: 'Login', active: 'login' };

      res.render( 'login', options );
   });

   app.post( '/login', passport.authenticate( 'local', { successRedirect: '/dashboard', failureRedirect: '/login' }) );

   app.get( '/logout', ( req, res ) => {

      req.logout();
      req.session.destroy();
      res.redirect( '/' );

   });
}