"use strict";
var sandbox, taggingSvc, $modal, $stateParams, localDatastore;
var mockFiles = [
  {"name":"test1", "tags": [
    {"type": "LOOKUP", "name": "brand", "values": ["brand1", "brand2"]},
    {"type": "LOOKUP", "name": "style", "values": ["style1", "style2"]},
    {"type": "FREEFORM", "name": "testfreeform1", "values": ["freeform1"]}
  ]},
  {"name":"test2", "tags": [
    {"type": "LOOKUP", "name": "brand", "values": ["brand1", "brand3"]},
    {"type": "LOOKUP", "name": "style", "values": ["style4", "style2", "style5"]},
    {"type": "FREEFORM", "name": "testfreeform1", "values": ["freeform2"]},
    {"type": "FREEFORM", "name": "testfreeform2", "values": ["freeform3"]}
  ]},
  {"name":"test3", "tags": [
    {"type": "LOOKUP", "name": "size", "values": ["s","m", "l"]}
  ]}
];
var mockLookupSelectedTags = [
  {"name": "brand", "value": "brand1"},
  {"name": "brand", "value": "brand2"},
  {"name": "brand", "value": "brand3"},
  {"name": "style", "value": "style1"},
  {"name": "style", "value": "style2"},
  {"name": "style", "value": "style4"},
  {"name": "style", "value": "style5"}
];

var mockLookupAvailableTags = [
  {"name": "size", "value": "s"},
  {"name": "size", "value": "m"},
  {"name": "size", "value": "l"},
  {"name": "size", "value": "xl"},
  {"name": "style", "value": "style3"}
];

var mockFreeformSelectedTags = [
  {"name": "testfreeform1"},
  {"name": "testfreeform2"},
  {"name": "testfreeform3"}
];

var mockFreeformSelectedTagsWithValues =
  [
    {"name": "testfreeform1", "value": "something"},
    {"name": "testfreeform2", "value": "something"},
    {"name": "testfreeform3", "value": "somethingelse"}
  ];
var mockTimelineObjectToSave =
    {
      type: "TIMELINE",
      timeDefined: true,
      startDate: "11/26/14 12:00 AM",
      endDate: "11/29/14 12:00 AM",
      startTime: "12:00 AM",
      endTime: "11:00 PM",
      duration: 45,
      pud: false,
      trash: false,
      carryon: false,
      recurrenceOptions: {
        recurrenceType: "Daily",
        recurrenceFrequency: 1,
        recurrenceAbsolute: true,
        recurrenceDayOfWeek: 0,
        recurrenceDayOfMonth: 0,
        recurrenceWeekOfMonth: 0,
        recurrenceMonthOfYear: 0,
        recurrenceDaysOfWeek: 0
      }
    };


var mockFreeformSelectedTagsWithValuesMissing =
  [
    {"name": "testfreeform1", "value": "something"},
    {"name": "testfreeform2", "value": "something"},
    {"name": "testfreeform3", "value": ""}
];

var mockSelectedFiles = [
  {"name":"test1", "tags": [
    {"type": "LOOKUP", "name": "brand", "values": ["brand1", "brand2"]},
    {"type": "LOOKUP", "name": "style", "values": ["style1", "style2"]},
    {"type": "FREEFORM", "name": "testfreeform1", "values": ["freeform1"]}
  ]},
  {"name":"test2", "tags": [
    {"type": "LOOKUP", "name": "brand", "values": ["brand1", "brand3"]},
    {"type": "LOOKUP", "name": "style", "values": ["style4", "style2", "style5"]},
    {"type": "FREEFORM", "name": "testfreeform1", "values": ["freeform2"]},
    {"type": "FREEFORM", "name": "testfreeform2", "values": ["freeform3"]}
  ]}
];

