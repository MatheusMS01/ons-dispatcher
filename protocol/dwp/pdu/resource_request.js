
const factory = require('../factory')
var extend = require('util')._extend

module.exports.format = function (data) {

   var object = extend({}, { Id: factory.Id.ResourceRequest });

   if (data !== undefined) {
      object = extend(object, data);
   }

   return JSON.stringify(object);
}