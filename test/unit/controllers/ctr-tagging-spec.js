"use strict";
describe("TaggingCtrl", function() {
  beforeEach(module("tagging"));

  var TaggingCtrl
    ,scope = {}
    ,modalInstance = {}
    ,tagGroups = {}
    ,availableLookupTags ={}
    ,selectedLookupTags = {}
    ,taggingSvc = {};
  beforeEach(inject(function($controller) {
    TaggingCtrl = $controller("TaggingCtrl"
      ,{$scope: scope, $modalInstance: modalInstance, tagGroups: tagGroups,
        availableLookupTags: availableLookupTags, selectedLookupTags: selectedLookupTags
      , TaggingService: taggingSvc});
  }));

  it("should be defined", function() {
    expect(TaggingCtrl).to.exist;
  });

  it("should should provide a modal cancel function ", function() {
    expect(scope.cancel).to.exist;
  });

  it("should provide an modal ok function ", function() {
    expect(scope.ok).to.exist;
  });
  it("should should provide a resetView function ", function() {
    expect(scope.resetView).to.exist;
  });

  it("should should provide an editLookup function ", function() {
    expect(scope.editLookup).to.exist;
  });

  it("should should provide a addToSelectedLookupTag function ", function() {
    expect(scope.addToSelectedLookupTag).to.exist;
  });

  it("should should provide an removeFromSelectedLookupTag function ", function() {
    expect(scope.removeFromSelectedLookupTag).to.exist;
  });

  it("should should provide an saveChangesToLookupTags function ", function() {
    expect(scope.saveChangesToLookupTags).to.exist;
  });

  it("should provide tagGroups variable ", function() {
    expect(scope.tagGroups).to.exist;
  });

  it("should provide availableLookupTags variable ", function() {
    expect(scope.availableLookupTags).to.exist;
  });

  it("should provide selectedLookupTags variable ", function() {
    expect(scope.selectedLookupTags).to.exist;
  });

});
