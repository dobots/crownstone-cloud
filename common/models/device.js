// "use strict";

let loopback = require('loopback');
var ObjectID = require('mongodb').ObjectID;
const debug = require('debug')('loopback:dobots');
module.exports = function(model) {

  let app = require('../../server/server');
  if (app.get('acl_enabled')) {
    model.disableRemoteMethodByName('find');

    //***************************
    // GENERAL:
    //   - nothing
    //***************************
    model.settings.acls.push({
      "accessType": "*",
      "principalType": "ROLE",
      "principalId": "$everyone",
      "permission": "DENY"
    });
    //***************************
    // AUTHENTICATED:
    //   - create new device
    //***************************
    model.settings.acls.push({
      "principalType": "ROLE",
      "principalId": "$authenticated",
      "permission": "ALLOW",
      "property": "create"
    });
    //***************************
    // OWNER:
    //   - everything
    //***************************
    model.settings.acls.push({
      "accessType": "*",
      "principalType": "ROLE",
      "principalId": "$owner",
      "permission": "ALLOW"
    });
    //***************************
    // LIB-USER:
    //   - nothing except:
    //   	- findOne
    //***************************
    model.settings.acls.push({
      "accessType": "*",
      "principalType": "ROLE",
      "principalId": "lib-user",
      "permission": "DENY"
    });
  }

  // address has to be unique to a stone
  // model.validatesUniquenessOf('address', {message: 'a device with this address was already added!'});

  model.disableRemoteMethodByName('prototype.__get__currentLocation');
  model.disableRemoteMethodByName('prototype.__get__currentSphere');

  // model.disableRemoteMethodByName('prototype.__get__installations');
  model.disableRemoteMethodByName('prototype.__count__installations');
  model.disableRemoteMethodByName('prototype.__exists__installations');
  model.disableRemoteMethodByName('prototype.__link__installations');
  model.disableRemoteMethodByName('prototype.__unlink__installations');
  // model.disableRemoteMethodByName('prototype.__findById__installations');
  model.disableRemoteMethodByName('prototype.__updateById__installations');
  model.disableRemoteMethodByName('prototype.__unlink__installations');
  // model.disableRemoteMethodByName('prototype.__deleteById__installations');
  // model.disableRemoteMethodByName('prototype.__destroyById__installations');
  model.disableRemoteMethodByName('prototype.__create__installations');
  model.disableRemoteMethodByName('prototype.__delete__installations');


  model.disableRemoteMethodByName('prototype.__exists__fingerprintLinks');
  model.disableRemoteMethodByName('prototype.__link__fingerprintLinks');
  model.disableRemoteMethodByName('prototype.__findById__fingerprintLinks');
  model.disableRemoteMethodByName('prototype.__unlink__fingerprintLinks');
  model.disableRemoteMethodByName('prototype.__updateById__fingerprintLinks');
  model.disableRemoteMethodByName('prototype.__deleteById__fingerprintLinks');
  model.disableRemoteMethodByName('prototype.__destroyById__fingerprintLinks');
  model.disableRemoteMethodByName('prototype.__create__fingerprintLinks');
  model.disableRemoteMethodByName('prototype.__delete__fingerprintLinks');
  model.disableRemoteMethodByName('prototype.__count__fingerprintLinks');
  model.disableRemoteMethodByName('prototype.__get__fingerprintLinks');

  model.disableRemoteMethodByName('createChangeStream');
  model.disableRemoteMethodByName('upsert');
  model.disableRemoteMethodByName('count');
  model.disableRemoteMethodByName('findOne');
  model.disableRemoteMethodByName('updateAll');

  let injectOwner = function(ctx, next) {
    let item;
    if (ctx.isNewInstance) {
      item = ctx.instance;
    } else {
      item = ctx.data;

      if (!item) {
        debug("ctx.data is NULL!!");
        item = ctx.instance;
      }
    }

    if (!item.ownerId) {
      debug("injectOwner");
      // debug("ctx.instance: ", item);

      const token = ctx.options && ctx.options.accessToken;
      const userId = token && token.userId;

      if (!userId) {
        return next(new Error("Not logged in!"));
      }
      item.ownerId = userId;
      next();
    }
    else {
      next();
    }
  };

  model.observe('before save', injectOwner);

  /************************************
   **** Location
   ************************************/

  model.setCurrentLocation = function(device, locationId, next) {
    if ((device.currentLocationId === locationId) ||
      (String(device.currentLocationId) === String(locationId))) {
      debug("location == current location, nothing to do!");
      return next();
    }

    let Location = loopback.getModel('Location');
    Location.findById(locationId, function(err, location) {
      if (err) return next(err);
      if (Location.checkForNullError(location, next, "id: " + locationId)) return;

      device.currentLocationId = locationId;
      device.save(function(err, deviceInstance) {
        next(err);
      })

    });
  };

  model.clearCurrentLocation = function(device, next) {
    debug("clearing current location");
    device.currentLocationId = null;

    device.save(function(err, deviceInstance) {
      if (next) {
        if (err) return next(err);
        next();
      }
    })

  };

  model.remoteSetCurrentLocation = function(locationId, deviceId, next) {
    model.findById(deviceId, function(err, device) {
      if (err) return next(err);
      if (model.checkForNullError(device, next, "id: " + deviceId)) return;

      if (locationId) {
        model.setCurrentLocation(device, locationId, next);
      } else {
        model.clearCurrentLocation(device, next);
      }
    })
  };

  model.remoteMethod(
    'remoteSetCurrentLocation',
    {
      http: {path: '/:id/currentLocation/:fk', verb: 'PUT'},
      accepts: [
        {arg: 'fk', type: 'any', 'http': {source: 'path'}},
        {arg: 'id', type: 'any', required: true, 'http': {source: 'path'}}
      ],
      description: "Set the current location of the device"
    }
  );

  model.setCurrentSphere = function(device, sphereId, next) {
    if ((device.currentSphereId === sphereId) ||
      (String(device.currentSphereId) === String(sphereId))) {
      debug("location == current location, nothing to do!");
      return next();
    }

    let Sphere = loopback.getModel('Sphere');
    Sphere.findById(sphereId, function(err, sphere) {
      if (err) return next(err);
      if (Sphere.checkForNullError(sphere, next, "id: " + sphereId)) return;

      device.currentSphereId = sphereId;
      device.save(function(err, deviceInstance) {
        next(err);
      })
    });
  };

  model.clearCurrentSphere = function(device, next) {
    debug("clearing current sphere");
    device.currentSphereId = null;

    device.save(function(err, deviceInstance) {
      if (next) {
        if (err) return next(err);
        next();
      }
    })

  };

  model.remoteSetCurrentSphere = function(sphereId, deviceId, next) {
    model.findById(deviceId, function(err, device) {
      if (err) return next(err);
      if (model.checkForNullError(device, next, "id: " + deviceId)) return;

      if (sphereId) {
        model.setCurrentSphere(device, sphereId, next);
      } else {
        model.clearCurrentSphere(device, next);
      }
    })
  };

  model.remoteMethod(
    'remoteSetCurrentSphere',
    {
      http: {path: '/:id/currentSphere/:fk', verb: 'PUT'},
      accepts: [
        {arg: 'fk', type: 'any', 'http': {source: 'path'}},
        {arg: 'id', type: 'any', required: true, 'http': {source: 'path'}}
      ],
      description: "Set the current Sphere of the device"
    }
  );


  model.createInstallation = function(data, id, appName, options, callback) {
    // look for appName in the App model.
    const appModel = loopback.getModel('App');
    appModel.findOne({where : {name: appName}})
      .then((App) => {
    		if (App === null || App && App.id === undefined) {
    			throw "No Application is registered by that name.";
				}

				data.appName = appName;
				data.appId = App.id;
        return model.findById(id)
      })
      .then((currentDevice) => {
        if (currentDevice) {
          return currentDevice.installations.create(data);
        }
        else {
          throw "No device selected."
        }
      })
			.then((result) => {
        // console.log("Created Installation", result);
        callback(null, result);
			})
			.catch((err) => {
    		// console.log("ERR createInstallation", err);
        callback(err);
			});
  };

  model.remoteMethod(
    'createInstallation',
    {
      http: {path: '/:id/installations', verb: 'post'},
      accepts: [
        {arg: 'data', type: 'AppInstallation', required: true, http: { source : 'body' }},
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'appName', type: 'string', required: true, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'data', type: 'AppInstallation', root:true},
      description: "Creates a new instance in installation of this model."
    }
  );

  model.updateFingerprint = function(deviceId, fingerprintId, fingerprintData, options, callback) {
    const fingerprintModel = loopback.getModel('Fingerprint');

    fingerprintModel.findById(fingerprintId)
      .then((fingerprint) => {
        if (!fingerprint) {
          // the expected fingerprint does not exist (anymore)
          throw "Fingerprint with this ID does not exist."
        }
        else {
          let locationId = fingerprint.locationId;
          model.createFingerprint(deviceId, locationId, fingerprintData, options, callback);
        }
      })
      .catch((err) => {
        callback(err);
      })
  };

  model.createFingerprint = function(deviceId, locationId, fingerprintData, options, callback) {
    // look for appName in the App model.
    const userId = options.accessToken.userId;

    const fingerprintLinkerModel = loopback.getModel('FingerprintLinker');
    const fingerprintModel = loopback.getModel('Fingerprint');
    const locationModel = loopback.getModel('Location');
    let myLocation = null;
    let myDevice = null;
    let linkedFingerprintEntry = null;
    let newFingerprint = null;

    let createNewFingerprint = function(locationId, sphereId) {
      return fingerprintModel.create({
        phoneType: myDevice.deviceType,
        data: fingerprintData,
        isTransformed: false,
        ownerId: userId,
        locationId: locationId,
        sphereId: sphereId,
      })
    };

    let createAndUpdateLinkerEntry = function(linkedEntry, locationId, sphereId) {
      return createNewFingerprint(locationId, sphereId)
        .then((fingerprintResult) => {
          newFingerprint = fingerprintResult;
          // fingerprint created. Create an entry in the linked list.
          linkedEntry.fingerprintId = fingerprintResult.id;
          return linkedEntry.save()
        })
    };

    locationModel.findById(locationId)
      .then((location) => {
        if (!location) { throw "Unknown location" }
        myLocation = location;
        return model.findById(deviceId)
      })
      .then((device) => {
        if (!device) { throw "Unknown device" }
        myDevice = device;
        return fingerprintLinkerModel.findOne({where : {and: [{deviceId: deviceId}, {locationId: locationId}]}})
      })
      .then((result) => {
        if (result === null) {
          // Create new fingerprint instance
          return createNewFingerprint(myLocation.id, myLocation.sphereId)
            .then((fingerprintResult) => {
              // fingerprint created. Create an entry in the linked list.
              newFingerprint = fingerprintResult;
              return fingerprintLinkerModel.create({
                locationId: myLocation.id,
                sphereId: myLocation.sphereId,
                deviceId: deviceId,
                fingerprintId: fingerprintResult.id
              })
            })
            .then(() => {
              return newFingerprint
            })
        }
        else {
          linkedFingerprintEntry = result;
          return fingerprintModel.findById(result.fingerprintId)
            .then((fingerprint) => {
              if (!fingerprint) {
                // the expected fingerprint does not exist (anymore)
                return createAndUpdateLinkerEntry(linkedFingerprintEntry, myLocation.id, myLocation.sphereId);
              }
              else {
                if (String(fingerprint.ownerId) == String(userId)) {
                  newFingerprint = fingerprint;
                  // this is my fingerprint. Update it.
                  fingerprint.data = fingerprintData;
                  newFingerprint = fingerprint;
                  return fingerprint.save()
                }
                else {
                  // create new fingerprint entry and link to that.
                  return createAndUpdateLinkerEntry(linkedFingerprintEntry, myLocation.id, myLocation.sphereId);
                }
              }
            })
        }
      })
      .then((result) => {
        // console.log("Created Fingerprint", newFingerprint);
        callback(null, result);
      })
      .catch((err) => {
        // console.log("ERR createFingerprint", err);
        callback(err);
      });
  };


  model.getFingerprintsInLocations = function(deviceId, locationIds, options, callback) {
    if (!Array.isArray(locationIds) || locationIds.length == 0) {
      return callback("Invalid input for locationIds");
    }

    _getFingerprints({where : {and: [{deviceId: deviceId}, {locationId: {inq: locationIds}}]}, fields:{fingerprintId:true}}, callback);
  };


 let _getFingerprints = function(filterquery, callback) {
   const fingerprintLinkerModel = loopback.getModel('FingerprintLinker');
   const fingerprintModel = loopback.getModel('Fingerprint');

   fingerprintLinkerModel.find()
     .then((result) => {
       let idArray = [];
       for (let i = 0; i < result.length; i++) {
         idArray.push(result[i].fingerprintId);
       }
       if (idArray.length > 0) {
         return fingerprintModel.find({where: {id: {inq: idArray}}})
           .then((fingerprints) => { return fingerprints; })
       }
       return [];
     })
     .then((result) => {
       // console.log("Created Fingerprint", newFingerprint);
       callback(null, result);
     })
     .catch((err) => {
       // console.log("ERR createFingerprint", err);
       callback(err);
     });
 }

  let _getMatchingFingerprint = function(deviceType, locationId, userId) {
    // NO results yet. Search for one from a matching phone model that we made ourselves.
    return fingerprintModel.findOne({where : {and: [{phoneType: deviceType}, {locationId: locationId}, {ownerId: userId}]}})
      .then((fingerprint) => {
        if (!fingerprint) {
          // if we can't find an fingerprint that we made ourselves, we try those from others
          return fingerprintModel.findOne({where : {and: [{phoneType: deviceType}, {locationId: locationId}]}})
            .then((fingerprint) => {
              if (!fingerprint) {
                return null;
              }
              else {
                return fingerprint;
              }
            })
        }
        else {
          return fingerprint;
        }
      })
  };


  model.getMatchingFingerprintsInLocations = function(deviceId, locationIds, options, callback) {
    if (!Array.isArray(locationIds) || locationIds.length == 0) {
      return callback("Invalid input for locationIds");
    }

    const userId = options.accessToken.userId;

    // look for appName in the App model.
    const fingerprintLinkerModel = loopback.getModel('FingerprintLinker');
    const fingerprintModel = loopback.getModel('Fingerprint');
    let myDevice = null;

    let locationIdMap = {};
    for (let i = 0; i < locationIds.length; i++) {
      locationIdMap[locationIds[i]] = true;
    }

    let resultingFingerPrints = []

    let processLinkerEntry = function(deviceType, linkerEntry) {
      // we have a linker entry, get the fingerprint that corresponds to it.
      return fingerprintModel.findById(linkerEntry.fingerprintId)
        .then((fingerprint) => {
          if (!fingerprint) {
            // this appearently is an orphaned linker entry, search for a fingerprint we can use and clean up the orphaned linker entry.
            return _getMatchingFingerprint(deviceType, linkerEntry.locationId, userId)
              .then((result) => {
                if (result !== null) {
                  resultingFingerPrints.push(result);
                }
                // delete orphaned linker entry
                return fingerprintLinkerModel.destroyById(linkerEntry.id);
              })
          }
          else {
            resultingFingerPrints.push(fingerprint);
          }
        })
    }

    // check if we already have linker entries for the provided ids
    model.findById(deviceId)
      .then((device) => {
        if (!device) { throw "Unknown device" }
        myDevice = device;
        return fingerprintLinkerModel.find({where : {and: [{deviceId: deviceId}, {locationId: {inq: locationIds}}]}})
      })
      .then((linkerEntries) => {
        // all the linker entries that we already have will be checked and cleaned if they are orphaned.
        let promises = [];
        for (let i = 0; i < linkerEntries.length; i++) {
          delete locationIdMap[linkerEntries[i].locationId];
          // TODO: optimize this to use a single find call
          promises.push(processLinkerEntry(myDevice.deviceType, linkerEntries[i]));
        }

        // the locations not covered by the linked entries will be given their best estimate.
        // THIS METHOD WILL NOT STORE OR COPY THESE FINGERPRINTS IN THE DATABASE.
        let leftoverLocationIds = Object.keys(locationIdMap);
        for (let i = 0; i < leftoverLocationIds.length; i++) {
          promises.push(
            new Promise((resolve, reject) => {
              _getMatchingFingerprint(myDevice.deviceType, leftoverLocationIds[i], userId)
                .then((fingerprint) => {
                  resultingFingerPrints.push(fingerprint);
                  resolve();
                })
                .catch((err) => {
                  reject(err)
                })
            })
          )
        }

        return Promise.all(promises);
      })
      .then(() => {
        // console.log("Got matchingFingerprint", matchingFingerprint);
        callback(null, resultingFingerPrints);
      })
      .catch((err) => {
        // console.log("Error while getting matchingFingerprint", err);
        callback(err);
      });
  };

  model.deleteFingerprint = function(deviceId, locationId, options, callback) {
    // look for appName in the App model.
    const fingerprintLinkerModel = loopback.getModel('FingerprintLinker');
    const fingerprintModel = loopback.getModel('Fingerprint');

    fingerprintLinkerModel.findOne({where : {and: [{deviceId: deviceId}, {locationId: locationId}]}})
      .then((linkerEntry) => {
        if (linkerEntry === null) {
          // DONE
          return;
        }
        else {
          return fingerprintModel.findById(linkerEntry.fingerprintId)
            .then((fingerprint) => {
              if (!fingerprint) {
                // There is no fingerprint, delete the linked entry.
                return fingerprintLinkerModel.destroyById(linkerEntry.id);
              }
              else {
                // Delete the linked entry, then check if the fingerprint is still being used by someone. If it is not, then we
                // delete the fingerprint.
                return fingerprintLinkerModel.destroyById(linkerEntry.id)
                  .then(() => {
                    return fingerprintLinkerModel.find({where: {fingerprintId: linkerEntry.fingerprintId}})
                  })
                  .then((linksUsingFingerprint) => {
                    if (linksUsingFingerprint.length === 0) {
                      return fingerprintModel.destroyById(linkerEntry.fingerprintId)
                    }
                  })
              }
            })
        }
      })
      .then(() => {
        // console.log("Created Fingerprint", result);
        callback(null);
      })
      .catch((err) => {
        // console.log("ERR createFingerprint", err);
        callback(err);
      });
  };


  model.linkFingerprints = function(deviceId, fingerprintIds, options, callback) {
    if (!Array.isArray(fingerprintIds) || fingerprintIds.length == 0) {
      return callback("Invalid input for fingerprintIds");
    }

    const fingerprintLinkerModel = loopback.getModel('FingerprintLinker');
    const fingerprintModel = loopback.getModel('Fingerprint');

    fingerprintModel.find({where:{id:{inq:fingerprintIds}}, fields: ['locationId', 'sphereId', 'id']})
      .then((fingerprints) => {
        let promises = [];
        if (fingerprints.length == 0) { throw "No fingerprints found."; }

        for (let i = 0; i < fingerprints.length; i++) {
          let fingerprint = fingerprints[i];
          promises.push(
            // check if there already is a link between this device and this fingerprint.
            fingerprintLinkerModel.find({where: {and: [{deviceId: deviceId}, {fingerprintId: fingerprint.id}]}})
              .then((existingLinkEntries) => {
                if (existingLinkEntries.length === 0) {
                  // if there is no link, make one.
                  return fingerprintLinkerModel.create({
                    locationId: fingerprint.locationId,
                    sphereId: fingerprint.sphereId,
                    deviceId: deviceId,
                    fingerprintId: fingerprint.id,
                  })
                }
              })
          )
        }

        return Promise.all(promises);
      })
      .then(() => {
        callback(null);
      })
      .catch((err) => { callback(err); })
  }

  model.getUpdateTimeForFingerprints = function(deviceId, fingerprintIds, options, callback) {
    if (!Array.isArray(fingerprintIds) || fingerprintIds.length == 0) {
      return callback("Invalid input for fingerprintIds");
    }

    const fingerprintModel = loopback.getModel('Fingerprint');

    fingerprintModel.find({where:{id:{inq:fingerprintIds}}, fields: ['id','updatedAt']})
      .then((fingerprints) => {
        callback(null, fingerprints);
      })
      .catch((err) => { callback(err); })
  }


  model.remoteMethod(
    'createFingerprint',
    {
      http: {path: '/:id/fingerprint', verb: 'post'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'locationId', type: 'string', required: true, http: { source : 'query' }},
        {arg: 'data', type: 'Object', required: true, http: { source : 'body' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'data', type: 'Fingerprint', root:true},
      description: "Creates a fingerprint from this model."
    }
  );


  model.remoteMethod(
    'updateFingerprint',
    {
      http: {path: '/:id/fingerprint', verb: 'put'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'fingerprintId', type: 'string', required: true, http: { source : 'query' }},
        {arg: 'data', type: 'Object', required: true, http: { source : 'body' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'data', type: 'Fingerprint', root:true},
      description: "Update an fingerprint's data. The locationId it is referencing will not change."
    }
  );

  model.remoteMethod(
    'getFingerprintsInLocations',
    {
      http: {path: '/:id/fingerprints', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'locationIds', type: ['string'], required: true, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'data', type: ['Fingerprint'], root:true},
      description: "Get all fingerprints in the sphere that can be used with this device."
    }
  );

  model.remoteMethod(
    'getUpdateTimeForFingerprints',
    {
      http: {path: '/:id/fingerprintsUpdatedAt', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'fingerprintIds', type: ['string'], required: true, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'data', type: ['Fingerprint'], root:true},
      description: "Get the updatedAt time for the fingerprints with the provided ids."
    }
  );


  model.remoteMethod(
    'getMatchingFingerprintsInLocations',
    {
      http: {path: '/:id/fingerprintsMatching', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'locationIds', type: ['string'], required: true, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'data', type: ['Fingerprint'], root:true},
      description: "Get fingerprints for an array of locations that this device can use, if there are any."
    }
  );

  model.remoteMethod(
    'linkFingerprints',
    {
      http: {path: '/:id/fingerprintsLink', verb: 'post'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'fingerprintIds', type: ['string'], required: true, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: "Link fingerprints with the provided fingerprint ids to this device."
    }
  );

  model.remoteMethod(
    'deleteFingerprint',
    {
      http: {path: '/:id/fingerprint', verb: 'delete'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'locationId', type: 'string', required: true, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: "Delete a fingerprint from this model."
    }
  );

};
