'use strict';

var phraseManager = require('./phraseManager'),
  ComposerError = require('./composerError'),
  connection = require('./corbelConnection'),
  q = require('q'),
  pmx = require('pmx'),
  config = require('./config'),
  logger = require('../utils/logger');

var PAGE_SIZE = 10;

var getPhrase = function(driver, phrasesCollection, phrases, promise, pageNumber) {
  phrases = phrases || [];
  pageNumber = pageNumber || 0;
  promise = promise || q.resolve();

  return promise.then(function() {

    var params = {
      pagination: {
        page: pageNumber
      }
    };

    return driver.resources.collection(phrasesCollection).get(params, 'application/json').
    then(function(response) {
      if (response.data && response.status === 200) {
        phrases = phrases.concat(response.data);
        if (response.data.length < PAGE_SIZE) {
          return phrases;
        } else {
          return getPhrase(driver, phrasesCollection, phrases, promise, pageNumber + 1);
        }
      } else {
        pmx.notify('error:composer:corbel:phrases');
        throw new ComposerError('error:composer:corbel:phrases', '', 500);
      }
    });
  });
};


var bootstrapPhrases = function() {
  var dfd = q.defer();

  process.env.PHRASES_COLLECTION = 'composr:Phrase';

  connection.driver.then(function(driver) {
    getPhrase(driver, connection.PHRASES_COLLECTION).then(function(phrases) {

      phrases.forEach(function(phrase) {
        logger.debug('bootstrap:phrase:loaded', phrase.id);
        phraseManager.registerPhrase(phrase);
      });

      dfd.resolve();
    }).
    fail(function(error) {
      logger.error('error:bootstrap:load', error);
      setTimeout(bootstrapPhrases, config('bootstrap.retrytimeout') || 10000);
    });

  }).catch(function(error) {
    logger.error('error:bootstrap:driver', error);
    pmx.notify('error:bootstrap:driver', error);
    connection.regenerateDriver();
    setTimeout(bootstrapPhrases, config('bootstrap.retrytimeout') || 10000);
    //dfd.reject(error); TODO: add retries max count
  });

  return dfd.promise;
};

function bootstrapSnippets() {
  //TODO: obtain snippets
  var dfd = q.defer();
  dfd.resolve();
  return dfd.promise;
}


module.exports = {
  phrases: bootstrapPhrases,
  snippets: bootstrapSnippets
};
