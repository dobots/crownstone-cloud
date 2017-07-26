"use strict";
const fs = require("fs");
const { ask, promiseBatchPerformer } = require("./insertUtil");

let CHANGE_DATA = true;
let DELETE_TIMESERIES = false;

function performDatabaseOperations(app) {
  console.log("Starting Database Operations run");

  let userModel = app.dataSources.mongoDs.getModel('user');
  let sphereModel = app.dataSources.mongoDs.getModel('Sphere');
  let locationModel = app.dataSources.mongoDs.getModel('Location');
  let stoneModel = app.dataSources.mongoDs.getModel('Stone');
  let devicesModel = app.dataSources.mongoDs.getModel('Device');
  let installationModel = app.dataSources.mongoDs.getModel('AppInstallation');
  let appliancesModel = app.dataSources.mongoDs.getModel('Appliance');
  let powerUsageModel = app.dataSources.mongoDs.getModel('PowerUsage');
  let energyUsageModel = app.dataSources.mongoDs.getModel('EnergyUsage');

  powerUsageModel.definition.settings.hidden = [];
  energyUsageModel.definition.settings.hidden = [];

  let allPowerUsages = [];
  let allEnergyUsages = [];

  let backedUpPowerUsage = false;
  let backedUpEnergyUsage = false;

  console.log("Getting Power usage...");
  new Promise((resolve, reject) => resolve())
    .then(() => {
      return powerUsageModel.find();
    })
    .then((results) => {
      console.log("Got data from powerUsageModel: ", results.length, "hits");
      allPowerUsages = results;
      if (allPowerUsages.length > 0 && !JSON.parse(JSON.stringify(allPowerUsages[0])).stoneId) {
        console.warn("Power usage does not show stoneId");
      }
      else if (allPowerUsages.length > 0) {
        console.log("Writing backup for power usage to disk.");
        let path = './backup/powerUsage_backup_' + new Date().getFullYear() + '-' + (new Date().getMonth()+1) + '-' +  new Date().getDate() + '.json';
        if (fs.existsSync(path) === false) {
          fs.writeFileSync(path, JSON.stringify(allPowerUsages, undefined, 2));
          backedUpPowerUsage = true;
          console.log("Writing backup for power usage to disk. DONE.");
        }
        else {
          return new Promise((resolve, reject) => { reject("File " + path + " already exists! Aborting...")});
        }
      }
    })
    .then(() => {
      if (CHANGE_DATA) {
        if (DELETE_TIMESERIES && backedUpPowerUsage) {
          return new Promise((resolve, reject) => {
            ask("Database Operations: power usage has been backup-ed. Delete power usage data in the database. Continue? (YES/NO)")
              .then((answer) => {
                if (answer === 'YES') {
                  // return powerUsageModel.destroyAll();
                }
                else {
                  return new Promise((resolve, reject) => { reject("User permission denied for deleting power usage data during Database operations. Restart script and type YES to continue.") });
                }
              })
          })
        }
        else if (DELETE_TIMESERIES) {
          return new Promise((resolve, reject) => {
            reject("Could not create backups of power usage. Data will not be removed from server. Aborting...")
          });
        }
      }
    })
    .then(() => {
      console.log("Getting Energy usage...");
      return energyUsageModel.find()
        .then((results) => {
          console.log("Got data from energyUsageModel: ", results.length, "hits");
          let allEnergyUsages = results;

          if (allEnergyUsages.length > 0 && !JSON.parse(JSON.stringify(allEnergyUsages[0])).stoneId) {
            console.warn("Energy usage does not show stoneId");
          }
          else if (allEnergyUsages.length > 0) {
            console.log("Writing backup for energy usage to disk.");
            let path = './backup/energyUsage_backup_' + new Date().getFullYear() + '-' + (new Date().getMonth()+1) + '-' +  new Date().getDate() + '.json';
            if (fs.existsSync(path) === false) {
              fs.writeFileSync(path, JSON.stringify(allEnergyUsages, undefined, 2));
              backedUpEnergyUsage = true;
              console.log("Writing backup for energy usage to disk. DONE.");
            }
            else {
              return new Promise((resolve, reject) => { reject("File " + path + " already exists! Aborting...")});
            }
          }
        })
    })
    .then(() => {
      if (CHANGE_DATA) {
        if (DELETE_TIMESERIES && backedUpEnergyUsage) {
          return new Promise((resolve, reject) => {
            ask("Database Operations: energy usage has been backup-ed. Delete energy usage data in the database. Continue? (YES/NO)")
              .then((answer) => {
                if (answer === 'YES') {
                  // return energyUsageModel.destroyAll();
                }
                else {
                  return new Promise((resolve, reject) => {
                    reject("User permission denied for deleting energy usage data during Database operations. Restart script and type YES to continue.")
                  });
                }
              })
          })
        }
        else if (DELETE_TIMESERIES) {
          return new Promise((resolve, reject) => {
            reject("Could not create backups of energy usage. Data will not be removed from server. Aborting...")
          });
        }
      }
    })
    .then(() => {
      console.log("performDatabaseOperations, DONE");
      if (backedUpPowerUsage && backedUpEnergyUsage) {
        console.log("All energy and power data has been backup-ed.");
        if (DELETE_TIMESERIES && CHANGE_DATA) {
          console.log("Energy and Power data have been removed from the cloud server.");
        }
      }
    })
    .catch((err) => {
      console.log("Error during performDatabaseOperations:", err);
    })

}


module.exports = performDatabaseOperations;
