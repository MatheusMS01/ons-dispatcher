// Copyright (c) 2017 Matheus Medeiros Sarmento

const express = require('express');
const handler = require('./controllers/handler');

const app = express();

app.use(express.static(__dirname + '/public'));

// Setup Engine
app.set('view engine', 'ejs');

// Call handler
handler(app);

// Listen requests
app.listen(8080);