# Crownstone REST API

The crownstone rest api is running on heroku and is available at https://cloud.crownstone.rocks. The base url for the rest api is https://cloud.crownstone.rocks/api. The endpoints are then appended to the base url. E.g. `POST /users/login` becomes `POST https://cloud.crownstone.rocks/api/users/login`

An overview of the available endpoints can be found at https://cloud.crownstone.rocks/explorer. The endpoints describe the parameters as well as the responses.

## Documentation

You can find a documentation of the different models and how to use them [here](https://github.com/crownstone/crownstone-sdk/blob/master/REST_API.md)

## Running it locally

For Debug purposes, the rest api can be run locally. It can still connect to the database where the data is stored, but for that to work a file datasources.local.js is needed with the access paths to the database. Without that file, it will use local memory to store the data.

After cloning the repo, call

	yarn

to install all node dependencies.

Once that completes, the api can be started with

	npm start

in which case it starts the debug version where all endpoints are open. To get the same production version, use

	NODE_ENV=prod node.
