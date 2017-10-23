////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const nodemailer = require( 'nodemailer' );
const config = require( './configuration' ).getConfiguration();
const log = require( '../../database/models/log' );

var transporter = nodemailer.createTransport( {
   service: config.transporter.service,
   auth: {
      user: config.transporter.auth.user,
      pass: config.transporter.auth.pass
   }
} );

module.exports.sendMail = function ( to, subject, text ) {

   var mailOptions = {
      from: config.transporter.auth.user,
      to: to,
      subject: subject,
      text: text
   };

   var promise = transporter.sendMail( mailOptions, function ( error, info ) {
      if ( error ) {
         log.error( error );
      }
   } );
}