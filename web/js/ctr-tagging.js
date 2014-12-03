"use strict";
angular.module("tagging")
.controller("TaggingCtrl", ["$scope","$modalInstance", "tagGroups", function($scope, $modalInstance, tagGroups) {

  $scope.tagGroups = tagGroups;
  $scope.showMainTagView = true;
  $scope.showLookupEditView = false;

  $scope.editLookup = function(){
    $scope.showMainTagView = false;
    $scope.showLookupEditView = true;
  };
  $scope.resetView = function(){
    $scope.showMainTagView = true;
    $scope.showLookupEditView = false;
  };
  $scope.ok = function() {
    $modalInstance.close();
  };
  $scope.cancel = function() {
    $scope.resetView();
    $modalInstance.dismiss("cancel");
  };
}]);
