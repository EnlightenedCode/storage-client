"use strict";

angular.module("medialibrary")
.controller("FileListCtrl",
["$scope", "$stateParams", "$modal", "$log", "$location", "FileListService",
"OAuthAuthorizationService", "GAPIRequestService", "OAuthStatusService",
"$window","STORAGE_FILE_URL", "STORAGE_CLIENT_API", "$state", "$translate",
  "FULLSCREEN","TaggingService","localDatastore",
function ($scope, $stateParams, $modal, $log, $location, listSvc,
OAuthAuthorizationService, requestSvc, OAuthStatusService,
$window, STORAGE_FILE_URL, STORAGE_CLIENT_API, $state, $translate, FULLSCREEN,
taggingSvc,  localData) {
  var bucketName = "risemedialibrary-" + $stateParams.companyId;
  var trashLabel;

  $scope.$location = $location;
  $scope.isAuthed = true;
  $scope.filesDetails = listSvc.filesDetails;
  $scope.statusDetails = listSvc.statusDetails;
  $scope.tagStatusDetails = localData.statusDetails;
  $scope.bucketCreationStatus = {code: 202};
  $scope.currentDecodedFolder = $stateParams.folderPath ? 
                                decodeURIComponent($stateParams.folderPath) : undefined;
  $scope.storageFull = FULLSCREEN;

  $translate("storage-client.trash").then(function(value) {
    trashLabel = value;
  });

  $scope.dateModifiedOrderFunction = function(file) {
    return file.updated ? file.updated.value : "";
  };

	$scope.isTrashFolder = function(){
		return $stateParams.folderPath === "--TRASH--/";
	};

  $scope.login = function() {
    OAuthAuthorizationService.authorize().then(function() {
      $scope.isAuthed = true;
      listSvc.refreshFilesList().then(function(){
        localData.loadLocalData();
      });
    })
    .then(null, function(errResult) {
      console.log(errResult);
    });
  };

  $scope.fileNameOrderFunction = function(file){
    return file.name.replace("--TRASH--/", trashLabel).toLowerCase();
  };

  $scope.orderByAttribute = $scope.fileNameOrderFunction;

  $scope.fileExtOrderFunction = function(file) {
    return file.name.substr(-1) === "/" ?
           "Folder" :
      (file.name.split(".").pop() === file.name) ? "" : file.name.split(".").pop();
  };

  $scope.fileSizeOrderFunction = function(file) {
    return Number(file.size);
  };

  OAuthStatusService.getAuthStatus().then(function() {
    $scope.isAuthed = true;
    listSvc.refreshFilesList().then(function(){
      localData.loadLocalData();
    });
  }, function() { $scope.isAuthed = false; });

  $scope.createBucket = function() {
    var gapiPath = "storage.createBucket";
    requestSvc.executeRequest(gapiPath, {"companyId": $stateParams.companyId})
    .then(function(resp) {
      $scope.bucketCreationStatus = resp;
      if (resp.code === 200) {
        $state.go($state.current, $stateParams, {reload: true});
      }
    });
  };
	
  $scope.fileCheckToggled = function(file) {
    if (file.name.substr(-1) !== "/") {
      $scope.filesDetails.checkedCount += file.isChecked ? 1 : -1;
    } else {
      $scope.filesDetails.folderCheckedCount += file.isChecked ? 1 : -1;
    }

    $scope.filesDetails.checkedItemsCount += file.isChecked ? 1 : -1;

  };

  $scope.selectAllCheckboxes = function() {
    $scope.filesDetails.checkedCount = 0;
    $scope.filesDetails.folderCheckedCount = 0;
    $scope.filesDetails.checkedItemsCount = 0;
    for ( var i = 0; i < $scope.filesDetails.files.length; ++i ) {
      if ($scope.fileIsCurrentFolder($scope.filesDetails.files[i]) || 
          $scope.fileIsTrash($scope.filesDetails.files[i])) {
        continue;
      }

      $scope.filesDetails.files[i].isChecked = $scope.selectAll;
      if ($scope.filesDetails.files[i].name.substr(-1) !== "/") {
        $scope.filesDetails.checkedCount += $scope.selectAll ? 1 : 0;
      } else {
        $scope.filesDetails.folderCheckedCount += $scope.selectAll ? 1 : 0;
      }

      $scope.filesDetails.checkedItemsCount += $scope.selectAll ? 1 : -1;
    }
  };

  $scope.fileIsCurrentFolder = function(file) {
    return file.name === $scope.currentDecodedFolder;
  };

  $scope.fileIsFolder = function(file) {
    return file.name.substr(-1) === "/";
  };

  $scope.fileHasTag = function(file){
    var fileTagEntriesNames = localData.getTagEntries().map(function(i){
      return i.objectId;
    });
    return fileTagEntriesNames.indexOf(file.name) > -1;
  };

  $scope.fileIsTrash = function(file) {
    return file.name === "--TRASH--/";
  };

  $scope.taggingButtonClick = function(item, command){
      $scope.selectAllCheckboxes();
      $scope.selectAllCheckboxes();
      if(item.isChecked === undefined || item.isChecked === false){
        item.isChecked = true;
        $scope.fileCheckToggled(item);
      }
      var items = [];
      items.push(item);
      //to remember checked files
      listSvc.taggingCheckedItems = [item.name];
      listSvc.checkedTagging = true;
      taggingSvc.taggingButtonClick(items, command);
  };

  $scope.filterTags = function(){
    if((taggingSvc.filteredTags === undefined || taggingSvc.filteredTags.length === 0) &&
    (taggingSvc.filterStartDate === undefined || taggingSvc.filterStartDate === null) &&
    (taggingSvc.filterEndDate === undefined || taggingSvc.filterEndDate === null)){
      return;
    }
    return function(file){
        var fileFromDataStore = localData.getFilesWithTags().filter(function(i){
          return i.name === file.name;
        })[0];
        return taggingSvc.filterFile(fileFromDataStore);
    };
  };

  $scope.$on("FileSelectAction", function(event, file) {
    listSvc.checkedTagging = false;
    var folderSelfLinkUrl = STORAGE_CLIENT_API + bucketName +"/o?prefix=";
    var fileUrl = file.kind === "folder" ? folderSelfLinkUrl + encodeURIComponent(file.name) :
        STORAGE_FILE_URL + bucketName + "/" + encodeURIComponent(file.name);
    var data = { params: fileUrl };

    if ($scope.fileIsFolder(file)) {
      listSvc.resetSelections();
      
      if ($scope.fileIsCurrentFolder(file)) {
        var folderPath = $scope.currentDecodedFolder.split("/");
        folderPath = folderPath.length > 2 ?
                     folderPath.slice(0, -2).join("/") + "/" : "";
        $state.go(folderPath ? "main.company-folders" : "main.company-root",
                  {folderPath: folderPath, companyId: $stateParams.companyId});
      } else {
        $state.go("main.company-folders",
                  {folderPath: file.name, companyId: $stateParams.companyId});
      }
    } else {
      $window.parent.postMessage([fileUrl], "*");
      gadgets.rpc.call("", "rscmd_saveSettings", null, data);
    }
  });

}]);
