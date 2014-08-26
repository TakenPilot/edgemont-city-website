var $ = require('jQuery');
Handlebars = require('handlebars');
var _ = require('lodash');
var Promise = require('bluebird');
var menuUrl = "https://spreadsheets.google.com/feeds/cells/1WxmpQekHmzmA6xisZZL0xgLH6cz845qvopPAL_FSULc/od6/public/values?alt=json-in-script&callback=?";
var detailsUrl = "https://spreadsheets.google.com/feeds/cells/1jZzlOtwprlAD9apCebwWcCPRYztnzX7X3XzjWFuf2Nw/od6/public/values?alt=json-in-script&callback=?";

//get google docs
$(function() {

    function getSpreadsheet(url) {
        var deferred = Promise.defer();
        $.getJSON(url, function(data) {
                var sheet = _.groupBy(_.map(data.feed.entry, function (entry) {
                    return entry.gs$cell;
                }), 'row');
                deferred.resolve(sheet);
                console.log('spreadsheet', sheet);
            }
        );
        return deferred.promise;
    }

    function getMenu() {
        return getSpreadsheet(menuUrl).then(function (menu) {
            var menu = _.mapValues(menu, function (list) {
                return {
                    name: list[0].$t,
                    cost: list[1].$t
                }
            });
            console.log('menu', menu);
            return menu;
        })
    }

    function getDetails() {
        return getSpreadsheet(detailsUrl).then(function (menu) {
            var details = _.reduce(menu, function (obj, list) {
                obj[list[0].$t] = list[1].$t;
                return obj;
            }, {});
            console.log('details', details);
            return details;
        })
    }

    function showMenu() {
        return getMenu().then(function (menu) {
            var template = Templates.menu(menu);
            $('#menu').html(template);
        });
    }

    function showDetails() {
        return getDetails().then(function (details) {
            var template = Templates.details(details);
            $('#details').html(template);
        });
    }

    showMenu();
    showDetails();
});