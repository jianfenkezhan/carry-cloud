'use strict';

const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const ecstatic = require('ecstatic');

const config = require('./combo.config');

const app = global.app = express();
app.set('env', config.env);

app.use(require('express-combojs')())

// routes
require('./routers')(app);

// pipeline
app.use(ecstatic({ root: config.path, showDir: true, autoIndex: false, cache: 'no-cache' }))
//cookie
.use(cookieParser())
// .use(bodyParser.urlencoded({
  // extended: false
// }))
.use(function(err, req, res, next) {
  res.json(err);
  console.error('[%s][%s] Express handle exception: [%s]', new Date(), process.pid, err);
  console.error(err)
});



app.listen(config.port, function() {
  console.log(`[${new Date()}] app start : ${config.port}`);
});

process.on('uncaughtException', function(err) {
  console.log('[%s][%s] Caught exception: [%s]', new Date(), process.pid, err);
  console.error(err)
});

module.exports = app;
