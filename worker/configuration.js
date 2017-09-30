////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

var fs = require( 'fs' );
var validateIP = require( 'validate-ip-node' );
const log4js = require( 'log4js' );

log4js.configure( {
   appenders: {
      out: { type: 'stdout' },
      app: { type: 'file', filename: 'log/configuration.log' }
   },
   categories: {
      default: { appenders: ['out', 'app'], level: 'debug' }
   }
});

// Responsible for loggin into console and log file
const logger = log4js.getLogger();

var configuration;

load();

module.exports.getConfiguration = function () {

   if ( configuration === undefined ) {
      load();
   }

   return configuration;
}

function load() {

   try {
      configuration = JSON.parse( fs.readFileSync( __dirname + '/config/config.json', 'utf8' ).replace( /^\uFEFF/, '' ) );
   } catch ( err ) {
      configuration = {};
      return;
   }

   treatDefaultValues();
}

function treatDefaultValues() {

   if ( !validateIP( configuration.DispatcherAddress ) ) {
      configuration.DispatcherAddress = undefined;
   }

}