var Promise = require('bluebird'),
  _ = require('lodash'),
  util = require('util'),
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
  return _.reduce(entries, function (list, value, rowIndex) {
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

function categorize(list, categories) {
  if (categories.length) {
    categories = _.clone(categories);
    var category = categories.shift();
    var grouping =_.groupBy(list, category);
    list = _.mapValues(grouping, function (group) {
      return categorize(group, categories);
    });
  }
  return list;
}

var GoogleSpreadsheet = function () {};
GoogleSpreadsheet.prototype = {
  getList: function (options) {
    return getSpreadsheet(options.key)
      .then(function (list) {
        return categorize(list, options.categories || []);
      })
  },
  getListByProperty: function (options, property) {
    return this.getList(options).then(function (list) {
      return _.indexBy(list, property);
    })
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