"use strict";
angular.module("tagging")
  .controller("DeleteTagCtrl", ["$scope", "$modalInstance",
    function($scope, $modalInstance) {

      $scope.ok = function() {
        $modalInstance.close();
      };
      $scope.cancel = function() {
        $modalInstance.dismiss("cancel");
      };
    }
  ])
  .controller("TagSettingsCtrl", ["$scope", "TaggingService", "$modal", "localDatastore",
    function($scope, taggingSvc, $modal, localData) {
      $scope.lookupTags = taggingSvc.getLookupTagSettings();
      $scope.freeformTags = taggingSvc.getFlattenedTagsConfigList("FREEFORM");
      $scope.tagType = false;
      $scope.selectedTag = {};
      $scope.tagStatusDetails = localData.statusDetails;
      $scope.buttonsDisabled = false;
      $scope.selectedValues = $scope.selectedTag.values;
      $scope.showAddView = false;
      $scope.showEditView = false;
      $scope.showMainView = true;
      $scope.oldNameOfTag = "";
      $scope.oldValuesOfTag = "";
      $scope.duplicates = false;
      $scope.sameTagName = false;
      $scope.accessDenied = false;

      $scope.addTags = function(){
        $scope.selectedTag = {};
        $scope.buttonsDisabled = $scope.selectedTag.values === "";
        $scope.showMainView = false;
        $scope.showAddView = true;
      };

      $scope.editTags = function(selectedTag){
        $scope.oldNameOfTag = selectedTag.name;
        $scope.oldValuesOfTag = selectedTag.values;
        if(selectedTag.values === undefined){
          $scope.tagType = true;
        }
        if($scope.tagType){
          $scope.buttonsDisabled = false;
        } else {
          $scope.buttonsDisabled = selectedTag.values === "";
        }
        $scope.selectedTag = angular.copy(selectedTag);
        $scope.duplicates = $scope.hasDuplicates($scope.selectedTag.values);
        $scope.showMainView = false;
        $scope.showEditView = true;
      };

      $scope.resetView = function(){
        $scope.accessDenied = false;
        $scope.oldNameOfTag = "";
        $scope.oldValuesOfTag = "";
        localData.loadLocalData().then(function(){
          $scope.lookupTags = taggingSvc.getLookupTagSettings();
          $scope.freeformTags =  taggingSvc.getFlattenedTagsConfigList("FREEFORM");
          $scope.selectedPos = undefined;
          $scope.tagType = false;
          $scope.showMainView = true;
          $scope.showEditView = false;
          $scope.showAddView = false;
        });
      };
      $scope.resetView();
      $scope.changeTagType = function(){
        document.getElementById("tagSettingValues").required = false;
        $scope.tagType = !$scope.tagType;
      };
      $scope.updateOrAddTag = function(){

        $scope.selectedTag.type = ($scope.tagType) ? "FREEFORM" : "LOOKUP";
        $scope.buttonsDisabled = true;
        taggingSvc.updateTagConfig($scope.selectedTag, $scope.oldNameOfTag).then(function(resp){
            if(resp.code === 200) {
              $scope.resetView();
            } else {
              $scope.accessDenied = true;
            }
        });
      };

      $scope.deleteTag = function(){
        $scope.selectedTag.name = "";
        $scope.buttonsDisabled = true;
        taggingSvc.updateTagConfig($scope.selectedTag).then(function(resp){
          if(resp.code === 200) {
            $scope.resetView();
          } else {
            $scope.accessDenied = true;
          }
        });
      };

      $scope.openConfirm = function () {
        var modalInstance = $modal.open({
          templateUrl: "deleteConfirm.html",
          controller: "DeleteTagCtrl",
          windowClass: "modal-custom"
        });
        modalInstance.result.then(function () {
          $scope.deleteTag();
        }, function () {
          //$log.info('Modal dismissed at: ' + new Date());
        });
      };

      $scope.hasDuplicates = function(array) {
        if(array === undefined || array.length === 0){
          $scope.duplicates = false;
          return false;
        }
        var valuesSoFar = [];
        for (var i = 0; i < array.length; ++i) {
          var value = array[i];
          if (valuesSoFar.indexOf(value.toLowerCase()) !== -1) {
            $scope.duplicates = true;
            return true;
          }
          valuesSoFar.push(value);
        }
        $scope.duplicates = false;
        return false;
      };

      $scope.tagNameAlready = function(name) {
        var nameLookup;
        if(name !== undefined){
          if($scope.tagType){
            nameLookup = $scope.freeformTags.map(function(i){
              return i.name;
            });
            $scope.sameTagName = nameLookup.indexOf(name.toLowerCase()) > -1;
            return nameLookup.indexOf(name.toLowerCase()) > -1;
          } else {
            nameLookup = $scope.lookupTags.map(function(i){
              return i.name;
            });
            $scope.sameTagName = nameLookup.indexOf(name.toLowerCase()) > -1;
            return nameLookup.indexOf(name.toLowerCase()) > -1;
          }
        }
      };
    }]);