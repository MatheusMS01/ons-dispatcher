////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

module.exports = function (app) {
   app.get('/', (req, res) => {

      res.render('home', {
         'title': "Home",
         'active': "home"
      });
   });
}