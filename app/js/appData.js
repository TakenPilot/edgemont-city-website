var $ = require('jquery'),
    _ = require("lodash"),
    Promise = require("bluebird");
_.mixin(require("lodash-deep"));

var AppData = (function ($, _, Promise) {

    var cellProp = 'gs$cell';
    var menuUrl = "https://spreadsheets.google.com/feeds/cells/1WxmpQekHmzmA6xisZZL0xgLH6cz845qvopPAL_FSULc/od6/public/values?alt=json-in-script&callback=?";
    var detailsUrl = "https://spreadsheets.google.com/feeds/cells/1jZzlOtwprlAD9apCebwWcCPRYztnzX7X3XzjWFuf2Nw/od6/public/values?alt=json-in-script&callback=?";

    function groupByRow(entries){
        return _.groupBy(_.filter(_.map(entries, function (entry) {
            return entry[cellProp];
        })), 'row');
    }

    /**
     * @param url
     * @returns {Promise}
     */
    function getSpreadsheet(url) {
        var deferred = Promise.defer();
        $.getJSON(url, function(data) {
            var entries = _.deepGet(data, 'feed.entry');
            deferred.resolve( groupByRow(entries));
        });
        return deferred.promise;
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

    /**
     * @param {string} targetEl
     * @param {string} templateName
     * @returns {Function}
     * @example getMenu().then(showTemplate('#el', 'template'));
     */
    function showTemplate(targetEl, templateName) {
        return function (data) {
            if (Templates[templateName]) {
                $(targetEl).html(Templates[templateName](data));
            }
            return data;
        };
    }

    /**
     *
     * @constructor
     */
    var AppData = function () {

    };
    AppData.prototype = {
        /**
         * @returns {Promise}
         */
        getData: function () {
            return Promise.all([
                getMenu().then(showTemplate('#menu', 'menu')),
                getDetails().then(showTemplate('#details', 'details'))
            ]).catch(function (err) {
                console.error(err);
            });
        }
    };

    return AppData;

})($, _, Promise);

module.exports = AppData;