"use strict";
angular.module("tagging", [])
.service("TaggingService", ["$modal", "$log", "$stateParams"
    , "$q", "localDatastore"
    , function($modal, $log, $stateParams, $q, localData){
    var svc = {};
    svc.configTags = {};
    svc.available = {};
    svc.selected = {};

    //unit tested
    svc.refreshLocalStore = function(){
      if (typeof localData.getFiles() === "undefined") {
        return localData.loadLocalData();
      }
      //if in demo local mode return immediately resolved promise
      var fake;
      fake = $q.defer();
      fake.resolve();
      return fake.promise;
    };

    //unit tested
    svc.clearAllLookupTags = function(){
      svc.available.lookupTags.push.apply(svc.available.lookupTags, svc.selected.lookupTags);
      svc.selected.lookupTags.splice(0, svc.selected.lookupTags.length);
    };

    //unit tested
    svc.clearAllLookupTagsAndSave = function(){
      svc.clearAllLookupTags();
      svc.tagGroups.lookupTags.splice(0, svc.tagGroups.lookupTags.length);
      svc.saveChangesToLookupTags();
    };

    //unit tested
    svc.addToSelectedLookupTag = function (tag){
      var status = "";
      status = takeItemFromOneArrayToAnother(tag, svc.available.lookupTags, svc.selected.lookupTags);
      return status;
    };

    //unit tested
    svc.removeFromSelectedLookupTag = function (tag){
      var status = "";
      status = takeItemFromOneArrayToAnother(tag, svc.selected.lookupTags, svc.available.lookupTags);
      return status;
    };

    //unit tested
    svc.saveChangesToLookupTags = function(){
      var namesOfFiles = svc.selected.files.map(function(i){
        return i.name;
      });
      if (!$stateParams.companyId) {
        localData.updateTags(namesOfFiles, "Lookup", svc.selected.lookupTags);
      }
    };

    svc.taggingButtonClick = function(items, command) {
      svc.refreshLocalStore().then(function() {
        setupTagModal(items, command);
      });
    };

    //unit tested
    svc.getFlattenedTagsConfigList = function(type) {
      var tags = localData.getTagConfigs();
      var res = [];

      for(var i = 0; i < tags.length; i++) {
        var tagDef = tags[i];

        if(tagDef.type === "Lookup" && type === "Lookup") {
          for(var j = 0; j < tagDef.values.length; j++) {
            res.push({ name: tagDef.name, value: tagDef.values[j] });
          }
        }
        if(tagDef.type === "Freeform" && type === "Freeform") {
            res.push({ name: tagDef.name});
        }
      }
      return res;
    };

    //unit tested
    svc.refreshSelection = function(items, command) {
        if(command === "union"){
          var selectedFiles = getSelectedFiles(items);
          svc.selected.files = selectedFiles;
          svc.command = command;
          svc.tagGroups = unionTagGroups(selectedFiles);
          svc.selected.lookupTags = angular.copy(svc.tagGroups.lookupTags);
        }
        svc.configTags = transformAvailableTags(localData.getTagConfigs());
        svc.available.lookupTags = getAvailableTags(svc.configTags.lookupTags, svc.tagGroups.lookupTags);
    };

    // Load localStore upon svc creation if in local
    if (!$stateParams.companyId) {
      svc.refreshLocalStore();
    }

    return svc;

    //Helper functions
    function setupTagModal(items, command){
      svc.selectedItems = items;
      svc.refreshSelection(items, command);
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
            return svc.selected.lookupTags;
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

    function transformAvailableTags() {
      var configTags = {};
      configTags.lookupTags = svc.getFlattenedTagsConfigList("Lookup");
      configTags.freeformTags = svc.getFlattenedTagsConfigList("Freeform");
      return configTags;
    }
    function mapNameToArray(array){
      return array.map(function(i){
        return i.name;
      });
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
              if(uniqueFreeformValues.length < 1 || uniqueFreeformValues.indexOf(addFreeform.name) === -1){
                uniqueFreeformValues.push(addFreeform.name);
                freeformTags.push(addFreeform);
              } else if(uniqueFreeformValues.indexOf(addFreeform.name) > -1) {
                var namesOfFreeforms = mapNameToArray(freeformTags);
                var changeIdx = namesOfFreeforms.indexOf(addFreeform.name);
                if(freeformTags[changeIdx].value !== addFreeform.value) {
                  freeformTags[changeIdx].value = freeformTags[changeIdx].value + ", " + addFreeform.value;
                }
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

