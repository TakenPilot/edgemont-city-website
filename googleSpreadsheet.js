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
      entries = _.groupBy(_.pluck(entries, cellProp), 'row');
      deferred.resolve(mapColumnsToHeader(groupByRow(entries)));
    }
  });
  return deferred.promise;
}

function groupByRow(entries){
  var groups = _.reduce(entries, function (list, value, rowIndex) {
    //value is [{}]
    var row = _.reduce(value, function (row, value) {
      //value is {col: string, row: string, $t: string}
      var colIndex = parseInt(value.col, 10);
      if (colIndex != undefined && !isNaN(colIndex)) {
        row[colIndex - 1] = value['$t'];
      }
      return row;
    }, []);
    rowIndex = parseInt(rowIndex, 10);
    if (rowIndex != undefined && !isNaN(rowIndex)) {
      list[rowIndex - 1] = row;
    }
    return list;
  }, []);
  return groups;
}

function mapColumnsToHeader(rows) {


  var headers = rows.shift();

  rows = _.map(rows, function (row) {
    return _.zipObject(headers, row);
  });

  rows = _.map(rows, function (row) {
    return _.pick(row, function (value) {
      return !!value;
    })
  });
  return rows;
}

var GoogleSpreadsheet = function () {};
GoogleSpreadsheet.prototype = {
  getList: function (key) {
    return getSpreadsheet(key)
  },
  getListByProperty: function (key, property) {
    return getSpreadsheet(key).then(function (list) {
      return _.indexBy(list, property);
    });
  },
  removeSuffix: function (obj, suffix) {
    var newObj = _.isArray(obj) ? [] : {};

    _.each(obj, function (value, key) {
      var index = key.indexOf(suffix);
      if (index > -1) {
        var newKey = key.substring(0, index);
        if (newKey) {
          newObj[newKey] = value;
        }
      } else {
        newObj[key] = value;
      }
    });

    return newObj;
  }
};
module.exports = new GoogleSpreadsheet();