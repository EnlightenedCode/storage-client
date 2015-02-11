"use strict";
angular.module("tagging", [])
.service("TaggingService", ["$modal", "$log", "$stateParams"
    , "$q", "localDatastore", "$filter", "GAPIRequestService"
    , function($modal, $log, $stateParams, $q, localData, $filter, requestor){
    var svc = {};
    svc.configTags = {};
    svc.available = {};
    svc.selected = {};
    svc.tagGroups = {lookupTags: [], freeformTags: []};
    svc.filteredTags = [];
    svc.filterStartDate = undefined;
    svc.filterEndDate = undefined;
    svc.justAddedTimeline = false;
      svc.options = {week:["First", "Second", "Third", "Fourth", "Last"],
    day: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]};

    //unit tested
    svc.refreshLocalStore = function(){
      //if in demo local mode return immediately resolved promise
      if($stateParams.companyId){
        return localData.loadLocalData();
      } else {
        if (typeof localData.getFilesWithTags() === "undefined" || localData.getFilesWithTags().length === 0) {
          return localData.loadLocalData();
        }
        var fake;
        fake = $q.defer();
        fake.resolve();
        return fake.promise;
      }
    };

    //unit tested
    svc.clearAllLookupTags = function(){
      svc.available.lookupTags.push.apply(svc.available.lookupTags, svc.selected.lookupTags);
      svc.selected.lookupTags.splice(0, svc.selected.lookupTags.length);
    };

    //unit tested
    svc.clearAllInvalidLookupTags = function(){
      var noInvalidArray = angular.copy(svc.selected.lookupTags);
      var invalids = [];
      svc.selected.lookupTags.forEach(function(i, pos){
        if(i.invalid){
          invalids.push(i);
          noInvalidArray.splice(pos, 1);
        }
      });
      svc.available.lookupTags.push.apply(svc.available.lookupTags, invalids);
      svc.selected.lookupTags.splice(0, svc.selected.lookupTags.length);
      svc.selected.lookupTags.push.apply(svc.selected.lookupTags, noInvalidArray);
    };

    //unit tested
    svc.clearAllLookupTagsAndSave = function(){
      var namesOfFiles = svc.selected.files.map(function(i){
        return i.name;
      });
      var deleteObjects = angular.copy(svc.tagGroups.lookupTags);
      deleteObjects.forEach(function(i){
        i.delete = true;
      });
      svc.tagGroups.lookupTags.splice(0, svc.tagGroups.lookupTags.length);
      return svc.updateLookupTags(namesOfFiles, deleteObjects, "LOOKUP");
    };

    //unit tested
    svc.clearAllTimelineTagsAndSave = function(){
      var namesOfFiles = svc.selected.files.map(function(i){
        return i.name;
      });

      return svc.clearTimeLineOnly(namesOfFiles , svc.tagGroups.timelineTag, "TIMELINE");
    };

    //unit tested
    svc.clearAllFreeformTags = function(){
      svc.selected.freeformTags.forEach(function(i){
        i.value = "";
      });
    };

    //unit tested
    svc.clearAllFreeformTagsAndSave = function(){
      svc.clearAllFreeformTags();
      return svc.saveChangesToTags(svc.selected.freeformTags, "FREEFORM").then(function(){
        svc.tagGroups.freeformTags.splice(0, svc.tagGroups.freeformTags.length);
      });
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
    svc.saveChangesToTags = function(selectedItems, type){
      var namesOfFiles = svc.selected.files.map(function(i){
        return i.name;
      });
      if(type === "FREEFORM"){
        return svc.updateFreeformTags(namesOfFiles, selectedItems, type).then(function(){
          selectedItems = cleanEmptyFreeformTags(selectedItems);
          localData.updateTags(namesOfFiles, type, selectedItems);
        });
      }
      if(type === "LOOKUP"){
        return svc.updateLookupTags(namesOfFiles, selectedItems, type).then(function(){
          selectedItems = (selectedItems === null) ? [] : selectedItems;
          localData.updateTags(namesOfFiles, type, selectedItems);
        });
      }
      if(type === "TIMELINE"){
        return svc.updateTimelineTag(namesOfFiles, selectedItems, type).then(function(resp){
          resp.forEach(function(i){
            localData.updateTimelineTag(i);
          });
        });
      }
      if (!$stateParams.companyId) {
        selectedItems = (selectedItems === null) ? [] : selectedItems;
        localData.updateTags(namesOfFiles, type, selectedItems);
      }
      var fake;
      fake = $q.defer();
      fake.resolve();
      return fake.promise;
    };




    svc.clearTimeLineOnly = function(namesOfFiles, selectedItems, type) {
      var deletePromises = [];
      namesOfFiles.forEach(function (i, pos) {
          var haveTimelineTag = svc.selected.files[pos].tags.filter(function (i) {
            return i.type === type;
          });
          if (haveTimelineTag.length > 0) {
            var foundTagToDelete = svc.selected.files[pos].tags.filter(function (y) {
              return y.type === type;
            });
            if (foundTagToDelete.length > 0) {
              var params = {};
              params.id = foundTagToDelete[0].id;
              deletePromises.push(requestor.executeRequest("storage.filetag.delete", params));
            }
          }
      });

      //update locally
      svc.tagGroups.timelineTag = null;
      svc.selected.timelineTag = null;
//    ========

      localData.clearSelectedTimelines(namesOfFiles);
      return $q.all(deletePromises);
    };

    svc.updateTimelineTag = function(namesOfFiles, selectedItems) {
      var promises = [];

      namesOfFiles.forEach(function(objectId) {
        var params = {
          companyId: $stateParams.companyId,
          objectId: objectId,
          tags: [],
          timeline: JSON.stringify(selectedItems[0])
        };
        
        promises.push(requestor.executeRequest("storage.storageobject.put", params));
      });

      return $q.all(promises);
    };

    svc.updateFreeformTags = function(namesOfFiles, selectedItems) {
      var promises = [];
      var tags = selectedItems.map(function(tag) {
        return {
          name: tag.name, value: tag.value, type: "FREEFORM"
        };
      });

      namesOfFiles.forEach(function(objectId) {
        var params = {
          companyId: $stateParams.companyId,
          objectId: objectId,
          tags: tags,
          timeline: ""
        };
        
        promises.push(requestor.executeRequest("storage.storageobject.put", params));
      });

      return $q.all(promises);
    };

    svc.updateLookupTags = function(namesOfFiles, selectedItems) {
      var promises = [];
      var tags = selectedItems.map(function(tag) {
        return {
          name: tag.name, value: tag.value, type: "LOOKUP"
        };
      });

      namesOfFiles.forEach(function(objectId) {
        var params = {
          companyId: $stateParams.companyId,
          objectId: objectId,
          tags: tags,
          timeline: ""
        };
        
        promises.push(requestor.executeRequest("storage.storageobject.put", params));
      });

      return $q.all(promises);
    };

    // wait for server calls to make unit tests.
    svc.transformTimelineForSaving = function(timelineObj){
      svc.selected.timelineTag =
      {
        type: "TIMELINE",
        timeDefined: true,
        duration: timelineObj.duration,
        pud: timelineObj.pud,
        trash: timelineObj.trash,
        carryon: timelineObj.carryon
      };

      if(timelineObj.setDate === "false"){
        var startDateInData = (timelineObj.startDate) ? $filter("date")(timelineObj.startDate, "MM/dd/yy") + " 12:00 AM" : null;
        var endDateInData = (timelineObj.endDate) ? $filter("date")(timelineObj.endDate, "MM/dd/yy") + " 12:00 AM" : null;
        svc.selected.timelineTag.startDate = startDateInData;
        svc.selected.timelineTag.endDate = endDateInData;
      } else {
        svc.selected.timelineTag.startDate = null;
        svc.selected.timelineTag.endDate = null;
      }

      if(timelineObj.setTime === "false"){
        var startTimeInData = (timelineObj.startTime) ? $filter("date")(timelineObj.startTime, "h:mm a") : null;
        var endTimeInData = (timelineObj.endTime) ? $filter("date")(timelineObj.endTime, "h:mm a") : null;
        svc.selected.timelineTag.startTime = startTimeInData;
        svc.selected.timelineTag.endTime = endTimeInData;
      } else {
        svc.selected.timelineTag.startTime = null;
        svc.selected.timelineTag.endTime = null;
      }
      if(timelineObj.timelineRecurrence === "true"){
        svc.selected.timelineTag.recurrenceOptions = {
          recurrenceType: timelineObj.recurrenceType,
          recurrenceFrequency: timelineObj.recurrenceFrequency,
          recurrenceAbsolute: timelineObj.recurrenceAbsolute,
          recurrenceDayOfWeek: timelineObj.recurrenceDayOfWeek,
          recurrenceDayOfMonth: timelineObj.recurrenceDayOfMonth,
          recurrenceWeekOfMonth: timelineObj.recurrenceWeekOfMonth,
          recurrenceMonthOfYear: timelineObj.recurrenceMonthOfYear,
          recurrenceDaysOfWeek: timelineObj.daySelection
        };
      } else {
        svc.selected.timelineTag.recurrenceOptions = null;
      }
      svc.selected.timelineTag = [svc.selected.timelineTag];
    };

    svc.taggingButtonClick = function(items, command) {
      setupTagModal(items, command);
    };

    svc.refreshConfigTags = function(){
      svc.configTags = transformAvailableTags(localData.getTagConfigs());
    };

    //unit tested
    svc.getFlattenedTagsConfigList = function(type) {
      var tags = localData.getTagConfigs();
      var res = [];
      for(var i = 0; i < tags.length; i++) {
        var tagDef = tags[i];

        if(tagDef.type === "LOOKUP" && type === "LOOKUP") {
          for(var j = 0; j < tagDef.values.length; j++) {
            res.push({ name: tagDef.name, value: tagDef.values[j] });
          }
        }
        if(tagDef.type === "FREEFORM" && type === "FREEFORM") {
          res.push({ name: tagDef.name, id: tagDef.id});
        }
      }
      return res;
    };

    svc.getLookupTagSettings = function() {
      var lookupTags = localData.getTagConfigs().filter(function(i){
        return i.type === "LOOKUP";
      });
      return lookupTags;
    };

    svc.updateTagConfig = function(selectedTag, oldName){
      var deferred = $q.defer();
      var tagDefFound = localData.getTagDefs().filter(function(i){
        return i.id === selectedTag.id;
      });
      var params;
      if((oldName !== "" && oldName !== selectedTag.name) ||
        selectedTag.name === ""){
      params = {};

      params.id = tagDefFound[0].id;
      requestor.executeRequest("storage.tagdef.delete", params).then(function () {
        localData.refreshConfigTags().then(function(){
          deferred.resolve();
        });
      }, function(message){
        deferred.reject(message);
      });
      }

      if(selectedTag.name !== ""){
        params = {};
        params.companyId = $stateParams.companyId;
        params.name = selectedTag.name;
        params.type = selectedTag.type;
        if(selectedTag.type === "LOOKUP") {
          params.values = selectedTag.values;
        }
        requestor.executeRequest("storage.tagdef.put", params).then(function () {
          localData.refreshConfigTags().then(function(){
            deferred.resolve();
          });
        });
      }
      return deferred.promise;
    };

    //unit tested
    svc.tagDateStringToDate = function(dateString){
        if((dateString !== null && dateString !== "null")&& typeof dateString !== "undefined") {
          var year = parseInt("20" + dateString.substring(6, 8));
          var month = parseInt(dateString.substring(0, 2)) - 1;
          var day = parseInt(dateString.substring(3, 5));

          var convertedDate = new Date(year, month, day, 0, 0, 0, 0);
          return convertedDate;
        } else {
          return null;
        }
    };
    //unit tested
    svc.tagTimeStringToDate = function(timeString){
      if((timeString !== null && timeString !== "null") && typeof timeString !== "undefined") {
        var ampm = timeString.substring(timeString.length, timeString.length - 2);
        var hour = parseInt(timeString.substring(timeString.length, timeString.length - 8).substring(0, 2).replace(" ", ""));
        var hour24 = (ampm === "PM" && hour !== 12) ? hour + 12 : (hour === 12 && ampm === "AM") ? 0 : hour;
        var minute = parseInt(timeString.substring(timeString.length - 5, timeString.length - 3));
        var convertedDate = new Date();
        convertedDate.setHours(hour24);
        convertedDate.setMinutes(minute);
        convertedDate.setSeconds(0);
        return convertedDate;
      } else{
        return null;
      }
    };

    svc.getAvailableLookupTags = function(configTags, lookupTags){
        var tagValues = lookupTags.map(function(item) {
          return item.value;
        });
        return configTags.filter(function(i) {
          return tagValues.indexOf(i.value) < 0;
        });
    };

    //unit tested
    svc.filterFile = function(file){
      if((file.name === "--TRASH--/")){
        return true;
      }
      var timelineStartDate = true;
      var timelineEndDate = true;
      var lookupTag = true;

      if(svc.filteredTags !== undefined && svc.filteredTags.length > 0){
        var nameMatch = false;
        var valuesMatch = false;
        var valuesIndex = [];
        var fileValues = [];
        var nameIndex = svc.filteredTags.map(function(i){
          return i.name;
        });
        var uniqueNameIndex = nameIndex.filter(function(elem, pos){
          return nameIndex.indexOf(elem) === pos;
        });

        svc.filteredTags.forEach(function(i){
          valuesIndex.push(i.name + i.value);
        });

        //will need to call tag entries listing for server calls
        var fileLookupTags = file.tags.filter(function(i){
          return i.type === "LOOKUP";
        });
        fileLookupTags.forEach(function(i){
          i.values.forEach(function(elem){
            fileValues.push(i.name + elem);
          });
        });
        var fileTagNames = fileLookupTags.map(function(i){
          return i.name;
        });
        var uniqueFileTagNames = fileTagNames.filter(function(elem, pos){
          return fileTagNames.indexOf(elem) === pos;
        });

        nameMatch = uniqueNameIndex.every(function(i){
          return uniqueFileTagNames.indexOf(i) > -1;
        });

        valuesMatch = valuesIndex.some(function(i){
          return fileValues.indexOf(i) > -1;
        });
        lookupTag = nameMatch && valuesMatch;
      }
      var fileTimelineTag = file.tags.filter(function(i){
        return i.type === "TIMELINE";
      });

      var fileStartDate;
      var fileEndDate;

      if(svc.filterStartDate !== undefined && svc.filterStartDate !== null) {
        if(fileTimelineTag[0] === undefined || fileTimelineTag[0].length === 0){
          timelineStartDate = false;
          timelineEndDate = false;
        } else {
          fileStartDate = svc.tagDateStringToDate(JSON.parse(fileTimelineTag[0].values[0]).startDate);
          fileEndDate = svc.tagDateStringToDate(JSON.parse(fileTimelineTag[0].values[0]).endDate);
          if(fileStartDate === null && fileEndDate === null){
            timelineEndDate = false;
          } else {
            if(fileStartDate !== null){
              timelineStartDate = fileStartDate.getTime() >= svc.filterStartDate.getTime();

              if(svc.filterEndDate !== undefined && svc.filterEndDate !== null){
                timelineStartDate = timelineStartDate && (fileStartDate.getTime() <= svc.filterEndDate.getTime());
              } else{
                if(fileEndDate !== null){
                  timelineStartDate = fileEndDate.getTime() >= svc.filterStartDate.getTime();
                  timelineEndDate = fileEndDate.getTime() >= svc.filterStartDate.getTime();
                } else {
                  timelineEndDate = fileStartDate.getTime() >= svc.filterStartDate.getTime();
                }
              }
            }
          }
        }
      }

      if(svc.filterEndDate !== undefined && svc.filterEndDate !== null){
        if(fileTimelineTag[0] === undefined || fileTimelineTag[0].length === 0){
          timelineStartDate = false;
          timelineEndDate = false;
        } else {
          fileStartDate = svc.tagDateStringToDate(JSON.parse(fileTimelineTag[0].values[0]).startDate);
          fileEndDate = svc.tagDateStringToDate(JSON.parse(fileTimelineTag[0].values[0]).endDate);
          if(fileStartDate === null && fileEndDate === null){
            timelineEndDate = false;
          } else {
            if(fileEndDate !== null){
              timelineEndDate = fileEndDate.getTime() <= svc.filterEndDate.getTime();

              if(svc.filterStartDate !== undefined && svc.filterStartDate !== null){
                timelineEndDate = timelineEndDate && (fileEndDate.getTime() >= svc.filterStartDate.getTime());
              } else{
                if(fileStartDate !== null){
                  timelineEndDate = fileStartDate.getTime() <= svc.filterEndDate.getTime();
                  timelineStartDate = fileStartDate.getTime() <= svc.filterEndDate.getTime();
                }else {
                  timelineStartDate = fileEndDate.getTime() <= svc.filterEndDate.getTime();
                }
              }
            }
          }
        }
      }
      return lookupTag && (timelineStartDate || timelineEndDate);
    };

    //unit tested
      svc.refreshSelection = function(items, command) {
        if(command === "union"){
          //svc.selectedItems = items;
          var selectedFiles = getSelectedFiles(items);
          svc.selected.files = selectedFiles;
          svc.command = command;
          svc.tagGroups = unionTagGroups(selectedFiles);
          svc.selected.lookupTags = angular.copy(svc.tagGroups.lookupTags);
          svc.refreshConfigTags();
          svc.available.lookupTags = svc.getAvailableLookupTags(svc.configTags.lookupTags, svc.tagGroups.lookupTags);
          svc.selected.freeformTags = angular.copy(svc.tagGroups.freeformTags)
            .concat(getAvailableFreeformTags(angular.copy(svc.configTags.freeformTags),svc.tagGroups.freeformTags));
        }
      if(items.length === 1){
        svc.selected.timelineTag = angular.copy(svc.tagGroups.timelineTag);
      }
    };


    return svc;
    //Helper functions
    function cleanEmptyFreeformTags(freeformTags){
      return freeformTags.filter(function(i){
        return i.value !== "";
      });
    }

    function setupTagModal(items, command){
      svc.refreshSelection(items, command);
      svc.modalInstance = $modal.open({
        templateUrl: "Tagging.html",
        controller: "TaggingCtrl"
      });
      svc.modalInstance.result.then(function(){
        //do what you need if user presses ok
      }, function (){
        // do what you need to do if user cancels
        svc.justAddedTimeline = false;
        svc.selected.timelineTag = null;
        svc.timelineClear = false;
        //$log.info("Modal dismissed at: " + new Date());
      });
    }



    function getAvailableFreeformTags(configTags, freeformTags){
      var tagNames = freeformTags.map(function(item) {
        return item.name;
      });
      return configTags.filter(function(i) {

        return tagNames.indexOf(i.name) < 0;
      });
    }

      function getSelectedFiles(files){
        var selectedFiles = [];
        var fileNames = files.map(function(i){
          return i.name;
        });
        selectedFiles = localData.getFilesWithTags().filter(function(i){
          return fileNames.indexOf(i.name) > -1;
        });
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
      configTags.lookupTags = svc.getFlattenedTagsConfigList("LOOKUP");
      configTags.freeformTags = svc.getFlattenedTagsConfigList("FREEFORM");
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
        var timelineTag = null;
        var uniqueLookupValues = [];
        var uniqueFreeformValues = [];

        for ( var i = 0; i < items.length; i++ ) {
          if(typeof items[i].tags !== "undefined") {
            for (var x = 0; x < items[i].tags.length; x++) {
              if(items[i].tags[x].type === "LOOKUP"){
                for (var y = 0; y < items[i].tags[x].values.length; ++y) {
                  var addLookup = {};
                  addLookup.name = items[i].tags[x].name;
                  addLookup.value = items[i].tags[x].values[y];
                  if(uniqueLookupValues.length < 1 || uniqueLookupValues.indexOf(addLookup.name + addLookup.value) === -1){
                    addLookup.invalid = localData.availableNameValuePairs().indexOf(addLookup.name + addLookup.value) === -1;
                    uniqueLookupValues.push(addLookup.name + addLookup.value);
                    lookupTags.push(addLookup);
                  }
                }
              }
              if(items[i].tags[x].type === "FREEFORM"){
                var addFreeform = {};
                addFreeform.name = items[i].tags[x].name;
                addFreeform.value = items[i].tags[x].values[0];
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
              if(items[i].tags[x].type === "TIMELINE"){
                if(items[i].tags[x].values[0].timeDefined === undefined){
                items[i].tags[x].values[0] = JSON.parse(items[i].tags[x].values[0]);
                }
                timelineTag = items[i].tags[x];
              }
            }
          }
        }
        tagGroups.lookupTags = lookupTags;
        tagGroups.freeformTags = freeformTags;
        if((svc.selected.timelineTag !== undefined && svc.selected.timelineTag !== null) || items.length === 1 && timelineTag !== null){
          tagGroups.timelineTag = timelineTag;
        } else {
          tagGroups.timelineTag = null;
        }

        return tagGroups;
      }
  }]);

