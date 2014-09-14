var Promise = require('bluebird'),
  _ = require('lodash'),
  rest = require('restler');

_.mixin(require("lodash-deep"));

var googleDocApi = 'https://spreadsheets.google.com/feeds/cells/[key]/od6/public/values?alt=json';
var cellProp = 'gs$cell';

/**
 * @param key
 * @returns {Promise}
 */
function getSpreadsheet(key) {
  var deferred = Promise.defer();
  rest.get(googleDocApi.replace('[key]', key)).on('complete', function (result) {
    if (result instanceof Error) {
      deferred.reject(result);
    }
    else {
      var entries = _.deepGet(result, 'feed.entry');
      deferred.resolve(groupByRow(entries));
    }
  });
  return deferred.promise;
}

function groupByRow(entries){
  return _.groupBy(_.filter(_.map(entries, function (entry) {
    return entry[cellProp];
  })), 'row');
}

/**
 * @returns {Promise}
 */
function getMenu() {
  return getSpreadsheet(menuUrl).then(function (menu) {
    return _.mapValues(menu, function (list) {
      return {
        name: _.deepGet(list, '0.$t'),
        cost: _.deepGet(list, '1.$t')
      };
    });
  });
}

/**
 * @returns {Promise}
 */
function getDetails() {
  return getSpreadsheet(detailsUrl).then(function (details) {
    return _.reduce(details, function (obj, list) {
      var key = _.deepGet(list, '0.$t');
      if (key) {
        obj[key] = _.deepGet(list, '1.$t');
      }
      return obj;
    }, {});
  });
}

var GoogleSpreadsheet = function () {};
GoogleSpreadsheet.prototype = {
  get: function (key, cb) {
    rest.get(googleDocApi.replace('[key]', key)).on('complete', function (result, res) {
      var deferred = Promise.defer();
      if (result instanceof Error) {
        console.error('error', arguments);
        deferred.reject(result);
      }
      else {
        var entries = _.deepGet(result, 'feed.entry');
        deferred.resolve(result);
      }
      return deferred.promise;
    });
  }
};
module.exports = new GoogleSpreadsheet();