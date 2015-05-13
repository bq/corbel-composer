'use strict';

// Integration
var timeoutTests = require('./specs/timeout.js'),
    errorHandlerTests = require('./specs/errorHandlers.js'),
    exampleTests = require('./specs/example.js'),
    phraseTests = require('./specs/phrase.js');

module.exports = function(app){
  timeoutTests(app);
  errorHandlerTests(app);
  exampleTests(app);
  phraseTests(app);
};
