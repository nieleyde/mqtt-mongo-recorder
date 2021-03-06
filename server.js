/**
 *
 * This NodeJS application listens to MQTT messages and records them to MongoDB
 *
 * @author  Dennis de Greef <github@link0.net>
 * @license MIT
 *
 */
var mongodb  = require('mongodb');
var mqtt     = require('mqtt');
var config   = require('./config');
var os= require('os');
var cfenv    = require("cfenv")

//var vcap_services = JSON.parse(process.env.VCAP_SERVICES);
//console.log('START1------->');
//console.log(cfenv.getAppEnv().getService('mymongo'));
//console.log('END------->');
//console.log('START2------->');
//console.log(cfenv.getAppEnv().getService('MQTT'));
//console.log('END------->');
//console.log('START3------->');
//console.log(vcap_services);
//console.log('END------->');

//var mqttUri  = 'mqtt://' + config.mqtt.hostname + ':' + config.mqtt.port;
var client   = mqtt.connect(cfenv.getAppEnv().getService('mymqtt').credentials.uri);

client.on('connect', function () {
    client.subscribe(config.mqtt.topic);
});


//var mongoUri = 'mongodb://' + config.mongodb.hostname + ':' + config.mongodb.port + '/' + config.mongodb.database;
var mongoUri = cfenv.getAppEnv().getService('mymongo').credentials.uri


mongodb.MongoClient.connect(mongoUri, function(error, database) {
    if(error != null) {
        throw error;
    }

    var collection = database.collection(config.mongodb.collection);
    collection.createIndex({ "ts": -1 });
    collection.createIndex({ "topic": 1 });

    client.on('message', function (topic, message) {
        console.log('NEW MESSAGE');

        var json = {};
        try {
            json = JSON.parse(String(message));
        } catch (e) {
            console.log(e);
        }
        var messageObject = {
            ts: new Date(),
            topic: topic,
            //container_os_host_name: os.hostname(),
            //container_os_platform: os.platform(),
            message: message.toString(),
            json: json
        };

        collection.insert(messageObject, function(error, result) {
            if(error != null) {
                console.log("ERROR: " + error);
            }
        });
    });
});
