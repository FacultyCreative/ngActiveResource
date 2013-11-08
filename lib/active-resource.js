'use strict';

var _                     = require('lodash');
var base                  = require('./base/base');
var collection            = require('./collection/collection');

var ActiveResource        = {};
ActiveResource.Base       = base;
ActiveResource.Collection = collection;

module.exports            = ActiveResource;
