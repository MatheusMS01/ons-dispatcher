////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const SimulationGroup = require( '../../../database/models/simulation_group' );

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
}