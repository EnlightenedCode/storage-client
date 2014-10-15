"use strict";
/* global gadgets: true */

angular.module("medialibrary")
.controller("ModalWindowController", ["$scope", function($scope) {
  $scope.closeButtonClick = function() {
    gadgets.rpc.call("", "rscmd_closeSettings", null);
  };
}])
.controller("CopyUrlCtrl", ["$scope","$modalInstance", "copyFile", function($scope, $modalInstance, copyFile) {

  $scope.copyFile = copyFile;

  $scope.ok = function() {
    $modalInstance.close();
  };
  $scope.cancel = function() {
    $modalInstance.dismiss("cancel");
  };
}
])
.controller("DeleteInstanceCtrl", ["$scope", "$modalInstance", "confirmationMessage",
  function($scope, $modalInstance, confirmationMessage) {
    $scope.confirmationMessage = confirmationMessage;

    $scope.ok = function() {
        $modalInstance.close();
    };
    $scope.cancel = function() {
        $modalInstance.dismiss("cancel");
    };
}])
.controller("NewFolderCtrl", ["$scope","$modalInstance", function($scope, $modalInstance) {
    $scope.ok = function() {
        $modalInstance.close($scope.folderName);
    };
    $scope.cancel = function() {
        $modalInstance.dismiss("cancel");
    };
}])
.controller("FoldersCtrl", ["$scope","$modalInstance", "folders", "MEDIA_LIBRARY_URL", "$stateParams", "$state", "shareFolderListService"
		, function($scope, $modalInstance, folders,
    MEDIA_LIBRARY_URL, $stateParams, $state, shareFolderListSvc){

		$scope.loading = shareFolderListSvc.loading;
		$scope.selectedFolder = shareFolderListSvc.state;
		$scope.activeTab = "all";
		$scope.sharedWithFolders = shareFolderListSvc.sharedWithFolders;
		$scope.sharedFolders = shareFolderListSvc.sharedFolders;
		$scope.is = shareFolderListSvc.state;
		$scope.currentDecodedFolder = $stateParams.folderPath ?
			decodeURIComponent($stateParams.folderPath) : undefined;
		$scope.folders = folders;
		$scope.cancel = function() {
			$modalInstance.dismiss("cancel");
		};

    $scope.reset = function(){
      shareFolderListSvc.state.sharedFolderReset = "";
      $scope.selectedFolder = shareFolderListSvc.state;
    };
		$scope.changeSelectFolder = function(folder){
			$scope.selectedFolder = folder;
			shareFolderListSvc.state.sharedFolderReset = folder;
		};

		$scope.unlinkFolder = function(folder, idx){
			shareFolderListSvc.unlinkSharedFolder(folder.originCompanyId,$stateParams.companyId, folder.folderName)
				.then(function(){
					$scope.sharedWithFolders.splice(idx, 1);
				});
		};

		$scope.goToFolder = function(folderSelection){
			shareFolderListSvc.state.originCompanyId = $stateParams.companyId;
			$state.go("main.company-folders",
				{folderPath: folderSelection.folderName, companyId: folderSelection.originCompanyId});
			$modalInstance.dismiss("cancel");
		};



		$scope.setActiveTab = function(tabName){
			shareFolderListSvc.state.sharedFolderReset = "";
			$scope.selectedFolder = shareFolderListSvc.state;

			if(tabName === "shared"){
				if(!shareFolderListSvc.loading.forbidden) {
					shareFolderListSvc.getSharedFolders();
				}
			}
			if(tabName === "sharedWithMe"){

				if(!shareFolderListSvc.loading.forbidden) {
					shareFolderListSvc.getSharedWithFolders();
				}
			}
			$scope.activeTab = tabName;
		};

		$scope.tabIsActive = function(tabName){
			return $scope.activeTab === tabName;
		};

		$scope.fileIsCurrentFolder = function(file) {
			return file.name === $scope.currentDecodedFolder;
		};

		$scope.fileIsFolder = function(file) {
			return file.name.substr(-1) === "/";
		};

		$scope.$on("FolderSelectAction", function(event, folder) {
			if (!$scope.fileIsCurrentFolder(folder)) {
				var folderPath =  (!folder.fullPath) ? "" : folder.fullPath;
				$state.go("main.company-folders",
					{folderPath: folderPath, companyId: $stateParams.companyId});
			}
			$modalInstance.dismiss("cancel");
		});
}])

