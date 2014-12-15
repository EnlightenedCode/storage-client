"use strict";
angular.module("tagging", [])
.service("TaggingService", ["$modal", "$log", "$stateParams"
    , "$q", "localDatastore"
    , function($modal, $log, $stateParams, $q, localData){
    var svc = {};
    svc.configTags = {};
    svc.available = {};
    svc.selected = {};

    svc.refreshLocalStore = function(){
      if ($stateParams.companyId) {
      // placeholder code for live calls for these files
        var placeholder = 0;
        placeholder = 0;
      }
      if (typeof localData.getFiles() === "undefined") {
        return localData.loadLocalData();
      }
      //if in demo local mode return immediately resolved promise
      var fake;
      fake = $q.defer();
      fake.resolve();
      return fake.promise;
    };

    svc.addToSelectedLookupTag = function (tag){
      var status = "";
      status = takeItemFromOneArrayToAnother(tag, svc.available.lookupTags, svc.tagGroups.lookupTags);
      return status;
    };

    svc.removeFromSelectedLookupTag = function (tag){
      var status = "";
      status = takeItemFromOneArrayToAnother(tag, svc.tagGroups.lookupTags, svc.available.lookupTags);
      return status;
    };

    svc.saveChangesToLookupTags = function(){
      var namesOfFiles = svc.selected.files.map(function(i){
        return i.name;
      });
      localData.updateTags(namesOfFiles, "Lookup", svc.tagGroups.lookupTags);
      //syncToDatastore(svc.tagGroups.lookupTags);
    };

    svc.taggingButtonClick = function(items, command) {
      svc.refreshLocalStore().then(function() {
        setupTagModal(items, command);
      });
    };

    svc.getFlattenedTagsConfigList = function(type) {
      var tags = localData.getTagConfigs();
      var res = [];

      for(var i = 0; i < tags.length; i++) {
        var tagDef = tags[i];

        if(tagDef.type === type) {
          for(var j = 0; j < tagDef.values.length; j++) {
            res.push({ name: tagDef.name, value: tagDef.values[j] });
          }
        }
      }

      return res;
    };

    // Load localStore upon svc creation if in local
    if (!$stateParams.companyId) {
      svc.refreshLocalStore();
    }

    return svc;

    //Helper functions
    function setupTagModal(items, command){
      if(command === "union" || command === "copy"){
        var selectedFiles = getSelectedFiles(items);
        svc.selected.files = selectedFiles;
        svc.tagGroups = unionTagGroups(selectedFiles);
      }
      svc.configTags = transformAvailableTags(localData.getTagConfigs());

      svc.available.lookupTags = getAvailableTags(svc.configTags.lookupTags, svc.tagGroups.lookupTags);

      svc.modalInstance = $modal.open({
        templateUrl: "Tagging.html",
        controller: "TaggingCtrl",
        resolve: {
          tagGroups: function () {
            return svc.tagGroups;
          },
          availableLookupTags: function(){
            return svc.available.lookupTags;
          },
          selectedLookupTags: function(){
            return svc.tagGroups.lookupTags;
          }
        }
      });
      svc.modalInstance.result.then(function(){
        //do what you need if user presses ok
      }, function (){
        // do what you need to do if user cancels
        $log.info("Modal dismissed at: " + new Date());
      });
    }

    function getAvailableTags(configTags, lookupTags){
    return configTags.filter(function(i) {
        var tagValues = lookupTags.map(function(item) {
          return item.value;
        });
        return tagValues.indexOf(i.value) < 0;
      });
    }

    function getSelectedFiles(files){
      var selectedFiles = [];
      if ($stateParams.companyId) {
        var placeholder = 0;
        placeholder = 0;
        //placeholder code here to do angular.copy and return selected objects array.
      } else {
        //if in demo mode then get selected files from local datastore
        var fileNames = files.map(function(i){
          return i.name;
        });
        selectedFiles = localData.getFiles().filter(function(i){
          return fileNames.indexOf(i.name) > -1;
        });
      }
      return selectedFiles;
    }

    function takeItemFromOneArrayToAnother(item, removeToArray, addToArray){
      var status = "";
      if(typeof addToArray === "undefined" || removeToArray === "undefined"){
        status = "error: did not have one of the arrays defined";
        return status;
      }
      //get index
      var mapValuesAvailable = removeToArray.map(function(i) {
        return i.value;
      });
      var index = mapValuesAvailable.indexOf(item.value);

      //remove from available array
      if (index > -1){
        removeToArray.splice(index, 1);
      } else {
        status = "item not found in removeArray";
        return status;
      }

      addToArray.push(item);
      status = "sucessful";
      return status;
    }

    function transformAvailableTags(items) {
      var configTags = {};
      var lookupTags = [];
      for ( var i = 0; i < items.length; i++ ){
        if(typeof items[i].values !== "undefined") {
          for (var x = 0; x < items[i].values.length; x++) {
            var addAvailableLookup = {};
            addAvailableLookup.name = items[i].name;
            addAvailableLookup.value = items[i].values[x];
            lookupTags.push(addAvailableLookup);
          }
        }
      }
      configTags.lookupTags = lookupTags;
      return configTags;
    }

    function unionTagGroups(items) {
      var tagGroups = {};
      var lookupTags = [];
      var freeformTags = [];
      var uniqueLookupValues = [];
      var uniqueFreeformValues = [];

      for ( var i = 0; i < items.length; i++ ) {
        if(typeof items[i].tags !== "undefined") {
          for (var x = 0; x < items[i].tags.length; x++) {
            if(items[i].tags[x].type === "Lookup"){
              for (var y = 0; y < items[i].tags[x].values.length; ++y) {
                var addLookup = {};
                addLookup.name = items[i].tags[x].name;
                addLookup.value = items[i].tags[x].values[y];
                if(uniqueLookupValues.length < 1 || uniqueLookupValues.indexOf(addLookup.name + addLookup.value) === -1){
                  uniqueLookupValues.push(addLookup.name + addLookup.value);
                  lookupTags.push(addLookup);
                }
              }
            }
            if(items[i].tags[x].type === "Freeform"){
              var addFreeform = {};
              addFreeform.name = items[i].tags[x].name;
              addFreeform.value = items[i].tags[x].value;
              if(uniqueFreeformValues.length < 1 || uniqueFreeformValues.lastIndexOf(addFreeform.name) === -1){
                uniqueFreeformValues.push(addFreeform.name);
                freeformTags.push(addFreeform);
              }
            }
          }
        }
      }
      tagGroups.lookupTags = lookupTags;
      tagGroups.freeformTags = freeformTags;
      return tagGroups;
    }
  }]);

