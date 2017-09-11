////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const router = require( '../router' );
const Worker = require( '../../../database/models/worker' )

module.exports = function ( app ) {

   // Profile
   app.get( '/profile', router.authenticationMiddleware(), ( req, res ) => {

      Worker.find( {}, ( err, workers ) => {

         if ( err ) console.log( err );
         console.log( workers );
         res.render( 'profile', {
            title: 'Profile',
            active: 'profile',
            workers: JSON.stringify( workers )
         })
      });
   });

   app.get( '/ajaxcall', ( req, res ) => {
      Worker.find( {}, ( err, workers ) => {
         res.send( workers );
      });
   });

}