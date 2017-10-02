////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const ip = require( 'ip' );
const net = require( 'net' );
const factory = require( '../../../protocol/dwp/factory' )
const worker_discovery = require( './worker_discovery' )
const EventEmitter = require( 'events' );
const config = require( './configuration' ).getConfiguration();

// Schemas
const SimulationInstance = require( '../../database/models/simulation_instance' );
const Simulation = require( '../../database/models/simulation' );
const SimulationGroup = require( '../../database/models/simulation_group' );
const Worker = require( '../../database/models/worker' );

// Pdus
const resourceRequest = require( '../../../protocol/dwp/pdu/resource_request' );
const simulationRequest = require( '../../../protocol/dwp/pdu/simulation_request' );
const simulationResponse = require( '../../../protocol/dwp/pdu/simulation_response' );
const simulationTerminateRequest = require( '../../../protocol/dwp/pdu/simulation_terminate_request' );

const log4js = require( 'log4js' );

log4js.configure( {
   appenders: {
      out: { type: 'stdout' },
      app: { type: 'file', filename: 'log/communication.log' }
   },
   categories: {
      default: { appenders: ['out', 'app'], level: 'debug' }
   }
});

const logger = log4js.getLogger();

// TCP socket in which all the dispatcher-workers communication will be accomplished
const server = net.createServer();

var workerPool = [];

var buffer = '';

var event = new EventEmitter();
module.exports.event = event;

module.exports.execute = function () {

   cleanUp();

   requestResource();

   dispatch();

   server.on( 'connection', ( socket ) => {

      // Insert new worker to the pool
      addWorker( socket );

      // Emit to UDP discovery
      event.emit( 'new_worker', socket.remoteAddress );

      logger.info( socket.remoteAddress + ':' + socket.remotePort + ' connected' );

      socket.once( 'close', () => {

         removeWorker( socket );

         const simulationInstanceFilter = { worker: socket.remoteAddress };
         const simulationInstanceUpdate = { state: SimulationInstance.State.Pending, $unset: { worker: 1 } };

         // Update all SimulationInstances that were executing by this worker that left to pending again
         var promise = SimulationInstance.update( simulationInstanceFilter, simulationInstanceUpdate, { multi: true }).exec();

         promise.catch( function ( err ) {
            logger.error( err );
         });

         logger.info( 'Worker ' + socket.remoteAddress + ' left the pool' );

         if ( workerPool.length === 0 ) {
            logger.warn( 'There are no workers left' );
            return;
         }
      });

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

         } catch ( e ) {
            return;
         }
      });

      socket.on( 'error', () => { });
   });

   // Open Socket
   server.listen( 16180, ip.address(), () => {
      logger.info( 'TCP server listening ' + server.address().address + ':' + server.address().port );
   });
}

event.on( 'run_simulation', ( worker ) => {

   const simulationInstanceFilter = { 'state': SimulationInstance.State.Pending };
   const simulationInstanceUpdate = { 'state': SimulationInstance.State.Executing, 'worker': worker.remoteAddress };
   const simulationInstancePopulate = {
      path: '_simulation',
      select: '_binary _document _simulationGroup',
      populate: { path: '_binary _document _simulationGroup' },
      options: { sort: { '_simulationgroup.priority': -1 } }
   };

   var promise = SimulationInstance.findOneAndUpdate( simulationInstanceFilter, simulationInstanceUpdate )
      .populate( simulationInstancePopulate )
      .sort( { seed: -1, load: 1 })
      .exec();

   promise.then( function ( simulationInstance ) {

      if ( simulationInstance === null ) {
         // No simulations are pending
         return;
      }

      const pdu = simulationRequest.format( { Data: simulationInstance });

      worker.write( pdu );

      logger.info( 'Dispatched simulation to ' + worker.remoteAddress );

      updateWorkerRunningInstances( worker.remoteAddress );
   })

   .catch( function ( err ) {
      logger.error( err );
   });

});

function requestResource() {

   setInterval( function () {

      for ( var idx = 0; idx < workerPool.length; ++idx ) {
         workerPool[idx].write( resourceRequest.format() );
      }

   }, config.RequestResourceTimeout * 1000 )
}

function dispatch() {

   // From time to time, request resources in order to fill possible idle machines
   setInterval( function () {

      computeMostIdleWorker();

   }, config.DispatchTimeout * 1000 );

}

function addWorker( worker ) {

   const newWorker = new Worker( { address: worker.remoteAddress });

   var promise = newWorker.save();

   promise.catch( function ( err ) {
      logger.error( err );
   });

   workerPool.push( worker );
}

function removeWorker( worker ) {

   const workerFilter = { address: worker.remoteAddress };

   var promise = Worker.remove( workerFilter ).exec();

   promise.catch( function ( err ) {
      logger.error( err );
   });

   const idx = workerPool.indexOf( worker );

   if ( idx > -1 ) {
      workerPool.splice( idx, 1 );
   }
}

