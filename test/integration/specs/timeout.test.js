'use strict';
var request = require('supertest'),
  chai = require('chai'),
  sinon = require('sinon'),
  expect = chai.expect;


function test(server) {
  describe('When a request to composr takes more than 10 seconds', function() {
    var phrasesToRegister = [{
      'url': 'timeout',
      'get': {
        'code': 'var a = 3; while(true){ a = a + 3; };',
        'doc': {

        }
      }
    }];

    before(function(done) {
      server.composr.Phrases.register('testDomain', phrasesToRegister)
        .then(function(results) {
          done();
        });
    });


    it('it fails with a 503 error', function(done) {

      this.timeout(30000);

      request(server.app)
        .get('/testDomain/timeout')
        .expect(503)
        .end(function(error, response) {
          expect(response).to.be.an('object');
          expect(response.body.status).to.equals(503);
          expect(response.body.error).to.equals('error:phrase:timedout:timeout');
          if (response.statusCode === 503) {
            return done();
          } else {
            return done(error || response);
          }

        });
    });


  });
}

module.exports = test;