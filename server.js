var mongodb = require('mongodb');
var express = require('express');
var path = require('path');
var app = express();
var request = require('request');
var ObjectID = mongodb.ObjectID;
var API = "https://api.flickr.com/services/rest/"


app.set('view engine', 'jade');
app.set('views', path.join(__dirname, 'public'));
app.use(express.static(__dirname + '/public'));

var db;

mongodb.MongoClient.connect(process.env.MONGODB_URI, function(err, database){
	if (err) throw err;
	db = database;
	console.log("Database connection ready");

	var server = app.listen(process.env.PORT || 8080, function(){
		var port = server.address().port;
		console.log('Server running');
	});
});

function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

app.get('/', function(req, res){
	var host = req.headers.host;
	res.render('index', {host: host})
})

app.get('/api/imagesearch/:param', function(req, res){

var query = req.query.offset;
var searchTerm = req.params.param;
var collection = db.collection('search');
var result = [];

request({
	method: 'GET',
	uri: API,
	qs: {
		api_key: process.env.APIKEY,
		method: "flickr.photos.search",
		text: searchTerm,
		format: 'json',
		nojsoncallback:1,
		per_page:query
	}
}, function(err, response, body){
	var photos = JSON.parse(body);
	photos.photos.photo.map(function(item){
		result.push({
			url: 'https://farm'+item.farm+'.staticflickr.com/'+item.server+'/'+item.id+'_'+item.secret+'.jpg',
			snippet: item.title,
			thumbnail: 'https://farm'+item.farm+'.staticflickr.com/'+item.server+'/'+item.id+'_'+item.secret+'_t.jpg',
			context:'https://www.flickr.com/photos/'+item.owner+'/'+item.id
		})
	});

	collection.insert({term:searchTerm, when:new Date().toISOString()}, function(err, data){
		if (err) throw err;
		res.send(JSON.stringify(result));
	});
});
});


app.get('/api/latest/imagesearch', function(req, res){
	var collection = db.collection('search');
	collection.find({}, {_id: 0}).toArray(function(err, documents){
		if (err) console.log(err);
		res.send(JSON.stringify(documents));
	})
});