.controller("ShareCtrl", ["$scope","$modalInstance","shareFolderListService", "$stateParams", function($scope, $modalInstance, shareFolderListSvc, $stateParams){

	$scope.showShareView = true;
	$scope.showEditView = false;
	$scope.selectedSubCompanies = [];
	$scope.setAllEdit = true;
	$scope.subCompanies = shareFolderListSvc.subCompanies;
	$scope.loading = shareFolderListSvc.loading;
  $scope.state = shareFolderListSvc.state;

	$scope.setSelected = function(subCompany){
		$scope.allSelected = false;
		if(removeSubCompanyArrayItem($scope.selectedSubCompanies, subCompany.id) > 0){
			$scope.clickedOnce = false;
		} else {
			$scope.clickedOnce = true;
			$scope.selectedSubCompanies.push({companyId: subCompany.id, name: subCompany.name, edit: true});
		}
		$scope.allSelected =false;
	};

	$scope.setAllSelected = function(){
		$scope.allSelected = ($scope.allSelected) ? false : true;
		$scope.selectedSubCompanies= [];
	};

	$scope.isSelected = function(subCompany){
		return findSubCompanyArrayItem($scope.selectedSubCompanies, subCompany.id)|| $scope.allSelected;
	};

  $scope.unlinkSelectedFolders = function(){

    if($scope.selectedSubCompanies.length > 0){
      for(var i = 0; i < $scope.selectedSubCompanies.length; i++){
        shareFolderListSvc.unlinkSharedFolder($stateParams.companyId,
          $scope.selectedSubCompanies[i].companyId,
          $stateParams.folderPath);
      }
      $scope.selectedSubCompanies = [];
    }
    else {
      for(var z = 0; z < shareFolderListSvc.subCompanies.items.length; z++) {
        shareFolderListSvc.unlinkSharedFolder($stateParams.companyId,
          shareFolderListSvc.subCompanies.items[z].id,
          $stateParams.folderPath);
      }
    }
    shareFolderListSvc.state.deleteStatus = true;
  };

	$scope.updateShareFolders = function(){
    if(!shareFolderListSvc.state.deleteStatus){
      if($scope.selectedSubCompanies.length > 0){
        for(var i = 0; i < $scope.selectedSubCompanies.length; i++){
          shareFolderListSvc.addShareLink($stateParams.companyId,
            $scope.selectedSubCompanies[i].companyId,
            $stateParams.folderPath,
            $scope.selectedSubCompanies[i].edit);
        }
      }
      else {
        for(var z = 0; z < shareFolderListSvc.subCompanies.items.length; z++) {
          shareFolderListSvc.addShareLink($stateParams.companyId,
            shareFolderListSvc.subCompanies.items[z].id,
            $stateParams.folderPath,
            $scope.setAllEdit);
        }
      }
    }

		shareFolderListSvc.getSharedFolders();
		$modalInstance.close();
	};

	$scope.cancel = function() {
		$modalInstance.dismiss("cancel");
	};

	//helper functions that work in all browsers
	function removeSubCompanyArrayItem(arr, item) {
		var removeCounter = 0;

		for (var index = 0; index < arr.length; index++) {
			if (item && arr[index].companyId === item) {
				arr.splice(index, 1);
				removeCounter++;
				index--;
			}
		}
		return removeCounter;
	}

	function findSubCompanyArrayItem(arr, item) {
		var findCounter = 0;

		for (var index = 0; index < arr.length; index++) {
			if (item && arr[index].companyId === item) {
				findCounter++;
			}
		}
		return findCounter;
	}


}])
.controller("ButtonsController",
["$scope", "$stateParams", "$window","$modal", "$log", "$timeout", "$filter", "FileListService", "shareFolderListService",
"GAPIRequestService", "MEDIA_LIBRARY_URL", "DownloadService", "$q", "$translate", "$state",
function ($scope, $stateParams, $window, $modal, $log, $timeout, $filter, listSvc, shareFolderListSvc, requestSvc,
          STORAGE_API_URL, downloadSvc, $q, $translate, $state) {
  $scope.currentDecodedFolder = $stateParams.folderPath ?
      decodeURIComponent($stateParams.folderPath) : undefined;

  $scope.currentFolder =  (!$stateParams.folderPath) ? "Folders" : cleanCurrentFolderName($stateParams.folderPath);
  $scope.storageModal = ($window.location.href.indexOf("storage-modal.html") > -1);
  var bucketName = "risemedialibrary-" + $stateParams.companyId;
  var bucketUrl = STORAGE_API_URL + bucketName + "/";

  $scope.storageModal = ($window.location.href.indexOf("storage-modal.html") > -1);
  $scope.storageFull = ($window.location.href.indexOf("storageFullscreen=true") > -1);
  $scope.showCloseButton = !$scope.storageFull;

  $scope.filesDetails = listSvc.filesDetails;
  $scope.fileListStatus = listSvc.statusDetails;
  $scope.statusDetails = { code: 200, message: "" };

  $scope.inSharedFolder = shareFolderListSvc.state;
  $scope.shareFolderSvc = shareFolderListSvc;

  $scope.isTrashFolder = function() {
    return $scope.fileListStatus.folder && $scope.fileListStatus.folder.indexOf("--TRASH--/") === 0;
  };

  $scope.showYourFiles = function() {
    $state.go("main.company-folders",
      { folderPath: "", companyId: $stateParams.companyId });
  };

  $scope.showTrash = function() {
    $state.go("main.company-folders",
      { folderPath: "--TRASH--/", companyId: $stateParams.companyId });
  };

  $scope.resetStatus = function() {
    $scope.statusDetails.code = 200;
  };

  $("#deleteForm").submit(function(event){
    // prevent default browser behaviour
    event.preventDefault();
    $scope.deleteButtonClick();
  });

  $scope.cancelButtonClick = function() {
    console.log("Cancel selected: Posting close message");
    $window.parent.postMessage("close", "*");
  };

  $scope.uploadButtonClick = function() {
    $("#file").click();
  };

  $scope.downloadButtonClick = function() {
    listSvc.filesDetails.files.forEach(function(file) {
      if (file.name.substr(-1) === "/") {file.isChecked = false;}
    });
    downloadSvc.downloadFiles(getSelectedFiles(), bucketName, 100);
  };

	$scope.foldersClick = function(size){
		shareFolderListSvc.CheckAccess();

		$scope.shouldBeOpen = true;
		var modalInstance = $modal.open({
			templateUrl: "foldersModal.html",
			controller: "FoldersCtrl",
			size: size,
			resolve: {
				folders: function(){
					return {name: "", children: shareFolderListSvc.folderDetails.folders};
				}
			}
		});
		modalInstance.result.then(function(){
			//do what you need if user presses ok
		}, function (){
			// do what you need to do if user cancels
			shareFolderListSvc.sharedFolderReset = "";
			$log.info("Modal dismissed at: " + new Date());
			$scope.shouldBeOpen = false;
		});
	};

	$scope.shareFolderClick = function(size){
		if(!shareFolderListSvc.loading.forbidden) {
			shareFolderListSvc.getSubCompanies();
		}

    shareFolderListSvc.state.deleteStatus = false;
		$scope.shouldBeOpen = true;
		var modalInstance = $modal.open({
			templateUrl: "shareModal.html",
			controller: "ShareCtrl",
			size: size
		});

		modalInstance.result.then(function(){
			//do what you need if user presses ok
		}, function (){
			// do what you need to do if user cancels
			$log.info("Modal dismissed at: " + new Date());
			$scope.shouldBeOpen = false;
		});
	};

  $scope.deleteButtonClick = function(size) {
    $scope.confirmDeleteFilesAction(size);
  };

  $scope.trashButtonClick = function() {
    $scope.processFilesAction("trash");
  };

  $scope.restoreButtonClick = function() {
    $scope.processFilesAction("restore");
  };

  $scope.selectButtonClick = function() {
    var fileUrls = [], data = {};
    data.params = [];
    getSelectedFiles().forEach(function(file) {
      var copyUrl = encodeURI((file.kind === "folder") ? file.selfLink : bucketUrl + "o/" + file.name + "?&alt=media");
      fileUrls.push(copyUrl);
      data.params.push(copyUrl);
    });
    $window.parent.postMessage(fileUrls, "*");
    gadgets.rpc.call("", "rscmd_saveSettings", null, data);
  };

  $scope.copyUrlButtonClick = function(size) {
    var copyFile = getSelectedFiles()[0];

    var modalInstance = $modal.open({
      templateUrl: "copyUrl.html",
      controller: "CopyUrlCtrl",
      size: size,
      resolve: {
        copyFile: function(){
          return copyFile;
        }

      }
    });

    modalInstance.opened.then(function(){
      setTimeout(function() {
        var copyUrl = encodeURI((copyFile.kind === "folder") ? copyFile.selfLink : bucketUrl + "o/" + copyFile.name + "?&alt=media");
        $("#copyUrlInput").val(copyUrl);
        $("#copyUrlInput").focus(function() { $(this).select(); } );
        $("#copyUrlInput").focus();
      },0);
    });

    modalInstance.result.then(function(){
      //do what you need if user presses ok
    }, function (){
      // do what you need to do if user cancels
      $log.info("Modal dismissed at: " + new Date());
      //$scope.shouldBeOpen = false;
    });
  };

  $scope.newFolderButtonClick = function(size) {
      $scope.shouldBeOpen = true;

      var modalInstance = $modal.open({
          templateUrl: "newFolderModal.html",
          controller: "NewFolderCtrl",
          size: size
      });
      modalInstance.result.then(function(newFolderName){
          //do what you need if user presses ok
          if (!newFolderName || newFolderName.indexOf("/") > -1) {return;}
          var requestParams =
          {"companyId":$stateParams.companyId
              ,"folder": decodeURIComponent($stateParams.folderPath || "") +
              newFolderName};

          requestSvc.executeRequest("storage.createFolder", requestParams)
              .then(function() {listSvc.refreshFilesList();});
      }, function (){
          // do what you need to do if user cancels
          $log.info("Modal dismissed at: " + new Date());
      });
  };

  $scope.$on("$stateChangeSuccess", function(){
      $scope.currentFolder =  (!$stateParams.folderPath) ? "Folders" : cleanCurrentFolderName($stateParams.folderPath);
  });

  $scope.confirmDeleteFilesAction = function() {
      $scope.shouldBeOpen = true;
      var selectedFileNames = getSelectedFiles().map(function(file) {
          return file.name;
      });
      var filesSelected = false;
      var foldersSelected = false;
      var message;

      selectedFileNames.forEach(function(val) {
        if (val.substr(-1) === "/") {
          foldersSelected = true;
        }
        else {
          filesSelected = true;
        }
      });

      if(filesSelected && foldersSelected) {
        message = "delete-files-folders";
      }
      else if(foldersSelected) {
        message = "delete-folders";
      }
      else {
        message = "delete-files";
      }

      message = "storage-client." + message + "-" + (selectedFileNames.length === 1 ? "singular" : "plural");

      $translate(message, { count: selectedFileNames.length }).then(function(confirmationMessage) {
        $scope.modalInstance = $modal.open({
            templateUrl: "deleteModal.html",
            controller: "DeleteInstanceCtrl",
            windowClass: "modal-custom",
            resolve: {
                confirmationMessage: function() {
                  return confirmationMessage;
                }
            }
        });

        $scope.modalInstance.result.then(function() {
          // do what you need if user presses ok
          $scope.processFilesAction("delete");
        }, function () {
          // do what you need to do if user cancels
          $log.info("Modal dismissed at: " + new Date());
          $scope.shouldBeOpen = false;
        });
      });
  };

  $scope.processFilesAction = function(action) {
    var selectedFileNames = getSelectedFiles().map(function(file) {
        return file.name;
    });

    var apiMethod = "storage.files.delete";

    if(action === "trash") {
      apiMethod = "storage.trash.move";
    }
    else if(action === "restore") {
      apiMethod = "storage.trash.restore";
    }

    var requestParams = { "companyId": $stateParams.companyId, "files": selectedFileNames };

    requestSvc.executeRequest(apiMethod, requestParams)
      .then(function(resp) {
          if (resp.code === 403) {
            $scope.statusDetails.code = resp.code;
            $translate("storage-client.permission-refused", { email: resp.userEmail }).then(function(msg) {
              $scope.statusDetails.message = msg;
            });
          }
          else { //if (resp.code === 200) {
            $scope.fileListStatus.latestAction = action;

            $timeout(function() {
              $scope.fileListStatus.latestAction = "";
            }, 3000);
          }

          listSvc.resetSelections();
          listSvc.refreshFilesList();

          $scope.shouldBeOpen = false;
      });
  };

  $scope.newFolderButtonClick = function(size) {
      $scope.shouldBeOpen = true;

      $scope.modalInstance = $modal.open({
          templateUrl: "newFolderModal.html",
          controller: "NewFolderCtrl",
          size: size
      });

      $scope.modalInstance.result.then(function(newFolderName){
          //do what you need if user presses ok
          if (!newFolderName || newFolderName.indexOf("/") > -1) {return;}
          var requestParams =
          {"companyId":$stateParams.companyId
              ,"folder": decodeURIComponent($stateParams.folderPath || "") +
              newFolderName};

          requestSvc.executeRequest("storage.createFolder", requestParams)
              .then(function() {listSvc.refreshFilesList();});
      }, function (){
          // do what you need to do if user cancels
          $log.info("Modal dismissed at: " + new Date());
      });
  };

  function getSelectedFiles() {
    var selectedFiles = [];

    for ( var i = 0; i < $scope.filesDetails.files.length; ++i ) {
      if ($scope.filesDetails.files[ i ].isChecked) {
        selectedFiles.push($scope.filesDetails.files[i]);
      }
    }
    return selectedFiles;
  }
}])
.directive("focusMe", function($timeout) {
    return {
        scope: { trigger: "@focusMe" },
        link: function(scope, element) {
            scope.$watch("trigger", function() {
                    $timeout(function() {
                        element[0].focus();
                    });
            });
        }
    };
});

function cleanCurrentFolderName(path) {
	var pathWithoutLastSlash = (path) ? path.substr(0, path.length -1) : path;
	var cleanFolderName = (path) ? path.substr(pathWithoutLastSlash.lastIndexOf("/") + 1).replace("/", "") : "";
	return cleanFolderName;
}