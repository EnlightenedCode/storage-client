"use strict";

function getService(serviceName) {
  var injectedService;
  inject([serviceName, function(serviceInstance) {
    injectedService = serviceInstance;
  }]);
  return injectedService;
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

describe("Services: TaggingService", function() {
  beforeEach(module("tagging"));
  beforeEach(module(mockModal()));
  beforeEach(module(mockLog()));

  it("should exist", function () {
    var taggingSvc = getService("TaggingService");
    expect(taggingSvc).be.defined;
  });

  it("should do union on demo files on union command", function () {
    var taggingSvc = getService("TaggingService");
    var mockFiles = [
      {"name":"test1", "tags": [
        {"type": "Lookup", "name": "testlookup1", "values": ["brand1", "brand2"]},
        {"type": "Lookup", "name": "testlookup2", "values": ["brand1", "brand2"]},
        {"type": "Freeform", "name": "testfreeform1", "value": "freeform1"}
      ]},
      {"name":"test1", "tags": [
        {"type": "Lookup", "name": "testlookup1", "values": ["brand1", "brand3"]},
        {"type": "Lookup", "name": "testlookup2", "values": ["brand4", "brand2", "brand5"]},
        {"type": "Freeform", "name": "testfreeform1", "value": "freeform2"},
        {"type": "Freeform", "name": "testfreeform2", "value": "freeform3"}
      ]}
    ];
    taggingSvc.taggingButtonClick(mockFiles, "union");

    expect(taggingSvc.tagGroups.lookupTags.length).to.equal(7);
    expect(taggingSvc.tagGroups.freeformTags.length).to.equal(2);
  });
});