////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const express = require('express');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const upload = require('express-fileupload');

const dispatcher = require('./servers/dispatcher/dispatcher');
const db_driver = require('./database/db_driver');
const router = require('./servers/web/router');

const app = express();

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());
app.use(flash());
app.use(upload());

// Setup Engine
app.set('view engine', 'ejs');

// Setup Database Driver
db_driver(app);

// Initialize dispatcher
dispatcher();

// Call handler
router(app);

// Listen requests
app.listen(8080);