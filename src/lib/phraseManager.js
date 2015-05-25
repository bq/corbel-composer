'use strict';


var validate = require('./validate'),
    corbel = require('corbel-js'),
    config = require('../config/config'),
    phrases = require('./phrasesData'),
    ComposerError = require('./composerError'),
    engine = require('./engine'),
    tripwire = require('tripwire'),
    logger = require('../utils/logger'),
    _ = require('lodash'),
    q = require('q');

var executePhrase = function executePhrase(context, compoSR, phraseBody){
  var domain = require('domain').create();

  domain.on('error', function(error) {
    logger.error('domain:error', error);
    var err;
    if (error === 'Blocked event loop.'){
      err = new ComposerError('error:custom', 'phrase timeout', 503);
      context.next(err);
    }else{
      err = new ComposerError('error:custom', 'uncaught error', 500);
      context.next(err);
    }
  });

  domain.run(function() {
    // set the limit of execution time to 10000 milliseconds
    tripwire.resetTripwire(config.timeout || 10000);

    /* jshint evil:true */
    var funct = Function.apply(null, _.keys(context).concat('compoSR', phraseBody));
    funct.apply(null, _.values(context).concat(compoSR));

    // clear the tripwire (in this case this code is never reached)
    var ctx = { timedout: true };
    tripwire.clearTripwire(ctx);
  });
};

var registerPhrase = function(router, phrase) {
    validate.isValue(router, 'undefined:router');
    validate.isValue(phrase, 'undefined:phrase');

    var domain = phrase.id.split('!')[0];
    phrases.list[domain] = phrases.list[domain] || [];

    var exists = _.findIndex(phrases.list[domain], function(item) {
        return item.id === phrase.id;
    });

    if (exists !== -1) {
        phrases.list[domain][exists] = phrase;
    } else {
        phrases.list[domain].push(phrase);
    }

    var url = phrase.id.replace(/!/g, '/');

    ['get', 'post', 'put', 'delete', 'options'].forEach(function(method) {
        if (phrase[method]) {
            logger.info('Registering ' + method.toUpperCase() + ' ' + url);
            router[method]('/' + url, function(req, res, next) {

                var iamToken = req.get('Authorization') || undefined;
                if (iamToken) {
                    iamToken = {
                        'accessToken': iamToken.replace('Bearer ', '')
                    };
                }

                var driverObtainFunction = function(defaults){
                  return function(options){
                    return corbel.getDriver(_.defaults(options, defaults));
                  };
                };


                corbel.generateDriver = driverObtainFunction(config['corbel.driver.options']);
                var corbelDriver = corbel.generateDriver({
                  iamToken: iamToken
                });

                var context = {
                  req: req,
                  res: res,
                  next: next,
                  corbelDriver: corbelDriver,
                  corbel: corbel,
                  _: _,
                  q: q
                };
                //We have left compoSR alone, without including it in the context because someday we might
                //want to have compoSR use the context for binding req, res... to the snippets
                var compoSR = engine.getCompoSR(domain);

                executePhrase(context, compoSR, phrase[method].code);

            });
        }
    });
};

var unregisterPhrase = function(router, phrase) {
    validate.isValue(router, 'undefined:router');
    validate.isValue(phrase, 'undefined:phrase');
    validate.isValue(phrase.id, 'undefined:phrase:id');

    var domain = phrase.id.split('!')[0];
    var url = '/' + phrase.id.replace(/!/g, '/');

    // remove from express
    var i = 0;
    while (i < router.stack.length) {
        if (router.stack[i].route.path === url) {
            router.stack.splice(i, 1);
        } else {
            i++;
        }
    }

    // remove from internal data
    var exists = _.findIndex(phrases.list[domain], function(item) {
        return item.id === phrase.id;
    });

    if (exists !== -1) {
        phrases.list[domain].splice(exists, 1);
    }
};

var getPhrases = function(domain) {
    return phrases.list[domain];
};

module.exports.registerPhrase = registerPhrase;
module.exports.unregisterPhrase = unregisterPhrase;
module.exports.executePhrase = executePhrase;
module.exports.getPhrases = getPhrases;
