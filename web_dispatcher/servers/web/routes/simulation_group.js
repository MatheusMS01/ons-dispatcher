////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const SimulationGroup = require( '../../../database/models/simulation_group' );
const Simulation = require( '../../../database/models/simulation' );
const SimulationInstance = require( '../../../database/models/simulation_instance' );

const router = require( '../router' );

module.exports = function ( app ) {

   // Simulations
   app.get( '/simulation_group', router.authenticationMiddleware(), ( req, res ) => {

      SimulationGroup.find( {
         _user: req.user.id,
      }, ( err, simulationGroups ) => {
         res.render( 'simulation_group', {
            title: 'Simulations',
            active: 'simulations',
            simulationGroups: simulationGroups
         });
      });

   });


   // APIs
   app.get( '/api/get_simulation_groups', ( req, res ) => {

      SimulationGroup.find( { _user: req.user.id },
         ( err, simulationGroups ) => {

            if ( err ) {
               return console.log( err );
            }

            res.send( simulationGroups );
         });

   });

   app.get( '/api/get_remaining_instances_from_group/:id', ( req, res ) => {

      const id = req.params.id;

      SimulationGroup.findById( id, ( err, simulationGroup ) => {

         if ( err ) {
            return console.log( err );
         }

         Simulation.find( { _simulationGroup: simulationGroup.id })
            .select( 'id' )
            .exec(( err, simulationIds ) => {

               if ( err ) {
                  return console.log( err );
               }

               const simulationInstanceFilter = {
                  _simulation: { $in: simulationIds },
                  $or: [{ state: SimulationInstance.State.Pending },
                  { state: SimulationInstance.State.Executing }]
               };

               SimulationInstance.count( simulationInstanceFilter, ( err, count ) => {

                  if ( err ) {
                     return console.log( err );
                  }

                  res.send( { 'result': count });
               });
            });
      });
   });

}