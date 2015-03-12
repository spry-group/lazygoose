var _ = require('lodash');
var mongoose = require('mongoose');
var rbac = require('mongoose-rbac');
var connect = require('connect');

// connect app/middle to provide a rest API for all of the models defined in mongoose.
// TODO: implement permission checks in rest callbacks.
function lazygoose(config) {
    
    var app = connect();
	var permissions = [];
	var actions = [ 'administer', 'create', 'read all', 'update all', 'delete all', 'read own', 'update own', 'delete own'];
	var endpoints = [];

	function _serveCollection(model, uri) {

		app.post(uri, function _postCollection(req, res, done) {
			model.create(req.body, function(err, entity) {
				if (err) res.status(500).send(err);
				else res.send(entity);
			});
		});

		app.get(uri, function _getCollection(req, res, done) {
			var per_page = req.query.per_page || config.per_page;
			var page = req.query.page || config.page;
			model.find()
				.limit(per_page)
				.skip(page * per_page)
				.exec(function(err, results) {
					res.send(results);
				});
		});
		var endpoint = { uri: uri, methods: [ 'post', 'get' ], model: model };
		endpoints.push(endpoint);
	}

	function _serveEntity(model, uri) {
		app.get(uri, function _getEntity(req, res, done) {
			res.send(req[model.modelName]);
		});

		app.put(uri, function _putEntity(req, res, done) {
			res.send(501, { message: 'Not implemented.'});
		});

		app.delete(uri, function _deleteEntity(req, res, done) {
			model.findOneAndRemove({id: req[model.modelName].id}, function(err, entity) {
				if (err) res.status(500).send(err);
				else res.send(entity);
			});
		});
		var endpoint = { uri: uri, methods: [ 'get', 'put', 'delete' ], schema: model.schema };
		endpoints.push(endpoint);
	}

	function _serveModel(model) {
		var collectionUri =   model.collection.name;
		var entityUri =  model.collection.name + '/:' + model.modelName;

		_.each(actions, function (action) {
			permissions.push({subject: model.modelName, action: action});
		});

		app.param(model.modelName, function(req, res, next, id) {
			model.findById(req.params[model.modelName],  function(err, entity) {
				if (err) return next(err);
				// Toss a 404 and move on with our lives. 
				if (!entity) return res.status(404).send({message: 'Not Found'});
				req[model.modelName] = entity;
				return next();
			});
		});
		_serveCollection(model, collectionUri);
		_serveEntity(model, entityUri);
	}

	_.each(mongoose.models, _serveModel);

	app.get(path, function (req, res, done) {
		res.send(endpoints);
	});

	// create default permissions.
	rbac.Permission.create(permissions, function(err) {
		var perms = Array.prototype.slice.call(arguments, 1);
		admin = new rbac.Role({ name: 'admin'});
		admin.permissions = perms;
		admin.save();
	});

	return app;
}

module.exports = lazygoose;