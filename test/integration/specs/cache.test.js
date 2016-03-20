'use strict'

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect

function test (server) {
  describe('Cache:', function () {
    it('is disabled', function (done) {
      request(server.app)
        .get('/cache')
        .set('Authorization', 'sample_token')
        .expect(200)
        .end(function (error, response) {
          expect(response).to.be.an('object')
          if (!error && response.statusCode === 200) {
            request(server.app)
              .get('/cache')
              .set('Authorization', 'other_token')
              .set('Cache-Control', 'max-age=0')
              .set('If-None-Match', 'W/"d-9dc66274"')
              .expect(200)
              .end(function (error, response) {
                expect(response).to.be.an('object')
                if (!error && response.statusCode === 200) {
                  return done()
                } else {
                  return done(error || response)
                }
              })
          } else {
            return done(error || response)
          }
        })
    })
  })
}

module.exports = test
