# corbel composer

[![Build Status](https://api.travis-ci.org/bq/corbel-composer.png?branch=master)](http://travis-ci.org/bq/corbel-composer)
[![npm version](https://badge.fury.io/js/corbel-composer.svg)](http://badge.fury.io/js/corbel-composer)
[![Dependency status](https://david-dm.org/bq/corbel-composer/status.png)](https://david-dm.org/bq/corbel-composer#info=dependencies&view=table)
[![Dev Dependency Status](https://david-dm.org/bq/corbel-composer/dev-status.png)](https://david-dm.org/bq/corbel-composer#info=devDependencies&view=table)
[![Coverage Status](https://coveralls.io/repos/bq/corbel-composer/badge.svg?branch=master)](https://coveralls.io/r/bq/corbel-composer?branch=master)

A corbel-composer is a middleware based in [nodeJS](https://nodejs.org/api/) with [express](http://expressjs.com/4x/api.html), to offer developers to make his own specific application API bsed in [corbel-js](https://github.com/bq/corbel-js)

## [Homepage](http://opensource.bq.com/corbel-js/)


## Overview

[text]

### Diagram

[image]


## QuickStart

- install

  ```
  npm install -g bq/corbel-composer
  ```

- run server

  ```
  corbel-composer
  ```


## Postman Playground

1. Get [postman](https://www.getpostman.com/)
2. Import corbel-composer collection:

  ```
  https://raw.githubusercontent.com/bq/corbel-composer/master/doc/postman/postman.json
  ```
3. Import evironment example:

  ```
  https://raw.githubusercontent.com/bq/corbel-composer/master/doc/postman/environment.example.json
  ```
4. Import globals:

  ```
  https://raw.githubusercontent.com/bq/corbel-composer/master/doc/postman/globals.example.json
  ```
5. Enjoy!


## Phrase Model

```
{
    "url": "phraseName",
    "get": {
        "code": "res.render('index', {title: 'hello world'});",
        "doc": {
            "description": "Phrase description",
            "queryParameters": {
                "param1": {
                    "type": "number",
                    "description": "Param description",
                    "default": 0
                }
            },
            "responses": {
                "200": {
                    "body": {
                        "application/json": {
                            "schema": "{\n\t"$schema": "http://json-schema.org/schema",\n\t"type": "object",\n\t"description": "A canonical song",\n\t"properties": {\n\t\t"title": {\n\t\t\t"type": "String"\n\t\t},\n\t\t"artist": {\n\t\t\t"type": "String"\n\t\t}\n\t},\n\t"required": ["title", "artist"]\n}"
                        }
                    }
                }
            }
        }
    }
}
```


## Example Phrases

### `count` value in collections query

```json
{
    "url": "countExample",
    "get": {
        "code": "CORBEL-JS_SNIPPET"
    }
}
```

where `code` should be a string with this [corbel-js](https://github.com/bq/corbel-js) snippet:

```javascript
var count;
corbelDriver.resources.collection('test:ComposrTest').get(undefined, {
    aggregation: {
        $count: '*'
    }
}).then(function(response) {
    count = response.data.count;
    return corbelDriver.resources.collection('test:ComposrTest').get();
}).then(function(response) {
    res.send({
        data: response.data,
        'count': count
    });
}).catch(function(error) {
    res.send(error);
});
```

### Path & query parameters

```json
{
    "url": "paramsExample/:pathparam",
    "get": {
        "code": "res.status(200).send('path param: ' + req.params.pathparam + ',  query param: ' + req.query.queryparam);"
    }
}
```

## Reference

* [corbel-js](https://github.com/bq/corbel-js) API
* [Request object](http://expressjs.com/4x/api.html#req)
* [Response object](http://expressjs.com/4x/api.html#res)
* [RAML](http://raml.org/) for phrase definition

## API design best practices

### Naming

* Use nouns not verbs
* Use plural nouns

| Resource     | GET (read)             | POST (create)            | PUT (update)                | DELETE                    |
| ------------ | ---------------------- | ------------------------ | --------------------------- | ------------------------- |
| /cars        | Returns a list of cars | Create a new ticket      | Bulk update of cars         | Delete all cars           |
| /cars/711    | Returns a specific car | Method not allowed (405) | Updates a specific ticket   | Deletes a specific ticket |
| /purchase    | Get al purchases       | Create a new purchase    | Bulk update of purschases   | Delete all purchases      |
| /purchase/85 | Returns a purchase     | Method not allowed (405) | Updates a specific purchase | Delete all purchases      |


Resource  GET
read  POST
create  PUT
update  DELETE
/cars Returns a list of cars  Create a new ticket Bulk update of cars Delete all cars
/cars/711 Returns a specific car  Method not allowed (405)   Deletes a specific ticket

### Versioning your phrases

A simple way to achieve this is definning the phrase version in the url, like this

```
{
    "url": "v1/paramsExample/:pathparam",
    "get": { ... }
}
```

A phrase version should change only if the phrase contract is broken


### Reference

* [APIgee](http://apigee.com/about/resources/ebooks/web-api-design)
* [Principios de diseño de APIs REST](https://leanpub.com/introduccion_apis_rest)
* [Best Practices for Designing a Pragmatic RESTful API](http://www.vinaysahni.com/best-practices-for-a-pragmatic-restful-api#versioning)
* [REST API Resoruces](http://www.restapitutorial.com/resources.html)

## Run in a docker container

- clone repo
- build image

  ```
  docker build -t <username>/corbel-composer .
  ```

- run container

  ```
  docker run -d -p 3000:3000 --name="corbel-composer"  <username>/corbel-composer
  ```
- start/stop container

  ```
  docker start/stop corbel-composer
  ```


## Tests

```
npm test
```


## Coverage

```
grunt test:coverage
```


## Debug

Requires [node-inspector](https://github.com/node-inspector/node-inspector)
```
npm install -g node-inspector
```

* Server

  ```
  npm run debug
  ```

* Tests

  ```
  npm run test:debug
  ```

# Example code for phrases


## Login a client/application

### Prerequisites for login a client/application: Generate a jwt

**NodeJS** example

```javascript
var corbel = require('corbel-js');

function generateAssertion(claims, clientSecret) {
  claims.aud = corbel.Iam.AUD;
  return corbel.jwt.generate(claims, clientSecret);
}

var claims = {
  iss: credentials.clientId,
  scope: credentials.scopes
};

var jwt = generateAssertion(claims, credentials.clientSecret);

//Make a POST request to the login client phrase with jwt in the body
/*
 Expect an object containing
  {
    accessToken : '',
    expiresAt : ''
  }
*/
```
------

### Login client/application phrase code

```javascript
if (!req.body || !req.body.jwt) {
  throw new ComposerError('error:jwt:undefined', '', 401);
}
var corbelDriver = corbel.generateDriver({iamToken: ''});

/*
 * Required claims:
 * iss: CLIENT_ID
 * aud: 'http://iam.bqws.io'
 * scope: 'scope1 scope2'
 * exp: epoch + 1h
 */
corbelDriver.iam.token().create({
  jwt: req.body.jwt
}).then(function(response) {
  res.send(response.data);
}).catch(function(err){
  compoSR.run('global:parseError', { err : err, res : res});
});
```

## Login a user

### Prerequisites for login a user: Generate a jwt

**NodeJS** example

```javascript
var corbel = require('corbel-js');

function generateAssertion(claims, clientSecret) {
  claims.aud = corbel.Iam.AUD;
  return corbel.jwt.generate(claims, clientSecret);
}

//Note that appCredentials contains the credentials of the client app

var claims = {
  iss: appCredentials.clientId,
  'basic_auth.username': userCredentials.username,
  'basic_auth.password': userCredentials.password,
  scope: userCredentials.scopes
};

var jwt = generateAssertion(claims, appCredentials.clientSecret);

//Make a POST request to the login user phrase with jwt in the body

/*
 Expect an object containing
  {
    tokenObject: {
      accessToken : '',
      expiresAt : '',
      refreshToken : ''
    },
    user: {
      ...
    }
  }
*/
```
------

### Login user phrase code

```javascript
if (!req.body || !req.body.jwt) {
  throw new ComposerError('error:jwt:undefined', '', 401);
}
var corbelDriver = corbel.generateDriver({iamToken: ''});

var tokenObject;

/*
 * Request a session token for the user
 * Required claims:
 * iss: CLIENT_ID
 * basic_auth.username: USERNAME
 * basic_auth.password: PASSWORD
 * aud: 'http://iam.bqws.io'
 * scope: 'scope1 scope2'
 * exp: epoch + 1h
 */
corbelDriver.iam.token().create({
  jwt : req.body.jwt
}).then(function(response){

  //Tenemos el token de usuario, asimismo tambien el refresh y el expires
  tokenObject = response.data;

  //Recreamos el corbelDriver con los settings del usuario
  corbelDriver = corbel.generateDriver({
    iamToken : tokenObject
  });

  //Obtain the logged user data
  return corbelDriver.iam.user('me').get();
}).then(function(response){
  res.send({
    tokenObject: tokenObject,
    user: response.data
  });
}).catch(function(err){
  compoSR.run('global:parseError', { err : err, res : res});
});
```
## Refresh a token

### Prerequisites for refreshing a user token: Generate a jwt with the refresh token

**NodeJS** example

```javascript
var corbel = require('corbel-js');

function generateAssertion(claims, clientSecret) {
  claims.aud = corbel.Iam.AUD;
  return corbel.jwt.generate(claims, clientSecret);
}

//Note that appCredentials contains the credentials of the client app

var claims = {
  iss: appCredentials.clientId,
  'refresh_token': refresh_token,
  scope: userCredentials.scopes
};

var jwt = generateAssertion(claims, appCredentials.clientSecret);

//Make a POST request to the refresh token phrase with jwt in the body

/*
 Expect an object containing
 {
   accessToken : '',
   expiresAt : '',
   refreshToken : ''
 }
*/
```
------

### Refresh token phrase code

```javascript
if (!req.body || !req.body.jwt) {
  throw new ComposerError('error:jwt:undefined', '', 401);
}

var corbelDriver = corbel.generateDriver({iamToken: ''});


/*
 * Required claims:
 * iss: CLIENT_ID
 * refresh_token: REFRESH_TOKEN
 * aud: 'http://iam.bqws.io'
 * scope: 'scope1 scope2'
 * exp: epoch + 1h
 */
corbelDriver.iam.token().create({
    jwt : req.body.jwt
  })
  .then(function(response){
    res.send(response.data);
  })
  .catch(function(err){
    compoSR.run('global:parseError', { err : err, res : res});
  });

```

## Logout a user


### Prerequisites for login out a user: *have an accessToken*

**NodeJS** example

```javascript
var http = require('http');

var accessToken = "xxxxx":

var post_options = {
  host: 'composrendpoint.composr',
  path: '/logoutuser',
  method: 'POST',
  headers: {
    'Authorization': accessToken
  }
};


//Make a POST request to the logout user phrase with an Authorization header
http.request(post_options, function(res) {
  //Expect 204 for a good logout, 401 for unauthorized
});

```
------

### Logout user phrase code

```javascript
if (!req.get('Authorization')) {
  throw new ComposerError('error:unauthorized', 'Authorization missing', 401);
}

var method =  req.params.type && req.params.type === 'all' ? 'disconnect' : 'signOut';

/*
 * Disconnects a user session
 */
corbelDriver.iam.user('me')[method]()
  .then(function(response){
    res.send(response.data);
  }).catch(function(err){
    compoSR.run('global:parseError', { err : err, res : res});
  });
```

### Logout a user from all devices:
```javascript
if (!req.get('Authorization')) {
  throw new ComposerError('error:unauthorized', 'Authorization missing', 401);
}

/*
 * Disconnects a user session
 */

corbelDriver.iam.user('me')
  .disconnect()
  .then(function(response){
    res.send(response.data);
  }).catch(function(err){
    compoSR.run('global:parseError', { err : err, res : res});
  });
```

## Return current user info

```javascript
corbelDriver.iam.user('me').get();
```

# Code snippets

Code snippets are a minor form of `phrases`, they are accesible through the `compoSR` object on your phrases.

You can run your code snippets by executing `compoSR.run('snippetName', params);` where `params` is anything you want it to be. From your snippets you will be allowed to access to the `params` variable and the `compoSR` object itself.

`compoSR` will be allowed to access any snippets defined in your domain and your parent domains.

For example, `_silkroad:composer` will be able to access all the `_silkroad:composer` snippets and all the `_silkroad` snippets. If a snippet has the same name on both of the domains, the one with a deepest hierarchy will overwrite the first one.

Let's take a look at it:
  - Given this snippets:

```javascript
var snippets = {
  'domainName' : [
    {
      name : 'myFunction',
      code : 'compoSR.run("hello", "world")'
    },
    {
      name : 'hello',
      code: 'console.log(params);'
    }
  ],
  'domainName:childDomain' : [
    {
      name : 'hello',
      code: 'console.log("I am the child: ", params);'
    }
  ],
}
```

  - If we run the `myFunction` snippet, accesing from a client that belongs to the domain named `domainName:childDomain` it will show this:

```javascript
compoSR.run('myFunction');
//=> I am the child: world
```

  - If the client or user belongs to the domain named `domainName` and we execute the same function we'll get:

```javascript
compoSR.run('myFunction');
//=> hello world
```

# Logs

Logs are written to the linux syslog and in the logs folder.

You can set `logFile` and `logLevel` in your config file.

Available log levels can be found at [winston's npm page](https://www.npmjs.com/package/winston#logging-levels):
- debug
- info
- warn
- error

You can disable syslog by setting `syslog` property to `false` in the config file.
