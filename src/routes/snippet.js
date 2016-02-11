'use strict'

var hub = require('../lib/hub')
var connection = require('../lib/corbelConnection')
var engine = require('../lib/engine')
var ComposrError = require('../lib/ComposrError')
var logger = require('../utils/composrLogger')
var auth = require('../lib/auth')

var Snippet = {}

Snippet.getCorbelErrorBody = function (corbelErrResponse) {
  var errorBody = typeof (corbelErrResponse.data) !== 'undefined' && typeof (corbelErrResponse.data.body) === 'string' && corbelErrResponse.data.body.indexOf('{') !== -1 ? JSON.parse(corbelErrResponse.data.body) : corbelErrResponse
  return errorBody
}

Snippet.upsert = function (req, res) {
  var authorization = Snippet.getAuthorization(req)
  var snippet = req.body || {}
  var driver = Snippet.getDriver(authorization)
  var domain = Snippet.getDomain(authorization)

  Snippet.checkPublishAvailability(driver)
    .then(function () {
      Snippet.validate(snippet)
        .then(function () {
          // TODO: check if we generate the snippet ID
          // snippet.id = domain + '!' + snippet.name)
          Snippet.emitEvent('snippet:upsert', domain, snippet.id)
          logger.debug('Storing or updating snippet', snippet.id, domain)
          Snippet.upsertCall(snippet.id, snippet)
            .then(function (response) {
              res.send(response.status, response.data)
            })
            .catch(function (error) {
              var errorBody = Snippet.getCorbelErrorBody(error)
              res.send(error.status, new ComposrError('error:snippet:create', errorBody, error.status))
            })
        })
        .catch(function (result) {
          var errors = result.errors
          logger.warn('SERVER', 'invalid:snippet', snippet.id, result)
          res.send(422, new ComposrError('error:snippet:validation', 'Error validating snippet: ' +
            JSON.stringify(errors, null, 2), 422))
        })
    })
    .catch(function (error) {
      var errorBody = Snippet.getCorbelErrorBody(error)
      logger.warn('SERVER', 'invalid:client:snippet', errorBody)
      res.send(401, new ComposrError('error:snippet:create', 'Unauthorized client', 401))
    })
}

Snippet.checkPublishAvailability = function (driver) {
  return driver.resources.collection(engine.snippetsCollection)
    .get()
}

Snippet.delete = function (req, res, next) {
  var authorization = Snippet.getAuthorization(req)
  var driver = Snippet.getDriver(authorization)
  var snippetID = Snippet.getFullId(authorization, req.params.snippetId)

  logger.debug('snippet:delete:id', snippetID)
  Snippet.deleteCall(driver, snippetID)
    .then(function (response) {
      logger.debug('snippet:deleted')
      res.send(response.status, response.data)
    })
    .catch(function (error) {
      next(new ComposrError('error:snippet:delete', error.message, error.status))
    })
}

Snippet.getAuthorization = function (req) {
  return auth.getAuth(req)
}

Snippet.getDriver = function (authorization) {
  return connection.getTokenDriver(authorization)
}

Snippet.getDomain = function (authorization) {
  return connection.extractDomain(authorization)
}

Snippet.getFullId = function (authorization, snippetId) {
  return Snippet.getDomain(authorization) + '!' + snippetId
}

Snippet.validate = function (snippet) {
  return engine.composr.Snippets.validate(snippet)
}

Snippet.emitEvent = function (text, domain, id) {
  hub.emit(text, domain, id)
}

Snippet.upsertCall = function (id, data) {
  return engine.composr.corbelDriver.resources.resource(engine.snippetsCollection, id)
    .update(data)
}

Snippet.deleteCall = function (driver, snippetId) {
  return driver.resources.resource(engine.SnippetsCollection, snippetId).delete()
}

module.exports = {
  loadRoutes: function (server) {
    server.del('/snippet/:snippetID', function (req, res, next) {
      Snippet.delete(req, res, next)
    })

    server.del('/v1.0/snippet/:snippetID', function (req, res, next) {
      Snippet.delete(req, res, next)
    })

    server.put('/snippet', function (req, res, next) {
      Snippet.upsert(req, res, next)
    })

    server.put('/v1.0/snippet', function (req, res, next) {
      Snippet.upsert(req, res, next)
    })
  },
  Snippet: Snippet
}
