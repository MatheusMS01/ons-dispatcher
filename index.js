/* Copyright (c) 2017 Matheus Medeiros Sarmento */

const express = require('express');
const handler = require(__dirname + '/application/handler');

const app = express();

app.set('view-engine', 'ejs');

app.use(express.static(__dirname + '/public'));

handler(app);

app.listen(8080);