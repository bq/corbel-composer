'use strict';

var express = require('express'),
  router = express.Router(),
  config = require('../lib/config'),
  engine = require('../lib/engine'),
  q = require('q'),
  https = require('https'),
  packageJSON = require('../../package.json');

router.get('/', function(req, res) {
  res.render('index', {
    title: 'Composing your phrases',
    version: packageJSON.version
  });
});

router.get('/version', function(req, res) {
  res.send(packageJSON);
});

function status(req, res) {

  var phrasesLoaded = engine.composr.Phrases.count();

  var statuses = [{
    title: 'Phrases Loaded',
    ok: phrasesLoaded > 0 ? true : false
  }];


  var modules = ['iam', 'resources'];
  var path = config('corbel.driver.options').urlBase;
  var promises = modules.map(function(module) {
    var deferred = q.defer();

    https.get(path.replace('{{module}}', module) + '/version', function() {
      statuses.push({
        title: module,
        ok: true
      });
      deferred.resolve();
    })
      .on('error', function() {
        statuses.push({
          title: module,
          ok: false
        });

        deferred.resolve();
      });

    return deferred.promise;
  });

  q.all(promises)
    .then(function() {
      if (req.accepts('html')) {
        res.render('status', {
          statuses: statuses,
          version: packageJSON.version,
          title: 'CompoSR Status',
          appName: 'CompoSR'
        });

      } else {
        res.send({
          version: packageJSON.version,
          statuses: statuses
        });
      }
    });

}

router.get('/status', status);
router.get('/healthcheck', status);

module.exports = router;