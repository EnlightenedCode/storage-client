"use strict";
describe("CopyUrlCtrl", function() {
  beforeEach(module("medialibrary"));

  var CopyUrlCtrl
    ,scope = {}
    ,modalInstance = {}
    ,copyFile = {};

  beforeEach(inject(function($controller) {
    CopyUrlCtrl = $controller("CopyUrlCtrl"
      ,{$scope: scope, $modalInstance: modalInstance, copyFile: copyFile});
  }));

  it("should be defined", function() {
    expect(CopyUrlCtrl).to.exist;
  });

  it("should should provide a modal cancel function ", function() {
    expect(scope.cancel).to.exist;
  });

  it("should provide an modal ok function ", function() {
    expect(scope.ok).to.exist;
  });

  it("should provide a copyFile variable ", function() {
    expect(scope.copyFile).to.exist;
  });
});