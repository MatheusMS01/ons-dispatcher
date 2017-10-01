////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const ip = require( 'ip' );
const net = require( 'net' );
const log4js = require( 'log4js' );
const factory = require( '../../../protocol/dwp/factory' )
const worker_discovery = require( './worker_discovery' )
const EventEmitter = require( 'events' );
const config = require( './configuration' ).getConfiguration();

// Schemas
const Simulation = require( '../../database/models/simulation' );
const SimulationInstance = require( '../../database/models/simulation_instance' );
const SimulationGroup = require( '../../database/models/simulation_group' );
const Worker = require( '../../database/models/worker' );

// Pdus
const resourceRequest = require( '../../../protocol/dwp/pdu/resource_request' );
const simulationRequest = require( '../../../protocol/dwp/pdu/simulation_request' );
const simulationResponse = require( '../../../protocol/dwp/pdu/simulation_response' );
const simulationTerminateRequest = require( '../../../protocol/dwp/pdu/simulation_terminate_request' );

log4js.configure( {
   appenders: [
      { type: 'console' },
      { type: 'file', filename: 'logs/communication.log', category: 'communication' }
   ]
});

// Responsible for logging into console and log file
const logger = log4js.getLogger( 'communication' );

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

      logger.debug( socket.remoteAddress + ':' + socket.remotePort + ' connected' );

      socket.once( 'close', () => {

         removeWorker( socket );

         const simulationInstanceFilter = { worker: socket.remoteAddress };

         // Update all SimulationInstances that were executing by this worker that left to pending again
         SimulationInstance.update( simulationInstanceFilter,
            { state: SimulationInstance.State.Pending, $unset: { worker: 1 } }, { multi: true })
            .exec(( err ) => {

               if ( err ) {
                  return logger.error( err );
               }

            });

         logger.debug( 'Worker ' + socket.remoteAddress + ' left the pool' );

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
      logger.debug( 'TCP server listening ' + server.address().address + ':' + server.address().port );
   });
}

event.on( 'run_simulation', ( worker ) => {

   SimulationInstance.findOne( { 'state': SimulationInstance.State.Pending })
      .populate( {
         path: '_simulation',
         select: '_binary _document _simulationGroup',
         populate: {
            path: '_binary _document _simulationGroup',
         },
         options: {
            sort: {
               '_simulationgroup.priority': -1 // Not sure if this is working
            }
         }
      })
      .sort( { seed: -1, load: 1 }) // Do not change the order!
      .exec(( err, simulationInstance ) => {

         if ( err ) {
            return logger.error( err );
         }

         if ( simulationInstance === null ) {
            return;
         }

         // @TODO: update instead of save
         simulationInstance.state = SimulationInstance.State.Executing;
         simulationInstance.worker = worker.remoteAddress;

         simulationInstance.save(( err ) => {

            if ( err ) {
               return logger.error( err );
            }

            const pdu = simulationRequest.format( { Data: simulationInstance });

            worker.write( pdu );

            updateWorkerRunningInstances( worker.remoteAddress );
         });
      });
});

function requestResource() {

   setInterval( function () {

      for ( var idx = 0; idx < workerPool.length; ++idx ) {
         workerPool[idx].write( resourceRequest.format() );
      }

   }, config.RequestResourceTimeout * 1000)
}

function dispatch() {

   // From time to time, request resources in order to fill possible idle machines
   setInterval( function () {

      computeMostIdleWorker();

   }, config.DispatchTimeout * 1000 );

}

function addWorker( worker ) {

   const newWorker = new Worker( { address: worker.remoteAddress });

   newWorker.save();

   workerPool.push( worker );
}

