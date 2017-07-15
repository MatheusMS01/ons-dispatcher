////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

'use strict';

const simulator = require('./simulator');
const worker = require('./worker');
const ddp = require('./ddp');
const communication = require('./communication');

//simulator();
//worker();
ddp.execute();
communication();