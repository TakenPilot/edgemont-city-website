var $ = require('jquery');
Handlebars = require('handlebars'); //global for templates
var AppData = require('./appData');
var _ = require("lodash");
_.mixin(require("lodash-deep"));

$(function() {
    var appData = new AppData();
    appData.getData();
});