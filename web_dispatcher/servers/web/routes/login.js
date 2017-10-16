////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const passport = require( 'passport' );

module.exports = function ( app ) {

   app.post( '/login', passport.authenticate( 'local', { successRedirect: '/dashboard', failureRedirect: '/' }) );

   app.get( '/logout', ( req, res ) => {

      req.logout();
      req.session.destroy();
      res.redirect( '/' );

   });
}