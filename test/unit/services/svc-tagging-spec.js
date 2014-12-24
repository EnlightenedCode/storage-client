"use strict";
var sandbox, taggingSvc, $modal, $stateParams, localDatastore;
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
  ]},
  {"name":"test3", "tags": [
    {"type": "Lookup", "name": "size", "values": ["s","m", "l"]}
  ]}
];
var mockLookupSelectedTags = [
  {"name:": "brand", "value": "brand1"},
  {"name:": "brand", "value": "brand2"},
  {"name:": "brand", "value": "brand3"},
  {"name:": "style", "value": "style1"},
  {"name:": "style", "value": "style2"},
  {"name:": "style", "value": "style4"},
  {"name:": "style", "value": "style5"}
];
var mockLookupAvailableTags = [
  {"name:": "size", "value": "s"},
  {"name:": "size", "value": "m"},
  {"name:": "size", "value": "l"},
  {"name:": "size", "value": "xl"},
  {"name:": "style", "value": "style3"}
];

var mockSelectedFiles = [
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

var mockTagConfigs = [
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
  },
  {
    "type": "Freeform",
    "name": "testfreeform1"
  }
];


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
function mockStateParams() {
  return function($provide) {
    $provide.service("$stateParams", function() {
      return {};
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
        return angular.copy(mockFiles);
      };

      svc.getTagConfigs = function(){
        return angular.copy(mockTagConfigs);
      };

      svc.updateTags = function(){};

      return svc;
    });
  };
}

beforeEach(module("tagging"));
beforeEach(module(mockModal()));
beforeEach(module(mockStateParams()));
beforeEach(module(mocklocalDataStore()));

