"use strict";

function getService(serviceName) {
  var injectedService;
  inject([serviceName, function(serviceInstance) {
    injectedService = serviceInstance;
  }]);
  return injectedService;
}

function mockQ() {
  return function($provide) {
    $provide.service("$q", function() {
      return Q;
    });
  };
}

function mocklocalDataStore(){
  return function($provide) {
    $provide.service("localDatastore", function() {
      var svc = {};
      svc.loadLocalData = function(){
        var defer = Q.defer();
        defer.resolve();
        return defer.promise;
      };
      svc.getFiles = function(){
        return [
          {"name":"test1", "tags": [
            {"type": "Lookup", "name": "brand", "values": ["brand1", "brand2"]},
            {"type": "Lookup", "name": "style", "values": ["style1", "style2"]},
            {"type": "Freeform", "name": "testfreeform1", "value": "freeform1"}
          ]},
          {"name":"test2", "tags": [
            {"type": "Lookup", "name": "brand", "values": ["brand1", "brand3"]},
            {"type": "Lookup", "name": "style", "values": ["style4", "style2", "style5"]},
            {"type": "Freeform", "name": "testfreeform1", "value": "freeform2"},
            {"type": "Freeform", "name": "testfreeform2", "value": "freeform3"}
          ]}
        ];
      };

      svc.getTagConfigs = function(){
        return [
          {
            "type": "Lookup",
            "name": "brand",
            "values": ["brand1", "brand2", "brand3"]
          }, {
          "type": "Lookup",
          "name": "style",
          "values": ["style1", "style2", "style3", "style4", "style5"]
        }, {
          "type": "Lookup",
          "name": "size",
          "values": ["s", "m", "l", "xl"]
        }
        ];
      };

      svc.updateTags = function(){};

      return svc;
    });
  };
}

function mockModal() {
  return function($provide) {
    $provide.service("$modal", function() {
      var svc = {};
      svc.open = function() {
        var fakeModal = {
          result: {
            then: function(confirmCallback, cancelCallback) {
              //Store the callbacks for later when the user clicks on the OK or Cancel button of the dialog
              this.confirmCallBack = confirmCallback;
              this.cancelCallback = cancelCallback;
            }
          },
          close: function( item ) {
            //The user clicked OK on the modal dialog, call the stored confirm callback with the selected item
            this.result.confirmCallBack( item );
          },
          dismiss: function( type ) {
            //The user clicked cancel on the modal dialog, call the stored cancel callback
            this.result.cancelCallback( type );
          }
        };
        return fakeModal;
      };
      return svc;
    });
  };
}

function mockLog() {
  return function($provide) {
    $provide.service("$log", function() {
      return {};
    });
  };
}

function mockStateParams() {
  return function($provide) {
    $provide.service("$stateParams", function() {
      return {};
    });
  };
}

describe("Services: TaggingService", function() {
  var mockFiles = [
    {"name":"test1", "tags": [
      {"type": "Lookup", "name": "brand", "values": ["brand1", "brand2"]},
      {"type": "Lookup", "name": "style", "values": ["style1", "style2"]},
      {"type": "Freeform", "name": "testfreeform1", "value": "freeform1"}
    ]},
    {"name":"test2", "tags": [
      {"type": "Lookup", "name": "brand", "values": ["brand1", "brand3"]},
      {"type": "Lookup", "name": "style", "values": ["style4", "style2", "style5"]},
      {"type": "Freeform", "name": "testfreeform1", "value": "freeform2"},
      {"type": "Freeform", "name": "testfreeform2", "value": "freeform3"}
    ]}
  ];

  beforeEach(module("tagging"));
  beforeEach(module(mockModal()));
  beforeEach(module(mockLog()));
  beforeEach(module(mockStateParams()));
  beforeEach(module(mockQ()));
  beforeEach(module(mocklocalDataStore()));


  it("should exist", function () {
    var taggingSvc = getService("TaggingService");
    expect(taggingSvc).be.defined;
  });

  it("should do union on demo files on union command", function () {
    var taggingSvc = getService("TaggingService");
    var refresh = sinon.spy(taggingSvc, "refreshLocalStore");
    taggingSvc.taggingButtonClick(mockFiles, "union");
    expect(refresh.called);
    return taggingSvc.refreshLocalStore().then(function(){
      expect(taggingSvc.tagGroups.lookupTags.length).to.equal(7);
      expect(taggingSvc.tagGroups.freeformTags.length).to.equal(2);
    });
  });

  it("should transform tag config data, available and selected lookupTags", function () {
    var taggingSvc = getService("TaggingService");
    taggingSvc.taggingButtonClick(mockFiles, "union");
    return taggingSvc.refreshLocalStore().then(function() {
      expect(taggingSvc.configTags.lookupTags.length).to.eql(12);
      expect(taggingSvc.tagGroups.lookupTags.length).to.eql(7);
      expect(taggingSvc.available.lookupTags.length).to.eql(5);
    });
  });

  it("should add selected tag to selected lookupTags", function () {
      var taggingSvc = getService("TaggingService");
      taggingSvc.taggingButtonClick(mockFiles, "union");
      return taggingSvc.refreshLocalStore().then(function() {
        var addTag = taggingSvc.available.lookupTags[0];
        taggingSvc.addToSelectedLookupTag(addTag);
        expect(taggingSvc.configTags.lookupTags.length).to.eql(12);
        expect(taggingSvc.tagGroups.lookupTags.length).to.eql(8);
        expect(taggingSvc.available.lookupTags.length).to.eql(4);
      });
  });

  it("should remove selected tag from selected lookupTags", function () {
    var taggingSvc = getService("TaggingService");
    taggingSvc.taggingButtonClick(mockFiles, "union");
    return taggingSvc.refreshLocalStore().then(function() {
      var removeTag = taggingSvc.tagGroups.lookupTags[0];
      taggingSvc.removeFromSelectedLookupTag(removeTag);
      expect(taggingSvc.configTags.lookupTags.length).to.eql(12);
      expect(taggingSvc.tagGroups.lookupTags.length).to.eql(6);
      expect(taggingSvc.available.lookupTags.length).to.eql(6);
    });
  });
});