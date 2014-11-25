"use strict";
/* global gadgets: true */
/*global _:false */

angular.module("medialibrary")
.controller("FileListCtrl",
["$scope", "$stateParams", "$modal", "$log", "$location", "FileListService","shareFolderListService",
"OAuthAuthorizationService", "GAPIRequestService", "OAuthStatusService",
"$window","STORAGE_API_URL", "$state", "$translate",
function ($scope, $stateParams, $modal, $log, $location, listSvc, shareFolderListSvc,
OAuthAuthorizationService, requestSvc, OAuthStatusService,
$window, STORAGE_API_URL, $state, $translate) {
  var bucketName = "risemedialibrary-" + $stateParams.companyId;
  var bucketUrl = STORAGE_API_URL + bucketName + "/";
  var trashLabel;

  $scope.$location = $location;
  $scope.isAuthed = true;
  $scope.filesDetails = listSvc.filesDetails;
  $scope.statusDetails = listSvc.statusDetails;
  $scope.bucketCreationStatus = {code: 202};
  $scope.currentDecodedFolder = $stateParams.folderPath ?
                                decodeURIComponent($stateParams.folderPath) : undefined;
  $scope.shareFolderSvc = shareFolderListSvc;

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
	    shareFolderListSvc.resetLoading();
	    afterRefresh().then(function() {
		    if(shareFolderListSvc.state.sharedFolderViewOnly !== "") {
			    shareFolderListSvc.state.sharedFolderViewOnly = (shareFolderListSvc.state.originCompanyId !== $stateParams.companyId);
		    }
		    if(shareFolderListSvc.state.sharedFolderViewOnly) {
			    // if in share root delete the previous folder object
			    if(shareFolderListSvc.state.sharedRootFolder === $scope.currentDecodedFolder){
				    listSvc.filesDetails.files = _.without(listSvc.filesDetails.files, _.findWhere(listSvc.filesDetails.files, {name: $scope.currentDecodedFolder}));
			    }
		    }
		    shareFolderListSvc.CheckAccess();
	    });
    })
    .then(null, function(errResult) {
      console.log(errResult);
    });
  };

  $scope.fileNameOrderFunction = function(file) {
    return file.name.replace("--TRASH--/", trashLabel).toLowerCase();
  };

  $scope.orderByAttribute = $scope.fileNameOrderFunction;

  $scope.fileExtOrderFunction = function(file) {
    return file.name.substr(-1) === "/" ?
           "Folder" :
           file.name.split(".").pop();
  };

  $scope.fileSizeOrderFunction = function(file) {
    return Number(file.size);
  };

  OAuthStatusService.getAuthStatus().then(function() {
    $scope.isAuthed = true;
    if(shareFolderListSvc.state.originCompanyId === ""){
      afterRefresh().then(function(){
        shareFolderListSvc.CheckAccess().then(function () {
          shareFolderListSvc.resetLoading();
          if (shareFolderListSvc.state.sharedFolderViewOnly === true) {
            // if in share root delete the previous folder object
            if (shareFolderListSvc.state.sharedRootFolder === $scope.currentDecodedFolder) {
              listSvc.filesDetails.files = _.without(listSvc.filesDetails.files, _.findWhere(listSvc.filesDetails.files, {name: $scope.currentDecodedFolder}));
            }
          }
        });
      });
    } else{
      afterRefresh().then(function(){
        if (!shareFolderListSvc.access) {
          // if in share root delete the previous folder object
          if (shareFolderListSvc.state.sharedRootFolder === $scope.currentDecodedFolder) {
            listSvc.filesDetails.files = _.without(listSvc.filesDetails.files, _.findWhere(listSvc.filesDetails.files, {name: $scope.currentDecodedFolder}));
          }
        }
      });

    }
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

  $scope.fileIsTrash = function(file) {
    return file.name === "--TRASH--/";
  };

  $scope.fileIsImage = function(file) {
      var ext = file.name.substr(-4).toLowerCase();
      if(ext === ".png" || ext === ".gif" || ext === ".tif" || ext === ".psd"){
          return true;
      }
      ext = file.name.substr(-5).toLowerCase();
      if(ext === ".jpeg" || ext === ".tiff" || ext === ".tif"){
          return true;
      }
      return false;
  };

  $scope.$on("$stateChangeStart", function(e, toState, toParams){
    if(shareFolderListSvc.sharedWithFolders.items){
      var foundCompany = shareFolderListSvc.sharedWithFolders.items.filter(function(e){
        return e.originCompanyId === toParams.companyId;
      });
      if(foundCompany.length > 0){
        if(!foundCompany.edit){
          shareFolderListSvc.access = false;
        }
        shareFolderListSvc.state.sharedRootFolder = foundCompany[0].folderName;
      }
    }

    if(toParams.companyId === shareFolderListSvc.state.originCompanyId || shareFolderListSvc.state.originCompanyId === "" ){
      shareFolderListSvc.access = true;
    }
  });

  $scope.$on("FileSelectAction", function(event, file) {
    var fileUrl = encodeURI((file.kind === "folder") ? file.selfLink : bucketUrl + "o/" + file.name + "?&alt=media");
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
  function afterRefresh(){
    var promises = [];

    promises.push(listSvc.refreshFilesList());
    promises.push(shareFolderListSvc.refreshFoldersList());

    return $q.all(promises);
  }

}]);