function removeWorker( worker ) {

   Worker.remove( { address: worker.remoteAddress }, ( err ) => {

      if ( err ) {
         return logger.error( err );
      }

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

         Worker.update( { address: socket.remoteAddress },
            { lastResource: { cpu: object.cpu, memory: object.memory } },
            ( err ) => {

               if ( err ) {
                  return logger.error( err )
               }
            });

         break;

      case factory.Id.SimulationResponse:

         // treat_simulation_response
         if ( object.Result === simulationResponse.Result.Success ) {

            var output = object.Output;

            try {
               output = JSON.parse( output );
               object.Output = JSON.stringify( output );
            } catch ( err ) {
               // If an error occurred, update it to finished
               // No need to keep trying executing this simulation
               logger.error( err );
            }

            // TODO: Adjust this to avoid finding twice
            SimulationInstance.findById( object.SimulationId, ( err, res ) => {

               if ( err ) {
                  return logger.error( err );
               }

               if ( res === null ) {
                  return;
               }

               updateWorkerRunningInstances( res.worker );
            });
            //

            var simulationInstanceUpdate = {
               result: object.Output,
               state: SimulationInstance.State.Finished,
               $unset: { 'worker': 1 }
            }

            SimulationInstance.findByIdAndUpdate( object.SimulationId,
               simulationInstanceUpdate,
               ( err, simulationInstance ) => {

                  if ( err ) {
                     return logger.error( err );
                  }

                  // Count if there are simulationInstances that are not finished yet
                  SimulationInstance.count( {
                     _simulation: simulationInstance._simulation,
                     $or: [{ state: SimulationInstance.State.Pending },
                     { state: SimulationInstance.State.Executing }]
                  }, ( err, count ) => {

                     if ( err ) {
                        return logger.error( err );
                     }

                     if ( count === 0 ) {
                        // Update simulation to finished
                        Simulation.findByIdAndUpdate( simulationInstance._simulation, {
                           state: Simulation.State.Finished
                        }, ( err, simulation ) => {

                           if ( err ) {
                              return logger.error( err );
                           }

                           // Count simulations from this group that are still executing
                           Simulation.count( {
                              _simulationGroup: simulation._simulationGroup,
                              state: Simulation.State.Executing
                           }, ( err, count ) => {

                              if ( err ) {
                                 return logger.error( err );
                              }

                              if ( count === 0 ) {

                                 SimulationGroup.findByIdAndUpdate( simulation._simulationGroup, {
                                    state: SimulationGroup.State.Finished,
                                    endTime: Date.now()
                                 }, ( err, simulation ) => {

                                    if ( err ) {
                                       return logger.error( err );
                                    }

                                 });
                              }
                           });
                        });
                     }

                  });
               });

         } else {
            logger.error( object.SimulationId + ' executed with Failure ' + object.ErrorMessage );

            SimulationInstance.findByIdAndUpdate( object.SimulationId, {
               'state': SimulationInstance.State.Pending,
               $unset: { 'worker': 1 }
            }, ( err ) => {
               if ( err ) {
                  return logger.error( err );
               }
            });
         }

         break;

      default:
         return logger.error( 'Invalid message received from ' + socket.remoteAddress );
   }
}

function computeMostIdleWorker() {

   Worker.findOne( {} )
      .sort( { 'lastResource.cpu': -1, 'lastResource.memory': -1 })
      .exec(( err, mostIdleWorker ) => {

         if ( err ) {
            return logger.error( err );
         }

         if ( mostIdleWorker === null ) {
            return;
         }

         if ( mostIdleWorker.lastResource === undefined ) {
            return;
         }

         if ( ( mostIdleWorker.lastResource.cpu >= config.CPUThreshold ) &&
            ( mostIdleWorker.lastResource.memory >= config.MemoryThreshold ) ) {

            for ( var idx in workerPool ) {
               if ( workerPool[idx].remoteAddress === mostIdleWorker.address ) {
                  event.emit( 'run_simulation', workerPool[idx] );
                  return;
               }
            }
         }
      });
}

function updateWorkerRunningInstances( workerId ) {

   SimulationInstance.count( { worker: workerId }, ( err, count ) => {

      if ( err ) {
         return logger.error( err );
      }

      Worker.update( { address: workerId }, { runningInstances: count }, ( err ) => {

         if ( err ) {
            logger.error( err );
         }

      });

   });
}

function cleanUp() {

   // Clean all workers
   Worker.remove( {}, ( err ) => {
      if ( err ) {
         logger.error( err )
      }
   });

   // Clean all simulations that were executing when dispatcher died
   SimulationInstance.update( { state: SimulationInstance.State.Executing },
      { state: SimulationInstance.State.Pending, $unset: { worker: 1 } }, { multi: true })
      .exec(( err ) => {

         if ( err ) {
            return logger.error( err );
         }

      });
}