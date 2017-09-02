////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

'use strict'

const router = require( '../router' );
const simulationHandler = require( '../../dispatcher/simulation_handler' )

const User = require( '../../../database/models/user' );
const Binary = require( '../../../database/models/binary' );
const Document = require( '../../../database/models/document' );
const SimulationGroup = require( '../../../database/models/simulation_group' )
const Simulation = require( '../../../database/models/simulation' );
const SimulationInstance = require( '../../../database/models/simulation_instance' );

module.exports = function ( app ) {

   app.get( '/simulation_group/:id', router.authenticationMiddleware(), ( req, res ) => {

      // Get all simulationIds associated to this group
      var simulationFilter = { _simulationGroup: req.params.id };

      Simulation.find( simulationFilter )
         .select( '_id' )
         .exec(( err, simulationIds ) => {

            if ( err ) {
               res.sendStatus( 400 );
               return;
            }

            const simulationInstanceFilter = {
               _simulation: { $in: simulationIds },
               result: { $ne: null }
            }

            // Get all results from all instances that are done
            SimulationInstance
               .find( simulationInstanceFilter )
               .populate( {
                  path: '_simulation',
                  select: 'name'
               })
               .select( 'result _simulation -_id' )
               .sort( 'load' )
               .exec(( err, results ) => {

                  var a = JSON.stringify( results );

                  if ( err ) {
                     res.sendStatus( 400 );
                     return;
                  }

                  results = JSON.stringify( results )

                  res.render( 'simulation', {
                     title: 'Simulation',
                     active: 'simulation',
                     results: results
                  });
               });
         });
   });

   app.post( '/simulation_group/:id', ( req, res ) => {

      res.redirect( '/simulation_group/' + req.params.id );
   });

   app.post( '/cancel', ( req, res ) => {

      const simulationFilter = {
         _simulationGroup: req.body._simulationGroup,
         state: Simulation.State.Pending
      };

      Simulation.find( simulationFilter )
         .select( '_id' )
         .exec(( err, simulationIds ) => {

            if ( err ) {
               res.sendStatus( 400 );
               return;
            }

            const simulationInstanceFilter = {
               _simulation: { $in: simulationIds },
               state: SimulationInstance.State.Pending
            }

            SimulationInstance.update( simulationInstanceFilter, { state: SimulationInstance.State.Canceled }, { multi: true })
               .exec(( err ) => {

                  if ( err ) {
                     res.sendStatus( 400 );
                     return;
                  }

                  Simulation.update( simulationFilter, { state: Simulation.State.Canceled }, { multi: true })
                     .exec(( err, simulations ) => {

                        if ( err ) {
                           res.sendStatus( 400 );
                           return;
                        }

                        res.sendStatus( 200 );
                     });
               });
         });
   });

   app.post( '/remove', ( req, res ) => {

      //const simulationFilter = {
      //   _simulationGroup: req.body._simulationGroup,
      //};

      //Simulation.find(simulationFilter)
      //   .remove((err) => {

      //   });

      //{
      //   const simulationFilter = {
      //      _simulationProperty: req.body._simulationProperty
      //   }

      //   Simulation.find(simulationFilter).remove((err) => {
      //      if (err) res.sendStatus(400);

      //      const simulationPropertyFilter = {
      //         _id: req.body._simulationProperty
      //      }

      //      SimulationProperty.findByIdAndRemove(simulationPropertyFilter, (err) => {
      //         if (err) res.sendStatus(400);

      //         res.sendStatus(200);
      //      });
      //   });
      //}

   });

   // New Simulation
   app.get( '/new_simulation', router.authenticationMiddleware(), ( req, res ) => {
      res.render( 'new_simulation', {
         title: 'New Simulation',
         active: 'new_simulation'
      })
   });

   app.post( '/new_simulation', ( req, res ) => {

      if ( req.files === null ) {
         req.flash( 'error_msg', 'Files were not submitted!' );
         res.redirect( '/new_simulation' );
         return;
      }

      var binaryFiles = req.files['simulator'];
      var documentFiles = req.files['configuration'];

      if ( binaryFiles === undefined ) {
         req.flash( 'error_msg', 'binary not submitted' );
         res.redirect( '/new_simulation' );
         return;
      }

      if ( documentFiles === undefined ) {
         req.flash( 'error_msg', 'document not submitted' );
         res.redirect( '/new_simulation' );
         return;
      }

      if ( !( binaryFiles instanceof Array ) ) {
         binaryFiles = [binaryFiles];
      }

      if ( !( documentFiles instanceof Array ) ) {
         documentFiles = [documentFiles];
      }

      if ( binaryFiles.length !== documentFiles.length ) {
         req.flash( 'error_msg', 'binary and document must be paired!' );
         res.redirect( '/new_simulation' );
         return;
      }

      if ( !req.body.simulationGroupName ) {
         req.flash( 'error_msg', 'Simulation group name not filled' );
         res.redirect( '/new_simulation' );
         return;
      }

      if ( !req.body.seedAmount ) {
         req.flash( 'error_msg', 'Seed amount not filled' );
         res.redirect( '/new_simulation' );
         return;
      }

      if ( !req.body.minLoad ) {
         req.flash( 'error_msg', 'Minimum load not filled' );
         res.redirect( '/new_simulation' );
         return;
      }

      if ( !req.body.maxLoad ) {
         req.flash( 'error_msg', 'Maximum load not filled' );
         res.redirect( '/new_simulation' );
         return;
      }

      if ( !req.body.step ) {
         req.flash( 'error_msg', 'Step not filled' );
         res.redirect( '/new_simulation' );
         return;
      }

      const simulationGroupName = req.body.simulationGroupName;
      const seedAmount = Number( req.body.seedAmount );
      const minLoad = Number( req.body.minLoad );
      const maxLoad = Number( req.body.maxLoad );
      const step = Number( req.body.step );

      if ( minLoad > maxLoad ) {
         req.flash( 'error_msg', 'Minimum load must be lesser or equal to Maximum load' );
         res.redirect( '/new_simulation' );
         return;
      }

      if ( seedAmount <= 0 ) {
         req.flash( 'error_msg', 'Seed amount must be greater than zero' );
         res.redirect( '/new_simulation' );
         return;
      }

      var binarys = [];

      for ( var idx = 0; idx < binaryFiles.length; ++idx ) {

         const binary = new Binary( {
            _user: req.user.id,
            name: binaryFiles[idx].name,
            content: binaryFiles[idx].data
         });

         binarys.push( binary );
      }

      var documents = [];

      for ( var idx = 0; idx < documentFiles.length; ++idx ) {

         const document = new Document( {
            _user: req.user.id,
            name: documentFiles[idx].name,
            content: documentFiles[idx].data
         });

         documents.push( document );
      }

      const simulationGroup = new SimulationGroup( {
         _user: req.user.id,
         name: simulationGroupName,
         seedAmount: seedAmount,
         load: {
            minimum: minLoad,
            maximum: maxLoad,
            step: step
         }
      });

      simulationGroup.save(( err ) => {

         if ( err ) {
            req.flash( 'error_msg', JSON.stringify( err ) );
            res.redirect( '/new_simulation' );
            return;
         }

         Binary.insertMany( binarys, ( err, binaries ) => {

            if ( err ) {
               req.flash( 'error_msg', JSON.stringify( err ) );
               res.redirect( '/new_simulation' );
               return;
            }

            Document.insertMany( documents, ( err, documents ) => {

               if ( err ) {
                  req.flash( 'error_msg', JSON.stringify( err ) );
                  res.redirect( '/new_simulation' );
                  return;
               }

               var simulations = [];

               for ( var idx = 0; idx < binaries.length; ++idx ) {

                  const simulation = new Simulation( {
                     _simulationGroup: simulationGroup.id,
                     _binary: binaries[idx].id,
                     _document: documents[idx].id,
                     name: 'abcde' // TODO
                  });

                  simulations.push( simulation );
               }

               Simulation.insertMany( simulations, ( err ) => {

                  if ( err ) {
                     req.flash( 'error_msg', JSON.stringify( err ) );
                     res.redirect( '/new_simulation' );
                     return;
                  }

                  simulationHandler.event.emit( 'new_simulation', simulationGroup.id );

                  res.redirect( '/simulation_group' );
               });
            });
         });
      });
   });

   app.post( '/cancel_new_simulation', ( req, res ) => {
      res.redirect( '/simulation_group' );
   });
}