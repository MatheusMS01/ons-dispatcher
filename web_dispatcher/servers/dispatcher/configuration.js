////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

var fs = require( 'fs' );

var configuration = {};

load();

module.exports.getConfiguration = function () {

   if ( Object.keys( configuration ).length === 0 ) {
      load();
   }

   return configuration;
}

function load() {

   try {
      configuration = JSON.parse( fs.readFileSync( __dirname + '/config/config.json', 'utf8' ).replace( /^\uFEFF/, '' ) );
   } catch ( err ) {

   }

   treatDefaultValues();
}

function treatDefaultValues() {

   // Prevent user's stupidity
   if ( configuration.CPUThreshold === undefined || typeof configuration.CPUThreshold === 'string' ) {
      configuration.CPUThreshold = 0.5;
   } else {
      if ( configuration.CPUThreshold > 1 ) {
         configuration.CPUThreshold = 1;
      } else if ( configuration.CPUThreshold < 0 ) {
         configuration.CPUThreshold = 0
      }
   }

   if ( configuration.MemoryThreshold === undefined || typeof configuration.MemoryThreshold === 'string' ) {
      configuration.MemoryThreshold = 0.5;
   } else {
      if ( configuration.MemoryThreshold > 1 ) {
         configuration.MemoryThreshold = 1;
      } else if ( configuration.MemoryThreshold < 0 ) {
         configuration.MemoryThreshold = 0
      }
   }

   if ( configuration.RequestResourceTimeout === undefined || typeof configuration.RequestResourceTimeout === 'string' ) {
      configuration.RequestResourceTimeout = 1;
   } else {
      if ( configuration.RequestResourceTimeout < 1 ) {
         configuration.RequestResourceTimeout = 1;
      }
   }

   if ( configuration.DispatchTimeout === undefined || typeof configuration.DispatchTimeout === 'string' ) {
      configuration.DispatchTimeout = 3;
   } else {
      if ( configuration.DispatchTimeout < 3 ) {
         configuration.DispatchTimeout = 3;
      }
   }
}