function treat( data, socket ) {

   var object = JSON.parse( data.toString() );

   try {
      factory.validate( object );
   } catch ( err ) {
      return logger.error( err );
   }

   switch ( object.Id ) {

      case factory.Id.ResourceResponse:

         const workerFilter = { address: socket.remoteAddress };
         const workerUpdate = { lastResource: { cpu: object.cpu, memory: object.memory } };

         var promise = Worker.update( workerFilter, workerUpdate ).exec();

         promise.catch( function ( err ) {
            logger.error( err );
         });

         break;

      case factory.Id.SimulationResponse:

         // treat_simulation_response
         if ( object.Result === simulationResponse.Result.Success ) {

            const simulationId = object.SimulationId;
            var output = object.Output;

            try {
               output = JSON.parse( output );
               object.Output = JSON.stringify( output );
            } catch ( err ) {
               // If an error occurred, update it to finished anyways
               // No need to keep trying executing this simulation
               logger.error( err );
            }

            var promise_i = SimulationInstance.findById( object.SimulationId ).exec();

            promise_i.then( function ( simulationInstance ) {

               if ( simulationInstance === null ) {
                  return;
               }

               updateWorkerRunningInstances( simulationInstance.worker );
            })

            .catch( function ( err ) {
               logger.error( err );
            });

            // Update simulationInstance to finished
            var simulationInstanceUpdate = {
               result: object.Output,
               state: SimulationInstance.State.Finished,
               $unset: { 'worker': 1 }
            }

            var promise = SimulationInstance.findByIdAndUpdate( simulationId, simulationInstanceUpdate ).exec();

            promise.then( function ( simulationInstance ) {

               // Count how many simulationInstances are pending or executing
               const condition = {
                  _simulation: simulationInstance._simulation,
                  $or: [{ state: SimulationInstance.State.Pending },
                  { state: SimulationInstance.State.Executing }]
               }

               var promise = SimulationInstance.count( condition ).exec();

               return promise.then( function ( count ) {

                  // If they are all finished, update simulation to finished too
                  if ( count > 0 ) {
                     return;
                  }

                  const id = simulationInstance._simulation;
                  const simulationUpdate = { state: Simulation.State.Finished };

                  return Simulation.findByIdAndUpdate( id, simulationUpdate )
               })
            })

            .then( function ( simulation ) {

               if ( simulation === undefined ) {
                  return;
               }

            // Count how many simulations are executing
            const condition = {
               _simulationGroup: simulation._simulationGroup,
               state: Simulation.State.Executing
            };

            var promise = Simulation.count( condition ).exec();

            return promise.then( function ( count ) {

               // If they are all finished, update simulationGroup to finished too
               if ( count > 0 ) {
                  return;
               }

               const id = simulation._simulationGroup;
               const simulationGroupUpdate = {
                  state: SimulationGroup.State.Finished,
                  endTime: Date.now()
               };

               return SimulationGroup.findByIdAndUpdate( id, simulationGroupUpdate ).exec()
            });
         })

         // Treat all errors
         .catch( function ( err ) {
               logger.error( err );
         })
            
         } else {

            logger.error( object.SimulationId + ' executed with Failure ' + object.ErrorMessage );

            const simulationInstanceUpdate = { 'state': SimulationInstance.State.Pending, $unset: { 'worker': 1 } };

            var promise = SimulationInstance.findByIdAndUpdate( object.SimulationId, simulationInstanceUpdate ).exec();

            // Treat all errors
            promise.catch( function ( err ) {
               logger.error( err );
            });
         }

         break;

      default:
         return logger.error( 'Invalid message received from ' + socket.remoteAddress );
   }
}

function computeMostIdleWorker() {

   const workerSort = { 'lastResource.cpu': -1, 'lastResource.memory': -1 };

   var promise = Worker.findOne( {}).sort( workerSort ).exec();

   promise.then( function ( mostIdleWorker ) {

      if ( mostIdleWorker === null ) {
         return;
      }

      if ( ( mostIdleWorker.lastResource.cpu < config.CPUThreshold ) &&
         ( mostIdleWorker.lastResource.memory < config.MemoryThreshold ) ) {
         return;
      }

      for ( var idx in workerPool ) {

         if ( workerPool[idx].remoteAddress === mostIdleWorker.address ) {
            event.emit( 'run_simulation', workerPool[idx] );
            return;
         }
      }
   })

   // Treat all errors
   .catch( function ( err ) {
      logger.error( err );
   });

}

function updateWorkerRunningInstances( workerId ) {

   var promise = SimulationInstance.count( { worker: workerId }).exec();

   promise.then( function ( count ) {

      return Worker.update( { address: workerId }, { runningInstances: count }).exec();
   })

   // Treat all errors
   .catch( function ( err ) {
      logger.error( err );
   });
}

function cleanUp() {

   // Clean all workers
   var promise_i = Worker.remove( {}).exec();

   promise_i.catch( function ( err ) {
      logger.error( err );
   });

   // Clean all simulations that were executing when dispatcher died
   const simulationInstanceFilter = { state: SimulationInstance.State.Executing };
   const simulationInstanceUpdate = { state: SimulationInstance.State.Pending, $unset: { worker: 1 } };

   var promise_ii = SimulationInstance.update( simulationInstanceFilter, simulationInstanceUpdate, { multi: true }).exec();

   // Treat all errors
   promise_ii.catch( function ( err ) {
      logger.error( err );
   });
}