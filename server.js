//Init
var Twit = require('twit')
var fs = require('fs'),
    path = require('path'),
    Twit = require('twit'),
    config = require(path.join(__dirname, 'config.js'));
var T = new Twit(config);
//Randomly chosen directory (new one chosen every day)
var chosenDirectory;

//Gets the list of directories inside 'images'
const {
    lstatSync,
    readdirSync
} = require('fs')
const {
    join
} = require('path')
const isDirectory = source => lstatSync(source).isDirectory()
const getDirectories = source =>
    readdirSync(source).map(name => join(source, name)).filter(isDirectory)

//To avoid Heroku $PORT error
var express = require('express');
var app = express();
app.set('port', (process.env.PORT || 5000));
app.get('/', function(request, response) {
    var result = 'App is running'
    response.send(result);
}).listen(app.get('port'), function() {
    console.log('App is running, server is listening on port ', app.get('port'));
});

//To avoid Heroku's free version's DYNO to go to sleep after 30 min (and shut the app down))
var http = require("http");
setInterval(function() {
    console.log('Ping!');
    http.get("http://everydaymanga.herokuapp.com");
}, 1200000);

//Pick a random image among those inside the chosen folder
function random_from_array(images) {
    return images[Math.floor(Math.random() * images.length)];
}

//Post a random image among those inside the chosen folder
function upload_random_image(images) {
    console.log('Opening an image...');
    var image_path = path.join(chosenDirectory + '/' + random_from_array(images)),
        b64content = fs.readFileSync(image_path, {
            encoding: 'base64'
        });

    console.log('Uploading an image...');

    T.post('media/upload', {
        media_data: b64content
    }, function(err, data, response) {
        if (err) {
            console.log('ERROR:');
            console.log(err);
        } else {
            console.log('Image uploaded!');
            console.log('Now tweeting it...');

            T.post('statuses/update', {
                    status: path.dirname(image_path).split(path.sep).pop(),
                    media_ids: new Array(data.media_id_string)
                },
                function(err, data, response) {
                    if (err) {
                        console.log('ERROR:');
                        console.log(err);
                    } else {
                        console.log('Posted an image!');
                        try {
							fs.unlinkSync(image_path);
						} catch(err) {
							console.log('ERROR: unable to delete image ' + image_path);
						}
//                        fs.unlink(image_path, function(err) {
//                            if (err) {
//                                console.log('ERROR: unable to delete image ' + image_path);
//                            } else {
//                                console.log('image ' + image_path + ' was deleted');
//                            }
//                        });
                    }
                }
            );
        }
    });
}

var main = function() {
    chosenDirectory = getDirectories(__dirname + '/images')[Math.floor(Math.random() * getDirectories(__dirname + '/images').length)];

    fs.readdir(chosenDirectory, function(err, files) {
        if (err) {
            console.log(err);
        } else {
            if (files.length == 0) {
                fs.rmdir(chosenDirectory, function(err) {
                    if (err) {
                        console.log('ERROR: unable to delete directory ' + chosenDirectory);
                    } else {
                        console.log('Directory ' + chosenDirectory + ' was deleted');
						main();
                    }
                });
            } else {
                var images = [];
                files.forEach(function(f) {
                    images.push(f);
                });
                upload_random_image(images);
            }
        }
    });
}

//MAIN, that will execute every day
setInterval(function() {main();}, 86400000);
//setInterval(function() {main();}, 60000);