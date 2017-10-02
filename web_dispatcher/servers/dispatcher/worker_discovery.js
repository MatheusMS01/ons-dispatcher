////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const dgram = require( 'dgram' );
const EventEmitter = require( 'events' );
const communication = require( './communication' );
const ip = require( 'ip' );
const log4js = require( 'log4js' );

log4js.configure( {
   appenders: {
      out: { type: 'stdout' },
      app: { type: 'file', filename: 'log/worker_discovery.log' }
   },
   categories: {
      default: { appenders: ['out', 'app'], level: 'debug' }
   }
});

const logger = log4js.getLogger();

// UDP socket which will receive workers requests
const socket = dgram.createSocket( 'udp4' );

// List which is necessary for UDP lack of error treatment
var pendingList = [];

const event = new EventEmitter();

event.on( 'event', ( workerInfo ) => {

   logger.info( 'Sending response to ' + workerInfo.address + ':' + workerInfo.port )

   // Send response to worker
   socket.send( socket.address().address, workerInfo.port, workerInfo.address );

   pendingList.push( workerInfo.address );
});

module.exports.execute = function () {

   // Remove from local cache
   communication.event.on( 'new_worker', ( workerAddress ) => {

      var idx = pendingList.indexOf( workerAddress );

      if ( idx > -1 ) {
         pendingList.splice( idx, 1 );
      }
   });

   socket.on( 'error', ( err ) => {
      logger.error( err.stack );
      socket.close();
   });

   socket.on( 'message', ( message, rinfo ) => {

      if ( message.indexOf( 'NewWorker' ) <= -1 ) {
         // Discard this message
         logger.error( 'Invalid message! ' + message + ' from ' + rinfo.address );
         return;
      }

      if ( pendingList.indexOf( rinfo.address ) === -1 ) {
         // New worker identified
         event.emit( 'event', rinfo );
      }
   });

   socket.on( 'listening', () => {
      logger.info( 'UDP socket listening ' + socket.address().address + ':' + socket.address().port );
   });

   socket.bind( 16180 );
}