var mockTagConfigs = [
  {
    "type": "LOOKUP",
    "name": "brand",
    "values": ["brand1", "brand2", "brand3"]
  }, {
    "type": "LOOKUP",
    "name": "style",
    "values": ["style1", "style2", "style3", "style4", "style5"]
  }, {
    "type": "LOOKUP",
    "name": "size",
    "values": ["s", "m", "l", "xl"]
  },
  {
    "type": "FREEFORM",
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
      svc.getFilesWithTags = function(){
        return angular.copy(mockFiles);
      };

      svc.getTagConfigs = function(){
        return angular.copy(mockTagConfigs);
      };

      svc.updateTags = function(){};

      svc.updateTimelineTag = function(){
        return 200;
      };

      svc.availableNameValuePairs= function(){
        return 200;
      };

      return svc;
    });
  };
}


beforeEach(module("tagging"));
beforeEach(module("gapi-file"));
beforeEach(module(mockModal()));
beforeEach(module(mockStateParams()));
beforeEach(module(mocklocalDataStore()));

describe("Services: TaggingService2",function() {

  beforeEach(inject(function (_TaggingService_, _$modal_, _$log_, _$stateParams_, _$q_, _localDatastore_) {
    sandbox = sinon.sandbox.create();

    taggingSvc = _TaggingService_;
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
    it("load localData", function () {
      //stubs, stateParams does not need to be stubbed because it is already undefined.
      $stateParams.companyId = function(){ return;};
      sandbox.stub($stateParams, "companyId", function(){return "ac57def2-834e-4ecd-8b91-44ca14524fd0";} );
      sandbox.stub(localDatastore, "getFilesWithTags", function(){return;} );
      sandbox.stub(localDatastore, "loadLocalData", function(){return 200;});

      var result = taggingSvc.refreshLocalStore();
      expect(localDatastore.loadLocalData.callCount).to.equal(1);
      expect(result).to.be.equal(200);
    });

  });

  describe("taggingButtonClick:", function(){
    it("when given union command...refreshSelection is called once ", function () {
      $stateParams.companyId = function(){ return;};
      sandbox.stub($stateParams, "companyId", function(){return "ac57def2-834e-4ecd-8b91-44ca14524fd0";} );

      sandbox.stub(taggingSvc, "refreshSelection", function(){
        return 200;} );
      taggingSvc.taggingButtonClick(angular.copy(mockSelectedFiles), "union");
      expect(taggingSvc.refreshSelection.callCount).to.equal(1);
    });

    it("refreshSelection unions given selections correctly given union command", function () {
      sandbox.stub(taggingSvc, "refreshLocalStore", function(){
        return Q.resolve();} );
      sandbox.stub(localDatastore, "getFilesWithTags", function(){return angular.copy(mockFiles); });
      sandbox.stub(localDatastore, "availableNameValuePairs", function() { return [
        "brandbrand1", "brandbrand2", "stylestyle1", "stylestyle2",
        "brandbrand3", "stylestyle4", "stylestyle5", "sizes", "sizem", "sizel"
        ];
      });
      taggingSvc.refreshSelection(angular.copy(mockSelectedFiles), "union");
      expect(localDatastore.getFilesWithTags.callCount).to.equal(1);
      expect(taggingSvc.tagGroups.lookupTags.length).to.equal(7);
      expect(taggingSvc.tagGroups.freeformTags.length).to.equal(2);
    });

  });

  describe("Filter tags:", function(){
      it("filterFile lookupTags should return true correctly for lookup Tag filter", function () {
      sandbox.stub(taggingSvc,"filteredTags", angular.copy(mockLookupSelectedTags).slice(0,1));
      var testFile = angular.copy(mockFiles).slice(0,1)[0];
      var result = taggingSvc.filterFile(testFile);
      expect(result).to.equal(true);
    });
    it("filterFile lookupTags should return true. Logical OR on same tag names, different values", function () {
      sandbox.stub(taggingSvc,"filteredTags", angular.copy(mockLookupSelectedTags).slice(0,2));
      var testFile = angular.copy(mockFiles).slice(0,1)[0];
      var result = taggingSvc.filterFile(testFile);
      expect(result).to.equal(true);
    });
    it("filterFile lookupTags should return true. Logical AND on different tag names", function () {
      sandbox.stub(taggingSvc,"filteredTags", angular.copy(mockLookupSelectedTags).slice(0,4));
      var testFile = angular.copy(mockFiles).slice(0,1)[0];
      var result = taggingSvc.filterFile(testFile);
      expect(result).to.equal(true);
    });
    it("filterFile lookupTags should return false. Logical AND on different tag names dont match", function () {
      sandbox.stub(taggingSvc,"filteredTags", angular.copy(mockLookupSelectedTags).slice(0,4));
      var testFile = angular.copy(mockFiles).slice(2,3)[0];
      testFile.tags.push({"type": "LOOKUP", "name": "brand", "values": ["brand1"]});
      var result = taggingSvc.filterFile(testFile);
      expect(result).to.equal(false);
    });
    it("filterFile undefined filteredTags, startDate, and EndDate returns true", function () {
      var testFile = angular.copy(mockFiles).slice(0,1)[0];
      var result = taggingSvc.filterFile(testFile);
      expect(result).to.equal(true);
    });
    it("filterFile startDate with an undefined filteredTags & endDate works properly", function () {
      sandbox.stub(taggingSvc,"filterStartDate", new Date(2014, 10, 26,0,0,0,0));
      var testFile =
      {"name":"test3", "tags": [
        {"type": "TIMELINE", values: [
          JSON.stringify({"startDate": "11/26/14 12:00 AM"})
        ]}
      ]
      };
      var result = taggingSvc.filterFile(testFile);
      expect(result).to.equal(true);
      sandbox.stub(taggingSvc,"filterStartDate", new Date(2014, 10, 27,0,0,0,0));
      result = taggingSvc.filterFile(testFile);
      expect(result).to.equal(false);
    });
    it("filterFile endDate with an undefined filteredTags & startDate works properly", function () {
      sandbox.stub(taggingSvc,"filterEndDate", new Date(2014, 10, 29,0,0,0,0));
      var testFile =
      {"name":"test3", "tags": [
        {"type": "TIMELINE", values: [
          JSON.stringify({"endDate": "11/29/14 12:00 AM"})
        ]
      }
      ]};
      var result = taggingSvc.filterFile(testFile);
      expect(result).to.equal(true);
      sandbox.stub(taggingSvc,"filterEndDate", new Date(2014, 10, 28,0,0,0,0));
      result = taggingSvc.filterFile(testFile);
      expect(result).to.equal(false);
    });
    it("filterFile with lookupTag, startDate, and endDate filled in works properly", function () {
      sandbox.stub(taggingSvc,"filteredTags", angular.copy(mockLookupSelectedTags).slice(0,1));
      sandbox.stub(taggingSvc,"filterStartDate", new Date(2014, 10, 26,0,0,0,0));
      sandbox.stub(taggingSvc,"filterEndDate", new Date(2014, 10, 29,0,0,0,0));
      var testFile =
      {"name":"test3", "tags": [
        {"type": "LOOKUP", "name": "brand", "values": ["brand1", "brand2"]},
        {"type": "TIMELINE", values: [JSON.stringify({startDate: "11/26/14 12:00 AM", endDate: "11/29/14 12:00 AM"})]}
      ]};
      var result = taggingSvc.filterFile(testFile);
      expect(result).to.equal(true);
      testFile = {"name":"test3", "tags": [
        {"type": "LOOKUP", "name": "size", "values": ["size1"]},
        {"type": "TIMELINE", values: [JSON.stringify({startDate: "11/26/14 12:00 AM", endDate: "11/29/14 12:00 AM"})]}
      ]};
      result = taggingSvc.filterFile(testFile);
      expect(result).to.equal(false);
      testFile = {"name":"test3", "tags": [
        {"type": "LOOKUP", "name": "brand", "values": ["brand1", "brand2"]},
        {"type": "TIMELINE", values: [JSON.stringify({startDate: "11/26/14 12:00 AM", endDate: "11/29/14 12:00 AM"})]}
      ]};
      sandbox.stub(taggingSvc,"filterStartDate", new Date(2014, 10, 27,0,0,0,0));
      sandbox.stub(taggingSvc,"filterEndDate", new Date(2014, 10, 28,0,0,0,0));
      result = taggingSvc.filterFile(testFile);
      expect(result).to.equal(false);
      sandbox.stub(taggingSvc,"filterStartDate", new Date(2014, 10, 25,0,0,0,0));
      sandbox.stub(taggingSvc,"filterEndDate", new Date(2014, 10, 30,0,0,0,0));
      result = taggingSvc.filterFile(testFile);
      expect(result).to.equal(true);
      sandbox.stub(taggingSvc,"filterStartDate", new Date(2014, 11, 1,0,0,0,0));
      result = taggingSvc.filterFile(testFile);
      expect(result).to.equal(false);
      sandbox.stub(taggingSvc,"filterEndDate", new Date(2014, 10, 25,0,0,0,0));
      result = taggingSvc.filterFile(testFile);
      expect(result).to.equal(false);
    });
    it("filterFile returns true for Trash folder", function () {
      var testFile =
      {"name":"--TRASH--/"};
      var result = taggingSvc.filterFile(testFile);
      expect(result).to.equal(true);
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

    it("saveChangesToTags for LookupTags should map names of files and call updateLookupTags and " +
    "updateTags with no companyId", function () {
      sandbox.stub(taggingSvc,"selected", {lookupTags: angular.copy(mockLookupSelectedTags), files: angular.copy(mockSelectedFiles)});
      sandbox.stub(taggingSvc,"updateLookupTags", function(){
        return Q.resolve();});
      sandbox.stub(localDatastore, "updateTags", function(){return 200;});
      return taggingSvc.saveChangesToTags(taggingSvc.selected.lookupTags, "LOOKUP").then(function() {
        expect(taggingSvc.updateLookupTags.getCall(0).args[0][0]).to.eql(taggingSvc.selected.files[0].name);
        expect(taggingSvc.updateLookupTags.getCall(0).args[0].length).to.eql(2);
        expect(taggingSvc.updateLookupTags.getCall(0).args[1]).to.eql(taggingSvc.selected.lookupTags);
        expect(taggingSvc.updateLookupTags.getCall(0).args[2]).to.eql("LOOKUP");
        expect(localDatastore.updateTags.getCall(0).args[0][0]).to.eql(taggingSvc.selected.files[0].name);
        expect(localDatastore.updateTags.getCall(0).args[0].length).to.eql(2);
        expect(localDatastore.updateTags.getCall(0).args[1]).to.eql("LOOKUP");
        expect(localDatastore.updateTags.getCall(0).args[2]).to.eql(taggingSvc.selected.lookupTags);
      });
    });

    it("saveChangesToTags for FreeformTags should map names of files and call updateTags", function () {
      sandbox.stub(taggingSvc,"selected", {freeformTags: angular.copy(mockFreeformSelectedTagsWithValues), files: angular.copy(mockSelectedFiles)});
      sandbox.stub(localDatastore, "updateTags", function(){return 200;});
      sandbox.stub(taggingSvc,"updateFreeformTags", function(){
        return Q.resolve();});
      return taggingSvc.saveChangesToTags(taggingSvc.selected.freeformTags, "FREEFORM").then(function(){
        expect(taggingSvc.updateFreeformTags.getCall(0).args[0][0]).to.eql(taggingSvc.selected.files[0].name);
        expect(taggingSvc.updateFreeformTags.getCall(0).args[0].length).to.eql(2);
        expect(taggingSvc.updateFreeformTags.getCall(0).args[1]).to.eql(taggingSvc.selected.freeformTags);
        expect(taggingSvc.updateFreeformTags.getCall(0).args[2]).to.eql("FREEFORM");
        expect(localDatastore.updateTags.getCall(0).args[0][0]).to.eql(taggingSvc.selected.files[0].name);
        expect(localDatastore.updateTags.getCall(0).args[0].length).to.eql(2);
        expect(localDatastore.updateTags.getCall(0).args[1]).to.eql("FREEFORM");
        expect(localDatastore.updateTags.getCall(0).args[2]).to.eql(taggingSvc.selected.freeformTags);
        expect(localDatastore.updateTags.getCall(0).args[2].length).to.eql(3);
      });

    });

    it("saveChangesToTags for FreeformTags should not send freeform Tag entries that are empty", function () {
      sandbox.stub(taggingSvc,"selected", {freeformTags: mockFreeformSelectedTagsWithValuesMissing, files: angular.copy(mockSelectedFiles)});
      sandbox.stub(localDatastore, "updateTags", function(){return 200;});
      sandbox.stub(taggingSvc,"updateFreeformTags", function(){
        return Q.resolve();});
      taggingSvc.saveChangesToTags(taggingSvc.selected.freeformTags, "FREEFORM");
      return taggingSvc.saveChangesToTags(taggingSvc.selected.freeformTags, "FREEFORM").then(function(){
        expect(taggingSvc.updateFreeformTags.getCall(0).args[0][0]).to.eql(taggingSvc.selected.files[0].name);
        expect(taggingSvc.updateFreeformTags.getCall(0).args[0].length).to.eql(2);
        expect(taggingSvc.updateFreeformTags.getCall(0).args[1]).to.eql(taggingSvc.selected.freeformTags);
        expect(taggingSvc.updateFreeformTags.getCall(0).args[2]).to.eql("FREEFORM");
        expect(localDatastore.updateTags.getCall(0).args[0][0]).to.eql(taggingSvc.selected.files[0].name);
        expect(localDatastore.updateTags.getCall(0).args[0].length).to.eql(2);
        expect(localDatastore.updateTags.getCall(0).args[1]).to.eql("FREEFORM");
        expect(localDatastore.updateTags.getCall(0).args[2].length).to.eql(2);
      });

    });

    it("saveChangesToTags for TimelineTag should map names of files and call updateTags", function () {
      sandbox.stub(taggingSvc,"selected", {timelineTag: angular.copy(mockTimelineObjectToSave), files: angular.copy(mockSelectedFiles)});
      sandbox.stub(localDatastore, "updateTimelineTag", function(){return 200;});
      localDatastore.fileTagFromStorageTag = function(){
        return 200;
      };
      sandbox.stub(taggingSvc,"updateTimelineTag", function(){
        return Q.resolve([200]);
      });

      return taggingSvc.saveChangesToTags(taggingSvc.selected.timelineTag, "TIMELINE").then(function(){
        expect(taggingSvc.updateTimelineTag.getCall(0).args[0][0]).to.eql(taggingSvc.selected.files[0].name);
        expect(taggingSvc.updateTimelineTag.getCall(0).args[0].length).to.eql(2);
        expect(taggingSvc.updateTimelineTag.getCall(0).args[1]).to.eql(taggingSvc.selected.timelineTag);
        expect(taggingSvc.updateTimelineTag.getCall(0).args[2]).to.eql("TIMELINE");
        expect(localDatastore.updateTimelineTag.getCall(0).args[0]).to.eql(200);
      });

    });

    it("clearAllLookupTags should remove all tags froms selected LookupTags, but does not call save.", function () {
      sandbox.stub(taggingSvc,"available", {lookupTags: angular.copy(mockLookupAvailableTags)});
      sandbox.stub(taggingSvc,"selected", {lookupTags: angular.copy(mockLookupSelectedTags)});
        taggingSvc.clearAllLookupTags();
        expect(taggingSvc.selected.lookupTags.length).to.eql(0);
        expect(taggingSvc.available.lookupTags.length).to.eql(12);
    });

    it("clearAllLookupTagsAndSave should call clearAllLookupTags and then call saveChangesToTags and" +
    "should remove all tags froms selected LookupTags.", function () {
      sandbox.stub(taggingSvc,"selected", {files: angular.copy(mockSelectedFiles)});
      sandbox.stub(taggingSvc,"updateLookupTags", function(){
        return Q.resolve();});
      taggingSvc.tagGroups = {};
      sandbox.stub(taggingSvc,"tagGroups", {lookupTags: angular.copy(mockLookupSelectedTags)});
      sandbox.stub(taggingSvc,"clearAllLookupTags", function(){ return 200;});
      taggingSvc.clearAllLookupTagsAndSave();
      expect(taggingSvc.updateLookupTags.getCall(0).args[0][0]).to.eql(taggingSvc.selected.files[0].name);
      expect(taggingSvc.updateLookupTags.getCall(0).args[0].length).to.eql(2);
      expect(taggingSvc.updateLookupTags.getCall(0).args[2]).to.eql("LOOKUP");
      return taggingSvc.updateLookupTags().then(function(){
        expect(taggingSvc.tagGroups.lookupTags.length).to.equal(0);
      });
    });

    it("clearAllFreeformTags should remove all tags froms selected FreeformTags, but does not call save.", function () {
      sandbox.stub(taggingSvc,"selected", {freeformTags: angular.copy(mockFreeformSelectedTagsWithValues)});
      taggingSvc.clearAllFreeformTags();
      expect(taggingSvc.selected.freeformTags[0].value).to.eql("");
    });

    it("clearAllFreeformTagsAndSave should remove all tags froms selected FreeformTags, and calls save.", function () {
      sandbox.stub(taggingSvc,"saveChangesToTags", function(){
        return Q.resolve();
      });

      taggingSvc.tagGroups = {};
      localDatastore.getFileTags = function(){
        return [{}];
      };
      taggingSvc.selected = { files: [] };
      sandbox.stub(taggingSvc,"tagGroups", {freeformTags: angular.copy(mockFreeformSelectedTagsWithValues)});
      sandbox.stub(taggingSvc,"clearAllFreeformTags", function(){ return 200;});
      taggingSvc.clearAllFreeformTagsAndSave();
      expect(taggingSvc.saveChangesToTags.callCount).to.equal(1);
      return taggingSvc.saveChangesToTags().then(function(){
        expect(taggingSvc.tagGroups.freeformTags.length).to.equal(0);
      });
    });

    it("clearAllTimelineTagsAndSave should null selected and tagGroups on service and call save.", function () {
      taggingSvc.tagGroups = {};
      sandbox.stub(taggingSvc,"selected", {timelineTag: angular.copy(mockTimelineObjectToSave), files: angular.copy(mockSelectedFiles)});
      sandbox.stub(taggingSvc,"tagGroups", {timelineTag: angular.copy(mockTimelineObjectToSave)});
      sandbox.stub(taggingSvc,"clearTimeLineOnly", function(){ return 200;});
      taggingSvc.clearAllTimelineTagsAndSave();
      expect(taggingSvc.clearTimeLineOnly.getCall(0).args[0][0]).to.eql(taggingSvc.selected.files[0].name);
      expect(taggingSvc.clearTimeLineOnly.getCall(0).args[0].length).to.eql(2);
      expect(taggingSvc.clearTimeLineOnly.getCall(0).args[1]).to.eql(taggingSvc.selected.timelineTag);
      expect(taggingSvc.clearTimeLineOnly.getCall(0).args[2]).to.eql("TIMELINE");
    });

    it("clearAllInvalidLookupTags should remove all invalid tags froms selected LookupTags, but does not call save.", function () {
      sandbox.stub(taggingSvc,"available", {lookupTags: angular.copy(mockLookupAvailableTags)});
      sandbox.stub(taggingSvc,"selected", {lookupTags: angular.copy(mockLookupSelectedTags)});
      taggingSvc.selected.lookupTags[0].invalid = true;
      taggingSvc.clearAllInvalidLookupTags();
      expect(taggingSvc.selected.lookupTags.length).to.eql(6);
      expect(taggingSvc.available.lookupTags.length).to.eql(6);
    });
  });

  describe("misc functions:", function() {
    it("getFlattenedTagsConfigList should take a tags type Lookup and flatten it.", function () {
      sandbox.stub(localDatastore, "getTagConfigs", function(){ return angular.copy(mockTagConfigs);});
      var result = taggingSvc.getFlattenedTagsConfigList("LOOKUP");
      expect(localDatastore.getTagConfigs.callCount).to.equal(1);
      expect(result.length).to.equal(12);
      expect(result[0].name).to.equal("brand");
      expect(result[0].value).to.equal("brand1");
    });

    it("tagDateStringToDate take a dateString and return a date object of same value.", function () {
      var result = taggingSvc.tagDateStringToDate("11/26/14 12:00 AM");
      expect(result.getFullYear()).to.equal(2014);
      expect(result.getMonth()).to.equal(10);
      expect(result.getDate()).to.equal(26);
      result = taggingSvc.tagDateStringToDate(null);
      expect(result).to.equal(null);
    });

    it("tagTimeStringToDate take a dateString for Time and return a date time object of same value.", function () {
      var result = taggingSvc.tagTimeStringToDate("12:15 AM");
      expect(result.getHours()).to.equal(0);
      expect(result.getMinutes()).to.equal(15);
      result = taggingSvc.tagTimeStringToDate("11:59 AM");
      expect(result.getHours()).to.equal(11);
      expect(result.getMinutes()).to.equal(59);
      result = taggingSvc.tagTimeStringToDate("12:00 PM");
      expect(result.getHours()).to.equal(12);
      expect(result.getMinutes()).to.equal(0);
      result = taggingSvc.tagTimeStringToDate("1:30 PM");
      expect(result.getHours()).to.equal(13);
      expect(result.getMinutes()).to.equal(30);
      result = taggingSvc.tagTimeStringToDate("11:59 PM");
      expect(result.getHours()).to.equal(23);
      expect(result.getMinutes()).to.equal(59);
      result = taggingSvc.tagTimeStringToDate(null);
      expect(result).to.equal(null);
    });

    it("getFlattenedTagsConfigList should take a tags type Freeform and flatten it.", function () {
      sandbox.stub(localDatastore, "getTagConfigs", function(){ return angular.copy(mockTagConfigs);});
      var result = taggingSvc.getFlattenedTagsConfigList("FREEFORM");
      expect(localDatastore.getTagConfigs.callCount).to.equal(1);
      expect(result.length).to.equal(1);
      expect(result[0].name).to.equal("testfreeform1");
    });

    it("refreshLocalStore should refresh call localData.loadLocalData with companyId.", function () {
      $stateParams.companyId = function(){ return;};
      sandbox.stub($stateParams, "companyId", function(){return "ac57def2-834e-4ecd-8b91-44ca14524fd0";} );
      sandbox.stub(localDatastore, "loadLocalData", function(){return 200; });
      taggingSvc.refreshLocalStore();
      expect(localDatastore.loadLocalData.callCount).to.equal(1);
    });

    it("refreshSelection should refresh all service variables and union multiple files given union command.", function () {
      sandbox.stub(localDatastore, "availableNameValuePairs", function() { return [
        "brandbrand1", "brandbrand2", "stylestyle1", "stylestyle2",
        "brandbrand3", "stylestyle4", "stylestyle5", "sizes", "sizem", "sizel"
      ];
      });
      sandbox.stub(localDatastore, "getTagConfigs", function(){ return angular.copy(mockTagConfigs);});
      sandbox.stub(localDatastore, "getFilesWithTags", function(){return angular.copy(mockFiles); });
      sandbox.stub(taggingSvc,"getFlattenedTagsConfigList", function(type) {
        if(type === "LOOKUP"){
          return [
            {"name": "size", "value": "s"},
            {"name": "style", "value": "style1"},
            {"name": "style", "value": "style2"},
            {"name": "style", "value": "style3"},
            {"name": "style", "value": "style4"},
            {"name": "style", "value": "style5"},
            {"name": "brand", "value": "brand1"},
            {"name": "brand", "value": "brand2"},
            {"name": "brand", "value": "brand3"}
          ];
        }
        if(type === "FREEFORM"){
          return angular.copy(mockFreeformSelectedTags);
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
      expect(taggingSvc.selected.freeformTags.length).to.equal(3);
    });
  });
});
