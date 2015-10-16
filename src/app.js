'use strict';

var express = require('express'),
  path = require('path'),
  favicon = require('serve-favicon'),
  morgan = require('morgan'),
  helmet = require('helmet'),
  ejslocals = require('ejs-locals'),
  cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser'),
  engine = require('./lib/engine'),
  WorkerClass = require('./lib/worker'),
  ComposrError = require('./lib/ComposrError'),
  config = require('./lib/config'),
  timeout = require('connect-timeout'),
  responseTime = require('response-time'),
  domain = require('express-domain-middleware'),
  routes = require('./routes'),
  cors = require('cors'),
  pmx = require('pmx'),
  fs = require('fs'),
  app = express();

var worker =  new WorkerClass();

var ERROR_CODE_SERVER_TIMEOUT = 503;
var DEFAULT_TIMEOUT = 10000;

/*************************************
  Logs
**************************************/
var logger = require('./utils/logger');
//Custom log
app.set('logger', logger);

// Access log, logs http requests
var accessLogStream = fs.createWriteStream('logs/access.log', {
  flags: 'a'
});
app.use(morgan('combined', {
  stream: accessLogStream
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('ejs', ejslocals);

var env = process.env.NODE_ENV || 'development';
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env === 'development';

/*******************************
    Change powered by
********************************/
app.use(helmet());
  var powered = require('./utils/powered');
  var randomIndex = function(powered) {
    return Math.floor(Math.random() * powered.length );
  };
  app.use(helmet.hidePoweredBy({
    setTo: powered[randomIndex(powered)]
  }));

app.use(responseTime());
app.use(favicon(__dirname + '/../public/img/favicon.ico'));

/*************************************
  Cache
**************************************/
app.disable('etag');

/**************************************
  Body limit
**************************************/
app.use(bodyParser.json({
  limit: config('bodylimit') || '50mb'
}));

app.use(bodyParser.urlencoded({
  extended: true,
  limit: config('bodylimit') || '50mb'
}));

app.use(cookieParser());

app.use(express.static(path.join(__dirname, '../public')));

app.use(domain);

/*************************************
  Cors
**************************************/
app.use(cors({
  origin: function(origin, callback) {
    callback(null, true);
  },
  credentials: true
}));

app.options('*', cors());

app.use(function(req, res, next) {
  res.header('Access-Control-Expose-Headers', 'Location');
  next();
});

app.use(timeout(config('timeout') || DEFAULT_TIMEOUT, {
  status: ERROR_CODE_SERVER_TIMEOUT
}));


/*************************************
  Engine middlewares
**************************************/
app.use(routes.base);
app.use(routes.doc);
app.use(routes.phrase);
app.use(routes.snippet);

if (app.get('env') === 'development' || app.get('env') === 'test') {
  app.use(routes.test);
}

var haltOnTimedout = function(req, res, next) {
  if (!req.timedout) {
    next();
  }
};

app.use(haltOnTimedout);

/*************************************
  Error handlers
**************************************/

/// catch 404 and forward to error handler
var NotFundHandler = function(req, res, next) {
  next(new ComposrError('error:not_found', 'Not Found', 404));
};
app.use(NotFundHandler);

var errorHandler = function(err, req, res, next) {

  var message = err.error || err.message || err;
  if (message === 'Error caught by express error handler') {
    message = 'error:internal';
  }

  var status = err.status || 500;
  if (err.timeout || message === 'Blocked event loop.') {
    message = 'error:timeout';
    status = ERROR_CODE_SERVER_TIMEOUT;
  }

  if (err.domain) {
    // usually a tripwire error
    // release any resource...
  }
  var errorLogged = {
    status: status,
    error: message,
    errorDescription: err.errorDescription || '',
    // development error handler
    // will print stacktrace
    trace: (app.get('env') === 'development' ? err.stack : '')
  };
  logger.error(errorLogged);
  res.status(status);
  res.json(errorLogged);

  next(err);
};

app.use(errorHandler);

app.use(pmx.expressErrorHandler());

process.on('uncaughtException', function(err) {
  logger.debug('Error caught by uncaughtException', err);
  logger.error(err);
  if (!err || err.message !== 'Can\'t set headers after they are sent.') {
    process.exit(1);
  }
});

//Trigger the worker execution
worker.init();

//TODO : only trigger the worker and the driver connection after the data is loaded

module.exports = engine.init(app);
