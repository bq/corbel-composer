'use strict';

var express = require('express'),
    router = express.Router(),
    ComposerError = require('../lib/composerError'),
    phraseManager = require('../lib/phraseManager');

router.get('/e1', function(res) {
    res.undefinedFunction();
});

router.get('/e2', function() {
    throw new ComposerError('error:custom', '', 555);
});

router.get('/t1', function(req, res) {

    setTimeout(function() {
        res.send('Esto no debería verse');
    }, 100000);

});

router.get('/t2', function(req, res) {

    var domain = require('domain').create();

    domain.on('error', function(err) {
      console.log('domain:error', err.message);
    });

    domain.run(function() {

        var tripwire = require('tripwire');

        tripwire.resetTripwire(1000);

        var start = new Date();
        var loops = 30000000000;
        for (var i = 0; i < loops; i++) {
            //process.nextTick();
            //console.log(i / loops);
        }

        var end = new Date();
        console.log('delay', end.valueOf() - start.valueOf());

        res.send('Esto no debería verse');

        tripwire.clearTripwire();

    });

});


router.get('/t2phrase', function(req, res) {


  var phrase = function phrase(req, res){
    //Code of the phrase
    console.log('start bad phrase');

    var start = new Date();
    var loops = 30000000000;
    for (var i = 0; i < loops; i++) {
        //process.nextTick();
        //console.log(i / loops);
    }

    var end = new Date();
    console.log('delay', end.valueOf() - start.valueOf());

    res.send('Esto no debería verse');
  };

  //remove the function wrapper and only send the body to the phraseProcessManager
  var entire = phrase.toString();
  var body = entire.slice(entire.indexOf('{') + 1, entire.lastIndexOf('}'));
  phraseManager.executePhrase(body, req, res);

});

router.get('/t3phrase', function(req, res) {

  var phrase = function phrase(req, res){
    //Code of the phrase
    console.log('start good phrase');

    res.json({
      yes : 'potatoe'
    });
  };

  //remove the function wrapper and only send the body to the phraseProcessManager
  var entire = phrase.toString();
  var body = entire.slice(entire.indexOf('{') + 1, entire.lastIndexOf('}'));
  phraseManager.executePhrase(body, req, res);

});


module.exports = router;
