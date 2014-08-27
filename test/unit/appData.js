var AppData = require('../../app/js/appData.js'),
    $ = require('jquery'),
    sinon = require('sinon'),
    expect = require('chai').expect;

describe('AppData', function () {
    var data, sandbox;

    beforeEach(function () {
        data = new AppData();
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('Gets data from server', function () {
        sandbox.mock($).expects("ajax").atLeast(1).atMost(2).yieldsTo("success", {});
        data.getData();
        sandbox.verify();
    });

    it('Does not fail on empty data', function (done) {
        sandbox.mock($).expects("ajax").atLeast(1).atMost(2).yieldsTo("success", {});
        data.getData().then(function (result) {
            done();
        });
        sandbox.verify();
    });

    it('Returns correct data', function (done) {
        //called twice, respond with success and data
        sandbox.mock($).expects("ajax").exactly(2).yieldsTo("success", {
            feed: {entry: [
                {gs$cell:{$t:"some name", row:"1", col: "1"}},
                {gs$cell:{$t:"some other cost", row:"1", col: "1"}}]}
        });

        data.getData().then(function (result) {
            //expect data to be transformed to this
            expect(result).to.deep.equal([
                {'1': {name: 'some name', cost: 'some other cost'}},
                {'some name':'some other cost' }
            ]);
            done();
        });
        sandbox.verify();
    });
});