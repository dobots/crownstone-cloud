"use strict";

const debug = require('debug')('loopback:dobots');
const createPromiseCallback = require('loopback-datasource-juggler/lib/utils').createPromiseCallback;
const _defaults = require('lodash').defaults;
const _get = require('lodash').get;
const Promise = require("bluebird");
let loopback = require('loopback');

module.exports = function(model) {

	model.disableRemoteMethodByName('getContainers');

	let checkAccess = function(requestId, requestOptions, callback) {
	  let userIdFromToken = requestOptions && requestOptions.accessToken && requestOptions.accessToken.userId || undefined;

		if (String(userIdFromToken) !== String(requestId)) {
			callback("Access denied");
		}
		else {
			callback();
		}
	};

	// model.beforeRemote('**', function(ctx, instance, next) {
	// 	debug("method.name: ", ctx.method.name);
	// 	next();
	// });

	model.beforeRemote('**', function(ctx, instance, next) {
    console.trace("Here", ctx.options)
		checkAccess(ctx.args.containerName, ctx.options, next);
	});

	model._deleteContainer = function (id, options,  next) {
    checkAccess(id, options, function(err) {
			if (err) return next(err);

			model.deleteContainer(id, next);
		})
	};

	model._getFiles = function (id, options, next) {
		checkAccess(id, options, function(err) {
			if (err) return next(err);

			model.getFiles(id, next);
		})
	};

	model._deleteFile = function (id, fileId, options, next) {
    checkAccess(id, options, function(err) {
			if (err) return next(err);

			model.deleteFile(id, fileId, next);
		})
	};

	model._upload = function (id, req, options, next) {
    checkAccess(id, options, function(err) {
			if (err) return next(err);

			model.upload(id, req, next);
		})
	};

	model._download = function (id, fileId, res, options, next) {
    model.download(id, fileId, res, next);
	}

};
