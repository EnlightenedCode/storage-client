"use strict";
angular.module("localData", [])
.service("localDatastore", ["LocalTagsConfigFiles", "LocalFiles", "$q"
  , function(LocalTagsConfigFiles, LocalFiles, $q){
    var svc = {};
    var ds = {};

    svc.loadLocalData = function(){
      var tagsConfigQuery = LocalTagsConfigFiles.query().$promise.then(function(resp) {
        ds.tagConfigs = resp;
      });
      var filesRefreshQuery = LocalFiles.query().$promise.then(function(resp){
        ds.files = resp;
      });
      return $q.all([tagsConfigQuery, filesRefreshQuery]);
    };

    svc.getFiles = function(){
      var files = [];
      files = angular.copy(ds.files);
      return files;
    };
    svc.getTagConfigs = function(){
      var tagConfigs = [];
      tagConfigs = angular.copy(ds.tagConfigs);
      return tagConfigs;
    };

    svc.updateTags = function(fileNames, tagType, selectedChanges) {

      var selectedFiles = ds.files.filter(function(i){
        return fileNames.indexOf(i.name) > -1;
      });
      var updatedTagsToAdd;
      for ( var i = 0; i < selectedFiles.length; i++ ){
        var tagsRemovedOfTagType = filterNotTypeArray(tagType, selectedFiles[i].tags);
        if(tagType === "Lookup" || tagType === "Freeform"){
          updatedTagsToAdd = unflattenLookupFreeformTags(selectedChanges, tagType);
        }
        tagsRemovedOfTagType = tagsRemovedOfTagType.concat(updatedTagsToAdd);
        selectedFiles[i].tags = tagsRemovedOfTagType;
      }
      updateFiles(selectedFiles);
    };

    function filterNotTypeArray(type ,array){
      return array.filter(function(i){
        return i.type !== type;
      });
    }

    function mapNameArray(array) {
      return array.map(function (i) {
        return i.name;
      });
    }
    function updateFiles(files){
      for ( var i = 0; i < files.length; i++ ){
        var fileNames = mapNameArray(ds.files);
        var index = fileNames.indexOf(files[i].name);
        if(index !== -1){
          ds.files.splice(index, 1);
          ds.files.push(files[i]);
        }
      }
    }

    function unflattenLookupFreeformTags(selectedChanges, tagType){
      var updatedTagsToAdd = [];
      var updatedTagNames = [];
      for ( var y = 0; y < selectedChanges.length; y++ ){
        updatedTagNames = (updatedTagsToAdd.length > 0) ? mapNameArray(updatedTagsToAdd) : updatedTagsToAdd;
        var updatedTag = {};
        var idx = updatedTagNames.indexOf(selectedChanges[y].name);
        if(updatedTagNames.indexOf(selectedChanges[y].name) === -1){
          updatedTag = {type: tagType, name: selectedChanges[y].name, values: [selectedChanges[y].value]};
          updatedTagsToAdd.push(updatedTag);
        } else {
          updatedTagsToAdd[idx].values.push(selectedChanges[y].value);
        }
      }
      return updatedTagsToAdd;
    }

    return svc;

  }]);

