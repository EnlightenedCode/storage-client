"use strict";
angular.module("tagging")
.controller("TaggingCtrl", ["$scope","$modalInstance", "tagGroups", "availableLookupTags"
    ,"selectedLookupTags", "TaggingService",
    function($scope, $modalInstance, tagGroups, availableLookupTags, selectedLookupTags, taggingSvc) {

  $scope.tagGroups = tagGroups;
  $scope.availableLookupTags = availableLookupTags;
  $scope.selectedLookupTags = selectedLookupTags;
  $scope.showMainTagView = true;
  $scope.showLookupEditView = false;


  $scope.addToSelectedLookupTag = function(tag){
    taggingSvc.addToSelectedLookupTag(tag);
  };
  $scope.removeFromSelectedLookupTag = function(tag){
    taggingSvc.removeFromSelectedLookupTag(tag);
  };
  $scope.saveChangesToLookupTags = function(){
    taggingSvc.saveChangesToLookupTags();
    $scope.resetView();
  };

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
}])
.controller("TagsFilterCtrl", ["$scope", "TaggingService", function($scope, TaggingService) {
  $scope.displayFilters = false;

  $scope.tags = TaggingService.getFlattenedTagsConfigList("Lookup");
  $scope.selectedTags = [];

  $scope.toggleDialog = function() {
    $scope.displayFilters = !$scope.displayFilters;
  };

  $scope.selectTag = function(tag) {
    var idx = $scope.tags.indexOf(tag);

    if(idx >= 0) {
      $scope.tags.splice(idx, 1);
      $scope.selectedTags.push(tag);
    }
  };

  $scope.deselectTag = function(tag) {
    var idx = $scope.selectedTags.indexOf(tag);

    if(idx >= 0) {
      $scope.selectedTags.splice(idx, 1);
      $scope.tags.push(tag);
    }
  };
}])
;
