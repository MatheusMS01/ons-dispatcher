////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const router = require( '../router' );
const Worker = require( '../../../database/models/worker' );

const log4js = require( 'log4js' );

log4js.configure( {
   appenders: {
      out: { type: 'stdout' },
      app: { type: 'file', filename: 'log/dashboard.log' }
   },
   categories: {
      default: { appenders: ['out', 'app'], level: 'debug' }
   }
});

const logger = log4js.getLogger();

module.exports = function ( app ) {

   // dashboard
   app.get( '/dashboard', router.authenticationMiddleware(), function ( req, res ) {

      var promise = Worker.find().exec();

      promise.then( function ( workers ) {

         const options = { title: 'Dashboard', active: 'dashboard' };

         res.render( 'dashboard', options );

      })

      .catch( function ( err ) {
         logger.error( err );
      });
   });

   app.get( '/workers', function ( req, res ) {

      var promise = Worker.find( { lastResource: { $ne: null } }).exec();

      promise.then( function ( workers ) {
         res.send( workers );
      })

      .catch( function ( err ) {
         logger.error( err );
      });
   });

}