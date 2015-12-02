'use strict';
var request = require('supertest'),
chai = require('chai'),
expect = chai.expect,
chaiAsPromised = require('chai-as-promised'),
clientUtils = require('../utils/client');
chai.use(chaiAsPromised);

function test(server) {
  describe('Get to phrase returns not found', function() {
    var AdminClientData = clientUtils.getAdminClient();
    var adminClientToken;

    before(function(done) {
      request(server.app)
      .post('/token')
      .send(AdminClientData)
      .expect(200)
      .end(function(err, response) {
        expect(response).to.be.an('object');
        expect(response.body.data.accessToken).to.exist;
        adminClientToken = response.body.data.accessToken;
        done(err);
      });
    });


    it('should return a list of phrases with a get to /phrase with correct authorization', function(done) {
      request(server.app)
      .get('/phrase')
      .set('Authorization', adminClientToken)
      .expect(200)
      .end(function(err, response) {
        expect(response.body).to.be.an('array');
        done(err);
      });
    });

    it('should return unauthorized with a get to /phrase with incorrect authorization', function(done) {
      request(server.app)
      .get('/phrase')
      .set('Authorization', 'fakeClientToken')
      .expect(401,done);
    });

    it('should return unauthorized with a get to /phrase without authorization', function(done) {
      request(server.app)
      .get('/phrase')
      .expect(401,done);
    });
  });
}

module.exports = test;
