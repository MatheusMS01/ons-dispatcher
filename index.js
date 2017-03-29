// Copyright (c) 2017 Matheus Medeiros Sarmento

const express = require('express');
const handler = require(__dirname + '/public/javascripts/handler');

const app = express();

// Setup Engine
app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public'));

// Call handler
handler(app);

// Listen requests
app.listen(8080);