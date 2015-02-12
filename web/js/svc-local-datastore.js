"use strict";

angular.module("localData", [])
.service("localDatastore", ["LocalTagsConfigFiles", "LocalFiles", "$q", "$stateParams", "GAPIRequestService",
    "FileListService",
    function(LocalTagsConfigFiles, LocalFiles, $q, $stateParams, requestor, listSvc){
    var svc = {};
    var ds = {fileTagEntries: [], tagConfigs: [], filesWithTags: []};
    svc.statusDetails = {code: 200};

    svc.refreshConfigTags = function(){
      var deferred = $q.defer();
      var params = {companyId: $stateParams.companyId};
      requestor.executeRequest("storage.tagdef.list", params).then(function(resp){
        ds.tagConfigs = (resp.items) ? resp.items : [];
        deferred.resolve(resp);
      });
      return deferred.promise;
    };
    svc.loadLocalData = function(){
        var code = 0;
        svc.statusDetails.code = 202;
        var params = {companyId: $stateParams.companyId};
        var fileTagListQuery = requestor.executeRequest("storage.files.listbytags", params).then(function(resp){
          ds.fileTagEntries = (resp.files) ? svc.storageObjectsToFileTags(resp.files) : [];

          code += resp.code;
        });

        var tagDefListQuery = svc.refreshConfigTags().then(function(resp){

          code += resp.code;
        });
        return $q.all([fileTagListQuery, tagDefListQuery]).then(function(){
          svc.statusDetails.code = (code === 400) ? 200 : 500;
          ds.filesWithTags = angular.copy(listSvc.filesDetails.files);
          ds.filesWithTags.forEach(function(i){
            var filteredTagEntries = ds.fileTagEntries.filter(function(elem){
              return elem.objectId === i.name;
            });
            i.tags = filteredTagEntries;
          });
        });
    };

    svc.tagDefUpdate = function(oldName, newName, type, values){

      var tagDefToAdd = (type === "LOOKUP") ? {
        name: newName,
        type: type,
        values: values
      } :
        {
          name: newName,
          type: type
        };

      // if tagDef name already found
      var tagConfigNames = ds.tagConfigs.map(function(i){
        return i.name;
      });
      var index = (oldName !== undefined) ? tagConfigNames.indexOf(oldName) : -1;

      //remove from array
      if (tagDefToAdd.name === undefined || tagDefToAdd.name === "")
      {
        if(index > -1){
          ds.tagConfigs.splice(index, 1);
        }
      } else if(tagDefToAdd.type === "LOOKUP" && (tagDefToAdd.values === undefined || tagDefToAdd.name === "" ||
        tagDefToAdd.values.length === 0 || tagDefToAdd.values === "")){
        ds.tagConfigs.splice(index, 1);
      } else if((tagDefToAdd.type === "FREEFORM" && index > -1) ||
        (tagDefToAdd.values !== undefined && index > -1)){
        ds.tagConfigs[index] = tagDefToAdd;
      } else {
        ds.tagConfigs.push(tagDefToAdd);
      }
    };

    svc.getFilesWithTags = function(){
      var files = [];
      files = angular.copy(ds.filesWithTags);
      return files;
    };

    svc.getTagEntries = function(){
      var tagEntries = [];
      tagEntries = angular.copy(ds.fileTagEntries);
      return tagEntries;
    };

    // Returns the tags of a given file, optionally filtering by type
    svc.getFileTags = function(objectId, types) {
      var file = _.find(ds.filesWithTags, function(file) {
        return file.name === objectId;
      });

      if(!_.isUndefined(file)) {
        // Filter tags
        var tags = file.tags.filter(function(tag) {
          return !types || types.indexOf(tag.type) >= 0;
        });

        // Flatten { tagname, values } into [{ tagname, value }]
        tags = tags.map(function(tag) {
          return _.flatten(tag.values.map(function(value) {
            return { type: tag.type, name: tag.name, value: value};
          }));
        });

        // Flatten array of arrays into a single array
        return _.flatten(tags);
      }
      else {
        return [];
      }
    };

    svc.getTagDefs = function(){
      var tagDefs = [];
      tagDefs = angular.copy(ds.tagConfigs);
      return tagDefs;
    };

    svc.getTagConfigs = function(){
      var tagConfigs = [];
      tagConfigs = angular.copy(ds.tagConfigs);
      return tagConfigs;
    };

    svc.availableNameValuePairs = function(){
      var availableNameValuePairs = [];
      ds.tagConfigs.forEach(function(x){
        if(x.type === "LOOKUP"){
          x.values.forEach(function(y){
            availableNameValuePairs.push(x.name + y);
          });
        }
      });

      return availableNameValuePairs;
    };
    svc.clearSelectedTimelines = function(selectedFileNames){
      var datastoreFileNames = ds.filesWithTags.map(function(x){
        return x.name;
      });
      selectedFileNames.forEach(function(elem){
        var indexFile = datastoreFileNames.indexOf(elem);
        if(indexFile > -1){
          ds.filesWithTags[indexFile].tags.forEach(function(i,ipos) {
            if (i.type === "TIMELINE") {
              ds.filesWithTags[indexFile].tags.splice(ipos, 1);
            }
          });
        }
      });
    };
    svc.updateTimelineTag = function(selectedItems){
      var filePosition = null;
      var tagPositionToSlice = null;
      ds.filesWithTags.forEach(function(elem, pos){
        if(elem.name === selectedItems.objectId){
          filePosition = pos;
          elem.tags.forEach(function(i,ipos){
            if(i.type === "TIMELINE"){
              tagPositionToSlice = ipos;
            }
          });
        }
      });

      if(tagPositionToSlice !== null && filePosition !== null){
        ds.filesWithTags[filePosition].tags.splice(tagPositionToSlice, 1);
      }
      if(filePosition !== null){
        ds.filesWithTags[filePosition].tags.push(selectedItems);
      }
    };


    svc.updateTags = function(fileNames, tagType, selectedChanges) {
      var selectedFiles = ds.filesWithTags.filter(function(i){
        return fileNames.indexOf(i.name) > -1;
      });
      var updatedTagsToAdd = [];
      for ( var i = 0; i < selectedFiles.length; i++ ){
        var tagsRemovedOfTagType = filterNotTypeArray(tagType, selectedFiles[i].tags);
        if(tagType === "LOOKUP" || tagType === "FREEFORM"){
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
        var fileNames = mapNameArray(ds.filesWithTags);
        var index = fileNames.indexOf(files[i].name);
        if(index !== -1){
          ds.filesWithTags.splice(index, 1);
          ds.filesWithTags.push(files[i]);
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
          if(tagType === "LOOKUP"){
            updatedTag = {
              changedBy: selectedChanges[y].changedBy, changedDate: selectedChanges[y].changedDate, companyId: selectedChanges[y].companyId,
              createdBy: selectedChanges[y].createdBy, creationDate: selectedChanges[y].creationDate, id: selectedChanges[y].id,
              objectId: selectedChanges[y].objectId,
              type: tagType, name: selectedChanges[y].name, values: [selectedChanges[y].value]};
            updatedTagsToAdd.push(updatedTag);
          } else if(tagType === "FREEFORM" && typeof selectedChanges[y].value !== "undefined"){
            updatedTag = {
              changedBy: selectedChanges[y].changedBy, changedDate: selectedChanges[y].changedDate, companyId: selectedChanges[y].companyId,
              createdBy: selectedChanges[y].createdBy, creationDate: selectedChanges[y].creationDate, id: selectedChanges[y].id,
              kind: selectedChanges[y].kind, objectId: selectedChanges[y].objectId,
              type: tagType, name: selectedChanges[y].name, values: [selectedChanges[y].value]};
            updatedTagsToAdd.push(updatedTag);
          }
        } else {
          updatedTagsToAdd[idx].values.push(selectedChanges[y].value);
        }
      }
      return updatedTagsToAdd;
    }

    // Helper functions to transform current RvStorageObject format to former FileTagEntry
    svc.fileTagFromStorageTag = function(so, tag, values) {
      return {
        companyId: so.companyId,
        objectId: so.objectId,
        type: tag.type,
        name: tag.name,
        values: values || []
      };
    };

    svc.storageObjectToFileTags = function(so) {
      var fileTags = {};

      if(so.tags) {
        so.tags.forEach(function(t) {
          var key = t.type + t.name;
          var ft = fileTags[key];

          if(ft === undefined) {
            fileTags[key] = svc.fileTagFromStorageTag(so, t);
            ft = fileTags[key];
          }

          ft.values.push(t.value);
        });
      }

      if(so.timeline) {
        fileTags.TIMELINE = svc.fileTagFromStorageTag(so,  { type: "TIMELINE", name: "TIMELINE" }, [so.timeline]);
      }

      return _.values(fileTags);
    };

    svc.storageObjectsToFileTags = function(storageObjects) {
      var fileTags = [];

      storageObjects.forEach(function(so) {
        fileTags = fileTags.concat(svc.storageObjectToFileTags(so));
      });

      return fileTags;
    };

    return svc;

  }]);

