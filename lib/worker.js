var phraseLoader = require('./phraseLoader'),
    express = require('express'),
    router = express.Router(),
    amqp = require('amqplib');

var worker = function() {
    amqp.connect('amqp://localhost').then(function(conn) {
        process.env.WORKER_CONN = conn;

        return conn.createChannel().then(function(ch) {
            var ok = ch.assertQueue('composr', {
                durable: true
            });

            ok = ok.then(function() {
                ch.prefetch(1);
            });

            ok = ok.then(function() {
                ch.consume('composr', doWork, {
                    noAck: false
                });
                console.log('Worker up');
            });

            return ok;

            function doWork(msg) {
                var body = msg.content.toString();
                console.log(body);
                var phrase = JSON.parse(body);
                phraseLoader(router, phrase);
            }
        });
    }).then(null, console.warn);
};

worker();

module.exports = router;
