////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const router = require('../router');

module.exports = function (app) {
   // Profile
   app.get('/profile', router.authenticationMiddleware(), (req, res) => {
      res.render('profile', {
         title: "Profile",
         active: "profile"
      })
   });
}