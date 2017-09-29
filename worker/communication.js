﻿////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const net = require( 'net' );
const log4js = require( 'log4js' );
const ddp = require( './ddp' )
const factory = require( '../protocol/dwp/factory' )
const resource = require( './resource' )
const resource_response = require( '../protocol/dwp/pdu/resource_response' )
const simulation_response = require( '../protocol/dwp/pdu/simulation_response' )
const fs = require( 'fs' );
const mkdirp = require( 'mkdirp' );
const dirname = require( 'path' ).dirname;
const exec = require( 'child_process' ).exec;
const rimraf = require( 'rimraf' );

log4js.configure( {
   appenders: {
      out: { type: 'stdout' },
      app: { type: 'file', filename: 'log/communication.log' }
   },
   categories: {
      default: { appenders: ['out', 'app'], level: 'debug' }
   }
});

// Responsible for loggin into console and log file
const logger = log4js.getLogger();

var buffer = '';

var simulationPID = [];

module.exports = function () {

   // Remove from local cache
   ddp.event.on( 'dispatcher_response', ( dispatcherAddress ) => {

      logger.debug( 'Response received! Trying to connect to ' + dispatcherAddress + ':16180' );
      // TCP socket in which all the communication dispatcher-workers will be accomplished
      var socket = new net.Socket();

      socket.connect( 16180, dispatcherAddress );

      socket.on( 'data', ( data ) => {
         // Treat chunk data
         buffer += data;

         var packet;
         try {
            do {
               packet = factory.expose( buffer );
               buffer = factory.remove( buffer );
               treat( packet, socket );
            } while ( buffer.length !== 0 )
         } catch ( err ) {
            return;
         }
      });

      socket.on( 'error', () => {
         //socket.destroy();
         //process.exit();
      });


      socket.on( 'close', () => {
         ddp.resume();
      });
   });
}

function treat( data, socket ) {

   var object;

   try {
      object = JSON.parse( data )
      factory.validate( object );
   } catch ( err ) {
      return logger.error( err );
   }

   const id = Number( object.Id );

   switch ( id ) {

      case factory.Id.ResourceRequest:

         resource.getCPUAvailable(( cpu ) => {
            var data = {
               cpu: ( 1 - cpu ),
               memory: resource.getMemoryAvailable()
            };

            // Respond dispatcher
            socket.write( resource_response.format( data ) );
         });

         break;

      case factory.Id.SimulationRequest:

         logger.debug( 'New simulation received!' );

         var path = __dirname + '/' + object.Data._id + '/';
         var binaryContent = Buffer( object.Data._simulation._binary.content );
         var documentContent = object.Data._simulation._document.content;

         writeFile( path + object.Data._simulation._binary.name, binaryContent, ( err ) => {
            if ( err ) throw err;

            writeFile( path + object.Data._simulation._document.name, documentContent, ( err ) => {
               if ( err ) throw err;

               var command = 'java -jar ';
               command += path + object.Data._simulation._binary.name + ' ';
               command += path + object.Data._simulation._document.name + ' ';
               command += object.Data.seed + ' ';
               command += object.Data.load + ' ';
               command += object.Data.load + ' 1';

               command = command.replace( /\\/g, '/' );

               var child = exec( command, ( err, stdout, stderr ) => {

                  var simulationId;

                  for ( var index = 0; index < simulationPID.length; ++index ) {

                     if ( simulationPID[index].PID == child.pid ) {

                        simulationId = simulationPID[index].SimulationId;
                        simulationPID.splice( index, 1 );

                        break;
                     }
                  }

                  var data = {};

                  data.SimulationId = simulationId;

                  if ( err ) {
                     data.Result = simulation_response.Result.Failure;
                     data.ErrorMessage = err;
                  }

                  if ( stderr ) {
                     data.Result = simulation_response.Result.Failure;
                     data.ErrorMessage = stderr;
                  }

                  if ( stdout ) {
                     data.Result = simulation_response.Result.Success;
                     data.Output = stdout;
                     // Treat simulator output
                  }

                  socket.write( simulation_response.format( data ) );

                  rimraf( path, ( err ) => {
                     if ( err ) return logger.error( err );
                  });
               });

               simulationPID.push( {
                  'SimulationId': object.Data._id,
                  'PID': child.pid,
               });
            });
         });

         break;

      case factory.Id.SimulationTerminateRequest:
         var pid;

         for ( var index = 0; index < simulationPID.length; ++index ) {
            if ( simulationPID[index].SimulationId == object.SimulationId ) {
               pid = simulationPID[index].PID;
            }
         }

         if ( pid !== undefined ) {
            process.kill( pid );
         }

         break;

      default:
         return logger.error( 'Invalid Id!' );
   }
}

function writeFile( path, contents, callback ) {

   mkdirp( dirname( path ), ( err ) => {
      if ( err ) {
         return callback( err );
      }

      fs.writeFile( path, contents, callback );
   });
}