describe("Services: TaggingService2",function() {

  beforeEach(inject(function (TaggingService, _$modal_, _$log_, _$stateParams_, _$q_, _localDatastore_) {
    sandbox = sinon.sandbox.create();

    taggingSvc = TaggingService;
    $modal = _$modal_;
    $stateParams = _$stateParams_;
    localDatastore = _localDatastore_;
  }));

  afterEach(function(){
    sandbox.restore();
  });

  describe("Initialization:", function(){
    it("should exist", function () {
      expect(taggingSvc).be.defined;
    });
  });

  describe("refreshLocalStore:", function(){
    it("when no companyId and LocalData is not loaded it. load localData", function () {
      //stubs, stateParams does not need to be stubbed because it is already undefined.
      sandbox.stub(localDatastore, "getFiles", function(){return;} );
      sandbox.stub(localDatastore, "loadLocalData", function(){return 200;});

      var result = taggingSvc.refreshLocalStore();
      expect(localDatastore.getFiles.callCount).to.equal(1);
      expect(localDatastore.loadLocalData.callCount).to.equal(1);
      expect(result).to.be.equal(200);
    });

    it("when no companyId and localData is already loaded. return fake promise.", function () {
      //stubs, stateParams does not need to be stubbed because it is already undefined.
      sandbox.stub(localDatastore, "getFiles", function(){return { files: "mockFiles"};} );
      sandbox.stub(localDatastore, "loadLocalData", function(){return 200;});

      sandbox.spy(taggingSvc, "refreshLocalStore");
      var result = taggingSvc.refreshLocalStore();
      expect(localDatastore.getFiles.callCount).to.equal(1);
      expect(localDatastore.loadLocalData.callCount).to.equal(0);
      expect(result.hasOwnProperty("then")).to.equal(true);
    });
  });

  describe("taggingButtonClick:", function(){
    it("when given union command... selected files tags are unioned together", function () {
      sandbox.stub(taggingSvc, "refreshLocalStore", function(){
        return Q.resolve();} );
      sandbox.stub(localDatastore, "getFiles", function(){return mockFiles; });

      taggingSvc.taggingButtonClick(angular.copy(mockSelectedFiles), "union");
      expect(taggingSvc.refreshLocalStore.callCount).to.equal(1);
      return taggingSvc.refreshLocalStore().then(function() {
        expect(taggingSvc.tagGroups.lookupTags.length).to.equal(7);
        expect(taggingSvc.tagGroups.freeformTags.length).to.equal(2);
      });
    });

    it("should transform tag config data, available and selected lookupTags", function () {
      sandbox.stub(taggingSvc, "refreshLocalStore", function(){
        return Q.resolve();} );
      sandbox.stub(localDatastore, "getFiles", function(){return mockFiles; });
      taggingSvc.taggingButtonClick(angular.copy(mockSelectedFiles), "union");
      expect(taggingSvc.refreshLocalStore.callCount).to.equal(1);
      return taggingSvc.refreshLocalStore().then(function() {
        expect(taggingSvc.configTags.lookupTags.length).to.eql(12);
        expect(taggingSvc.tagGroups.lookupTags.length).to.eql(7);
        expect(taggingSvc.available.lookupTags.length).to.eql(5);
      });
    });

    it("TaggingButtonClick should call localDatastore with no company ID when saving.", function () {
      sandbox.stub(taggingSvc, "refreshLocalStore", function(){
        return Q.resolve();} );
      sandbox.stub(localDatastore, "updateTags", function(){return 200;});
      sandbox.stub(localDatastore, "getFiles", function(){return mockFiles; });
      taggingSvc.taggingButtonClick(angular.copy(mockSelectedFiles), "union");
      expect(taggingSvc.refreshLocalStore.callCount).to.equal(1);
      return taggingSvc.refreshLocalStore().then(function() {
        taggingSvc.saveChangesToLookupTags();
        expect(localDatastore.updateTags.calledWith([], "Lookup", taggingSvc.tagGroups.lookupTags));
      });
    });
  });



  describe("Add/Remove and Save Lookup Tags:", function(){
    it("AddToSelectedLookupTag should add selected tag to selected lookupTags", function () {
      sandbox.stub(taggingSvc,"available", {lookupTags: angular.copy(mockLookupAvailableTags)});
      sandbox.stub(taggingSvc,"selected", {lookupTags: angular.copy(mockLookupSelectedTags)});
      var addTag = taggingSvc.available.lookupTags[0];
      taggingSvc.addToSelectedLookupTag(addTag);
      expect(taggingSvc.selected.lookupTags.length).to.eql(8);
      expect(taggingSvc.available.lookupTags.length).to.eql(4);
    });

    it("RemoveToSelectedLookupTag should remove selected tag from selected lookupTags", function () {
      sandbox.stub(taggingSvc,"available", {lookupTags: angular.copy(mockLookupAvailableTags)});
      sandbox.stub(taggingSvc,"selected", {lookupTags: angular.copy(mockLookupSelectedTags)});
      var removeTag = taggingSvc.selected.lookupTags[0];
      taggingSvc.removeFromSelectedLookupTag(removeTag);
      expect(taggingSvc.selected.lookupTags.length).to.eql(6);
      expect(taggingSvc.available.lookupTags.length).to.eql(6);
    });

    it("saveChangesToLookupTags should map names of files and call updateTags with no companyId", function () {
      sandbox.stub(taggingSvc,"selected", {lookupTags: angular.copy(mockLookupSelectedTags), files: angular.copy(mockSelectedFiles)});
      sandbox.stub(localDatastore, "updateTags", function(){return 200;});
      taggingSvc.saveChangesToLookupTags();
      expect(localDatastore.updateTags.getCall(0).args[0][0]).to.eql(taggingSvc.selected.files[0].name);
      expect(localDatastore.updateTags.getCall(0).args[0].length).to.eql(2);
      expect(localDatastore.updateTags.getCall(0).args[1]).to.eql("Lookup");
      expect(localDatastore.updateTags.getCall(0).args[2]).to.eql(taggingSvc.selected.lookupTags);
    });

    it("clearAllLookupTags should remove all tags froms selected LookupTags, but does not call save.", function () {
      sandbox.stub(taggingSvc,"available", {lookupTags: angular.copy(mockLookupAvailableTags)});
      sandbox.stub(taggingSvc,"selected", {lookupTags: angular.copy(mockLookupSelectedTags)});
        taggingSvc.clearAllLookupTags();
        expect(taggingSvc.selected.lookupTags.length).to.eql(0);
        expect(taggingSvc.available.lookupTags.length).to.eql(12);
    });

    it("clearAllLookupTagsAndSave should remove all tags froms selected LookupTags, and calls save.", function () {
      taggingSvc.tagGroups = {};
      sandbox.stub(taggingSvc,"tagGroups", {lookupTags: angular.copy(mockLookupSelectedTags)});
      sandbox.stub(taggingSvc,"clearAllLookupTags", function(){ return 200;});
      sandbox.stub(taggingSvc,"saveChangesToLookupTags", function(){ return 200;});
      taggingSvc.clearAllLookupTagsAndSave();
      expect(taggingSvc.clearAllLookupTags.callCount).to.equal(1);
      expect(taggingSvc.tagGroups.lookupTags.length).to.equal(0);
      expect(taggingSvc.saveChangesToLookupTags.callCount).to.equal(1);
    });
  });

  describe("misc functions:", function() {
    it("getFlattenedTagsConfigList should take a tags type Lookup and flatten it.", function () {
      sandbox.stub(localDatastore, "getTagConfigs", function(){ return angular.copy(mockTagConfigs);});
      var result = taggingSvc.getFlattenedTagsConfigList("Lookup");
      expect(localDatastore.getTagConfigs.callCount).to.equal(1);
      expect(result.length).to.equal(12);
      expect(result[0].name).to.equal("brand");
      expect(result[0].value).to.equal("brand1");
    });

    it("getFlattenedTagsConfigList should take a tags type Freeform and flatten it.", function () {
      sandbox.stub(localDatastore, "getTagConfigs", function(){ return angular.copy(mockTagConfigs);});
      var result = taggingSvc.getFlattenedTagsConfigList("Freeform");
      expect(localDatastore.getTagConfigs.callCount).to.equal(1);
      expect(result.length).to.equal(1);
      expect(result[0].name).to.equal("testfreeform1");
    });

    it("refreshLocalStore should refresh getFiles and return fake promise when no company Id.", function () {
      sandbox.stub(localDatastore, "getTagConfigs", function(){ return angular.copy(mockTagConfigs);});
      sandbox.stub(localDatastore, "getFiles", function(){return 200; });
      var result = taggingSvc.refreshLocalStore();
      expect(localDatastore.getFiles.callCount).to.equal(1);
      expect(result.hasOwnProperty("then")).to.equal(true);
    });

    it("refreshSelection should refresh all service variables and union multiple files given union command.", function () {
      sandbox.stub(localDatastore, "getTagConfigs", function(){ return angular.copy(mockTagConfigs);});
      sandbox.stub(localDatastore, "getFiles", function(){return mockFiles; });
      sandbox.stub(taggingSvc,"getFlattenedTagsConfigList", function(type) {
        if(type === "Lookup"){
          return [
            {"name:": "size", "value": "s"},
            {"name:": "style", "value": "style1"},
            {"name:": "style", "value": "style2"},
            {"name:": "style", "value": "style3"},
            {"name:": "style", "value": "style4"},
            {"name:": "style", "value": "style5"},
            {"name:": "brand", "value": "brand1"},
            {"name:": "brand", "value": "brand2"},
            {"name:": "brand", "value": "brand3"}
          ];
        }
        if(type === "Freeform"){
          return [
            {"name:": "testfreeform1"},
            {"name:": "testfreeform2"},
            {"name:": "testfreeform3"}
          ];
        }
        return 200;});

      taggingSvc.refreshSelection(angular.copy(mockSelectedFiles), "union");
      expect(taggingSvc.selected.files.length).to.equal(2);
      expect(taggingSvc.command).to.equal("union");
      expect(taggingSvc.tagGroups.lookupTags.length).to.equal(7);
      expect(taggingSvc.tagGroups.freeformTags.length).to.equal(2);
      expect(taggingSvc.selected.lookupTags.length).to.equal(7);
      expect(taggingSvc.getFlattenedTagsConfigList.callCount).to.equal(2);
      expect(taggingSvc.configTags.lookupTags.length).to.equal(9);
      expect(taggingSvc.configTags.freeformTags.length).to.equal(3);
      expect(taggingSvc.available.lookupTags.length).to.equal(2);
    });
  });
});
