////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const router = require('../router');
const workerManager = require('../../shared/worker_manager');

const log4js = require('log4js');

log4js.configure({
   appenders: {
      out: { type: 'stdout' },
      app: { type: 'file', filename: 'log/dashboard.log' }
   },
   categories: {
      default: { appenders: ['out', 'app'], level: 'debug' }
   }
});

const logger = log4js.getLogger();

module.exports = function (app) {

   // dashboard
   app.get('/dashboard/executing-simulation-groups', router.authenticationMiddleware(), function (req, res) {

      const options = { title: 'Dashboard' };

      res.render('dashboard/executing-simulation-groups', options);
   });

   app.get('/dashboard/finished-simulation-groups', router.authenticationMiddleware(), function (req, res) {

      const options = { title: 'Dashboard' };

      res.render('dashboard/finished-simulation-groups', options);
   });

   app.get('/dashboard/new-simulation-group', router.authenticationMiddleware(), function (req, res) {

      const options = { title: 'Dashboard' };

      res.render('dashboard/new-simulation-group', options);
   });

   app.get('/workers', function (req, res) {

      const workers = workerManager.getAll();

      res.send(workers);
   });

}