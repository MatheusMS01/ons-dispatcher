////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

module.exports = function ( app ) {

   app.get( '/', ( req, res ) => {

      const options = { 'title': 'Home', 'active': 'home' };
      res.render( 'home', options );

   });
}