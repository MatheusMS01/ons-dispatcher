// module1.js
// module that has events
const EventEmitter = require('events');

function haha() {}

// create EventEmitter object
var obj = new EventEmitter();

// export the EventEmitter object so others can use it
module.exports.obj = obj;
module.exports.haha = haha;

// other code in the module that does something to trigger events
// this is just one example using a timer
setInterval(function () {
   obj.emit("someEvent", someData);
}, 10 * 1000);
