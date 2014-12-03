"use strict";
describe("TaggingCtrl", function() {
  beforeEach(module("tagging"));

  var TaggingCtrl
    ,scope = {}
    ,modalInstance = {}
    ,tagGroups = {};

  beforeEach(inject(function($controller) {
    TaggingCtrl = $controller("TaggingCtrl"
      ,{$scope: scope, $modalInstance: modalInstance, tagGroups: tagGroups});
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

  it("should provide a tagGroups variable ", function() {
    expect(scope.tagGroups).to.exist;
  });
});
