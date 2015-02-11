"use strict";
angular.module("tagging")
.controller("TaggingCtrl", ["$scope","$modalInstance", "TaggingService", "$filter", "$q",
    "FileListService", "localDatastore",
    function($scope, $modalInstance, taggingSvc, $filter, $q, listSvc, localData) {

  $scope.timelineTagCount =  function(){
    var timelineCount = 0;
    $scope.selectedFiles.forEach(function(i){
      var timelineFound = i.tags.filter(function(i2){
        return i2.type === "TIMELINE";
      });
      timelineCount += timelineFound.length;
    });

    return timelineCount;
  };
  $scope.selectedFiles = taggingSvc.selected.files;
  $scope.noTimeline = false;
  $scope.tagGroups = taggingSvc.tagGroups;
  $scope.availableLookupTags = taggingSvc.available.lookupTags;
  $scope.selectedLookupTags = taggingSvc.selected.lookupTags;
  $scope.selectedFreeformTags = taggingSvc.selected.freeformTags;
  $scope.showMainTagView = true;
  $scope.waitForResponse = false;
  $scope.clearLookupDisable = taggingSvc.tagGroups.lookupTags.length === 0;
  $scope.clearFreeformDisable = taggingSvc.tagGroups.freeformTags.length === 0;
  $scope.justAddedTimeline = true;
  $scope.clearTimelineDisable = (!taggingSvc.justAddedTimeline) && taggingSvc.tagGroups.timelineTag === null && !($scope.selectedFiles.length > 1 &&
  ($scope.tagGroups.timelineTag === undefined ||
  $scope.tagGroups.timelineTag === null) && $scope.noTimeline === false && $scope.timelineTagCount() > 0);
  $scope.showLookupEditView = false;
  $scope.showFreeformEditView = false;
  $scope.showTimelineEditView = false;
  $scope.clearTimeline = function(){
    $scope.selectedTimeline = {
      duration: 60,
      pud: "false",
      trash: "false",
      carryon: "false",
      startDate: null,
      endDate: null,
      startTime: null,
      endTime: null,
      setTime: "true",
      setDate: "true",
      timelineRecurrence: "false"
    };
  };
  $scope.loadExistingTimeline = function(){
    $scope.timelineTagObj = {
      duration: taggingSvc.tagGroups.timelineTag.values[0].duration,
      pud: taggingSvc.tagGroups.timelineTag.values[0].pud,
      trash: taggingSvc.tagGroups.timelineTag.values[0].trash,
      carryon: taggingSvc.tagGroups.timelineTag.values[0].carryon,
      startDate: taggingSvc.tagDateStringToDate(taggingSvc.tagGroups.timelineTag.values[0].startDate),
      endDate: taggingSvc.tagDateStringToDate(taggingSvc.tagGroups.timelineTag.values[0].endDate),
      startTime: taggingSvc.tagTimeStringToDate(taggingSvc.tagGroups.timelineTag.values[0].startTime),
      endTime: taggingSvc.tagTimeStringToDate(taggingSvc.tagGroups.timelineTag.values[0].endTime),
      setTime: (taggingSvc.tagTimeStringToDate(taggingSvc.tagGroups.timelineTag.values[0].startTime) === null) ? "true" : "false",
      setDate: (taggingSvc.tagDateStringToDate(taggingSvc.tagGroups.timelineTag.values[0].startDate) === null) ? "true" : "false",
      timelineRecurrence: (taggingSvc.tagGroups.timelineTag.values[0].recurrenceOptions === undefined || taggingSvc.tagGroups.timelineTag.values[0].recurrenceOptions === null ||
      taggingSvc.tagGroups.timelineTag.values[0].recurrenceOptions === "null") ? "false" : "true"
    };
    if (taggingSvc.tagGroups.timelineTag.values[0].recurrenceOptions !== undefined &&
      taggingSvc.tagGroups.timelineTag.values[0].recurrenceOptions !== null &&
      taggingSvc.tagGroups.timelineTag.values[0].recurrenceOptions !== "null") {
      $scope.timelineTagObj.recurrenceType = taggingSvc.tagGroups.timelineTag.values[0].recurrenceOptions.recurrenceType;
      $scope.timelineTagObj.recurrenceAbsolute = taggingSvc.tagGroups.timelineTag.values[0].recurrenceOptions.recurrenceAbsolute;
      $scope.timelineTagObj.recurrenceFrequency = taggingSvc.tagGroups.timelineTag.values[0].recurrenceOptions.recurrenceFrequency;
      $scope.timelineTagObj.recurrenceDayOfMonth = taggingSvc.tagGroups.timelineTag.values[0].recurrenceOptions.recurrenceDayOfMonth;
      $scope.timelineTagObj.recurrenceWeekOfMonth = taggingSvc.tagGroups.timelineTag.values[0].recurrenceOptions.recurrenceWeekOfMonth;
      $scope.timelineTagObj.recurrenceDayOfWeek = taggingSvc.tagGroups.timelineTag.values[0].recurrenceOptions.recurrenceDayOfWeek;
      $scope.timelineTagObj.recurrenceMonthOfYear = taggingSvc.tagGroups.timelineTag.values[0].recurrenceOptions.recurrenceMonthOfYear;
      $scope.timelineTagObj.daySelection  = taggingSvc.tagGroups.timelineTag.values[0].recurrenceOptions.recurrenceDaysOfWeek;
    }
  };




  $scope.minDate = new Date();

  if(taggingSvc.selected.timelineTag === undefined || taggingSvc.selected.timelineTag === null){
    $scope.clearTimeline();
  } else {
    $scope.loadExistingTimeline();
  }

  $scope.names = ["Daily", "Weekly", "Monthly", "Yearly"];
  $scope.durations = [{text: "Seconds", value: "false" }, {text:"Play Until Done", value: "true"}];

  $scope.optionsWeek = taggingSvc.options.week;
  $scope.optionsDay = taggingSvc.options.day;
  $scope.optionsMonth = taggingSvc.options.month;

  $scope.defaultRecurrence = function(){
    $scope.selectedTimeline.recurrenceType = "daily";
    $scope.selectedTimeline.recurrenceFrequency = 1;
    $scope.selectedTimeline.recurrenceAbsolute = "true";
    $scope.selectedTimeline.recurrenceDayOfMonth = 1;
    $scope.selectedTimeline.recurrenceWeekOfMonth = 0;
    $scope.selectedTimeline.recurrenceDayOfWeek = 0;
    $scope.selectedTimeline.recurrenceMonthOfYear = 0;
  };

  $scope.switchPUD = function(){
    $scope.selectedTimeline.pud = ($scope.selectedTimeline.pud === "true") ? "false" : "true";
  };
  $scope.resetRecurrences = function(name){
    $scope.selectedTimeline.recurrenceType = name;
    $scope.selectedTimeline.daySelection = [];
  };

  $scope.initDates = function() {
    if($scope.selectedTimeline.startDate === undefined || $scope.selectedTimeline.startDate === null){
      $scope.selectedTimeline.startDate = new Date();
    } else {
      $scope.selectedTimeline.startDate = null;
      $scope.selectedTimeline.endDate = null;
    }
  };

  $scope.initTimes = function() {
    if($scope.selectedTimeline.startTime === undefined || $scope.selectedTimeline.startTime === null){
      var startT = new Date();
      var endT = new Date();
      startT.setHours(8);
      startT.setMinutes(0);
      endT.setHours(20);
      endT.setMinutes(0);
      $scope.selectedTimeline.startTime = startT;
      $scope.selectedTimeline.endTime = endT;
    } else {
      $scope.selectedTimeline.startTime = null;
      $scope.selectedTimeline.endTime = null;
    }
  };

  $scope.toggleSelection = function(dayName){
    var idx = $scope.selectedTimeline.daySelection.indexOf(dayName.toLowerCase().substring(0,3));

    //is currently selected
    if(idx > -1){
      $scope.selectedTimeline.daySelection.splice(idx,1);
    }

    //is newly selected
    else{
      $scope.selectedTimeline.daySelection.push(dayName.toLowerCase().substring(0,3));
    }
  };

  $scope.openDatePicker = function($event,opened) {
    $event.preventDefault();
    $event.stopPropagation();
    $scope[opened] = true;
  };

  $scope.dateOptions = {
    formatYear: "yy",
    formatMonth: "MMM",
    startingDay: 1,
    showWeeks:"false"
  };

  $scope.dateFormat = "dd-MMM-yyyy";

  $scope.hstep = 1;
  $scope.mstep = 15;


  $scope.ismeridian = true;
  $scope.toggleMode = function() {
    $scope.ismeridian = ! $scope.ismeridian;
  };


  $scope.addToSelectedLookupTag = function(tag){
    taggingSvc.addToSelectedLookupTag(tag);

    changedLookupAndValidate();
  };
  $scope.removeFromSelectedLookupTag = function(tag){

    taggingSvc.removeFromSelectedLookupTag(tag);

    changedLookupAndValidate();
  };

  $scope.refreshMainList = function(){
    var promise = $q.defer();

    listSvc.refreshFilesList().then(function(){
      localData.loadLocalData().then(function() {
        promise.resolve();
      });
    });

    return promise.promise;
  };

  $scope.saveChangesFromView =function(){
    $scope.waitForResponse = true;
    var defer = $q.defer();
    if($scope.showLookupEditView){
      taggingSvc.saveChangesToTags(taggingSvc.selected.lookupTags, "LOOKUP").then(function(){
        defer.resolve();
      });
    }
    if($scope.showFreeformEditView){
      taggingSvc.saveChangesToTags($scope.selectedFreeformTags, "FREEFORM").then(function(){
        defer.resolve();
      });
    }
    if($scope.showTimelineEditView){
      taggingSvc.transformTimelineForSaving($scope.selectedTimeline);
      taggingSvc.saveChangesToTags(taggingSvc.selected.timelineTag, "TIMELINE").then(function(){
        $scope.timelineTagObj = angular.copy($scope.selectedTimeline);
        defer.resolve();
      });

    }
    defer.promise.then(function(){
      $scope.refreshMainList().then(function(){
        taggingSvc.justAddedTimeline = true;
        $scope.clearTimelineDisable = (!taggingSvc.justAddedTimeline) && taggingSvc.tagGroups.timelineTag === null && !($scope.selectedFiles.length > 1 &&
        ($scope.tagGroups.timelineTag === undefined ||
        $scope.tagGroups.timelineTag === null) && $scope.noTimeline === false && $scope.timelineTagCount() > 0);
        $scope.resetView();
      });


    });
  };

  $scope.refreshChanges = function(){
    var fileNames = $scope.selectedFiles.map(function(i){
      return i.name;
    });
    var filesWithTags = localData.getFilesWithTags().filter(function(i){
      return fileNames.indexOf(i.name) > -1;
    });
      taggingSvc.refreshSelection (filesWithTags, taggingSvc.command);

      $scope.tagGroups = taggingSvc.tagGroups;
      $scope.availableLookupTags = taggingSvc.available.lookupTags;
      $scope.selectedFreeformTags = taggingSvc.selected.freeformTags;
  };

  $scope.clearAllInvalidLookupTags = function(){
    taggingSvc.clearAllInvalidLookupTags();
    changedLookupAndValidate();
  };

  $scope.clearAllLookupTags = function(){
    $scope.clearLookupDisable = true;
    if($scope.showMainTagView){
      taggingSvc.selected.lookupTags = [];
      taggingSvc.clearAllLookupTagsAndSave().then(function(){
        $scope.refreshMainList();
      });
    } else {
      taggingSvc.clearAllLookupTags();
      $scope.changedLookup = taggingSvc.tagGroups.lookupTags.length === taggingSvc.selected.lookupTags.length &&
      taggingSvc.tagGroups.lookupTags.every(function(v,i){ return v.name === taggingSvc.selected.lookupTags[i].name &&
        v.value === taggingSvc.selected.lookupTags[i].value;});
    }
  };

  $scope.lookupOnEnter = function(keyCode, list, tagQuery){
    if(keyCode === 13 && $scope.showLookupEditView){
      var filteredList = list.filter(function(i){
        var combinedString = i.name + i.value;
        return combinedString.indexOf(tagQuery) > -1;
      });

      if(filteredList.length === 1){
        var maplist = list.map(function(i){
          return i.name + i.value;
        });

        var index = maplist.indexOf(filteredList[0].name + filteredList[0].value);
        taggingSvc.addToSelectedLookupTag(list[index]);
        $scope.saveChangesFromView();
      }
    }
  };

  $scope.freeformOnEnter = function(keyCode){
    if(keyCode === 13 && $scope.showFreeformEditView){
      $scope.saveChangesFromView();
    }
  };

  $scope.clearAllFreeFormTags = function(){
    $scope.clearFreeformDisable = true;
    if($scope.showMainTagView){
      taggingSvc.clearAllFreeformTagsAndSave().then(function(){
        $scope.refreshMainList();
      });
    } else {
      taggingSvc.clearAllFreeformTags();
    }
  };

  $scope.clearAllTimelineTags = function(){
    $scope.clearTimelineDisable = true;
    $scope.noTimeline = true;
    if($scope.showMainTagView){
      taggingSvc.clearAllTimelineTagsAndSave().then(function(){
        $scope.refreshMainList();
      });
      $scope.refreshChanges();
    }
  };

  $scope.editLookup = function(){
    $scope.waitForResponse = false;
    taggingSvc.selected.lookupTags.forEach(function(i){
      if(localData.availableNameValuePairs().indexOf(i.name + i.value) === -1){
        $scope.invalidLookupTag = true;
      }
    });
    $scope.changedLookup = taggingSvc.tagGroups.lookupTags.length === taggingSvc.selected.lookupTags.length &&
    taggingSvc.tagGroups.lookupTags.every(function(v,i){ return v.name === taggingSvc.selected.lookupTags[i].name &&
      v.value === taggingSvc.selected.lookupTags[i].value;});

    $scope.selectedLookupTags = taggingSvc.selected.lookupTags;
    $scope.showMainTagView = false;
    $scope.showLookupEditView = true;
  };

  $scope.editTimeline = function(){
    $scope.waitForResponse = false;
    if(taggingSvc.tagGroups.timelineTag === undefined || taggingSvc.tagGroups.timelineTag === null){
      $scope.clearTimeline();
    } else{
      $scope.selectedTimeline = angular.copy($scope.timelineTagObj);
    }
    $scope.showMainTagView = false;
    $scope.showTimelineEditView = true;
  };

  $scope.editFreeform = function(){
    $scope.waitForResponse = false;
    $scope.showMainTagView = false;
    $scope.showFreeformEditView = true;
  };

  $scope.resetView = function(){
    $scope.waitForResponse = false;
    $scope.tagQuery = null;
    $scope.refreshChanges();
    $scope.showMainTagView = true;
    $scope.showLookupEditView = false;
    $scope.showFreeformEditView = false;
    $scope.showTimelineEditView = false;
    $scope.clearLookupDisable = taggingSvc.tagGroups.lookupTags.length === 0;
    $scope.clearFreeformDisable = taggingSvc.tagGroups.freeformTags.length === 0;
  };

  $scope.ok = function() {
    $modalInstance.close();
  };

  $scope.cancel = function() {
    $scope.resetView();
    $modalInstance.dismiss("cancel");
  };

  function changedLookupAndValidate(){
    taggingSvc.tagGroups.lookupTags.sort(function(a, b){
      if (a.name > b.name) {
        return 1;
      }
      if (a.name < b.name) {
        return -1;
      }
      // a must be equal to b
      return 0;
    });

    taggingSvc.selected.lookupTags.sort(function(a, b){
      if (a.name > b.name) {
        return 1;
      }
      if (a.name < b.name) {
        return -1;
      }
      // a must be equal to b
      return 0;
    });

    $scope.changedLookup = taggingSvc.tagGroups.lookupTags.length === taggingSvc.selected.lookupTags.length &&
    taggingSvc.tagGroups.lookupTags.every(function(v,i){ return v.name === taggingSvc.selected.lookupTags[i].name &&
      v.value === taggingSvc.selected.lookupTags[i].value;});
    $scope.invalidLookupTag = taggingSvc.selected.lookupTags.some(function(i){
      return localData.availableNameValuePairs().indexOf(i.name + i.value) === -1;
    });
  }
}])
.controller("FilterLookupCtrl", ["$scope", "TaggingService", "$modalInstance","available", "selected",
    function($scope, taggingSvc, $modalInstance, available, selected){
  taggingSvc.available.lookupTags = available;
  taggingSvc.selected.lookupTags = selected;
  $scope.availableLookupTags = taggingSvc.available.lookupTags;
  $scope.selectedLookupTags = taggingSvc.selected.lookupTags;
  $scope.addToSelectedLookupTag = function(tag){
    taggingSvc.addToSelectedLookupTag(tag);
  };
  $scope.removeFromSelectedLookupTag = function(tag){
    taggingSvc.removeFromSelectedLookupTag(tag);
  };

  $scope.applyFilter = function(){
    taggingSvc.filteredTags = angular.copy($scope.selectedLookupTags);
    $modalInstance.close();
  };

  $scope.cancel = function() {
    $modalInstance.dismiss("cancel");
  };

  $scope.clearAllLookupTags = function(){
    taggingSvc.clearAllLookupTags();
  };

}])
.controller("TagsFilterCtrl", ["$scope", "TaggingService", "FileListService", "$modal",
    function($scope, taggingSvc, listSvc, $modal) {
  $scope.displayFilters = false;
  $scope.isCollapsed = true;
  $scope.selectedTags = [];
  $scope.filteredTags = taggingSvc.filteredTags;

  $scope.openModal = function(){
      taggingSvc.refreshConfigTags();
    $scope.showLookupEditView = true;
      var availableTags = taggingSvc.getAvailableLookupTags(taggingSvc.configTags.lookupTags, $scope.selectedTags);
      var modalInstance = $modal.open({

        templateUrl: "partials/tagging/filter-modal.html",
        controller: "FilterLookupCtrl",
        resolve:  {
          available: function(){
            return availableTags;
          },
          selected: function(){
            return $scope.selectedTags;
          }
        }
      });

      modalInstance.result.then(function(){
        //do what you need if user presses ok
        $scope.filteredTags = taggingSvc.filteredTags;
      }, function (){
        // do what you need to do if user cancels
      });
  };

  $scope.toggleDialog = function() {
    $scope.displayFilters = !$scope.displayFilters;
  };

  $scope.filterDate = function(date, type){

    if(type === "start"){
      taggingSvc.filterStartDate = date;
    }
    if(type === "end"){
      taggingSvc.filterEndDate = date;
    }
  };

  $scope.filterStartDate = null;
  $scope.filterEndDate = null;
  $scope.openDatePicker = function($event,opened) {
    $event.preventDefault();
    $event.stopPropagation();
    $scope[opened] = true;
  };

  $scope.dateOptions = {
    formatYear: "yy",
    formatMonth: "MMM",
    startingDay: 1,
    showWeeks:"false"
  };

  $scope.dateFormat = "dd-MMM-yyyy";

  $scope.hstep = 1;
  $scope.mstep = 15;


  $scope.ismeridian = true;
  $scope.toggleMode = function() {
    $scope.ismeridian = ! $scope.ismeridian;
  };
}])
;
