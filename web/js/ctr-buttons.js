"use strict";

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
}
])
.controller("NewFolderCtrl", ["$scope","$modalInstance", "FileListService",
function($scope, $modalInstance, listSvc) {
    $scope.duplicateFolderSpecified = false;
    $scope.ok = function() {
        if (!$scope.folderName) {$scope.folderName = "";}
        $scope.folderName = $scope.folderName.replace(/\//g,"");
        if (listSvc.getFileNameIndex($scope.folderName + "/") > -1) {
          $scope.duplicateFolderSpecified = true;
          return;
        }
        $modalInstance.close($scope.folderName);
    };
    $scope.cancel = function() {
        $modalInstance.dismiss("cancel");
    };
}
])
.controller("ButtonsController",
["$scope", "$stateParams", "$window","$modal", "$log", "$timeout", "$filter", "FileListService",
"GAPIRequestService", "STORAGE_API_URL", "DownloadService", "$q", "$translate", "$state", "STORAGE_CLIENT_API", "FULLSCREEN", "TaggingService",
function ($scope, $stateParams, $window, $modal, $log, $timeout, $filter, listSvc, requestSvc,
          STORAGE_API_URL, downloadSvc, $q, $translate, $state, STORAGE_CLIENT_API, FULLSCREEN, taggingSvc) {
  $scope.storageModal = ($window.location.href.indexOf("storage-modal.html") > -1);
  var bucketName = "risemedialibrary-" + $stateParams.companyId;
  var bucketUrl = STORAGE_API_URL + bucketName + "/";
  var folderSelfLinkUrl = STORAGE_CLIENT_API + bucketName + "/o?prefix=";

  $scope.storageModal = ($window.location.href.indexOf("storage-modal.html") > -1);
  $scope.storageFull = FULLSCREEN;
  $scope.showCloseButton = !$scope.storageFull;

  $scope.filesDetails = listSvc.filesDetails;
  $scope.fileListStatus = listSvc.statusDetails;
  $scope.statusDetails = { code: 200, message: "" };
  $scope.isPOCollapsed = true;
  $scope.pendingOperations = [];
  $scope.leavePageMessage = "";

  $translate("storage-client.pending-ops-leave-page").then(function(value) {
    $scope.leavePageMessage = value;
  });

  $window.addEventListener("beforeunload", function(e) {
    if(getActivePendingOperations().length > 0) {
      (e || window.event).returnValue = $scope.leavePageMessage;

      return $scope.leavePageMessage;
    }
  });

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

  $scope.deleteButtonClick = function(size) {
    $scope.confirmDeleteFilesAction(size);
  };

  $scope.trashButtonClick = function() {
    $scope.processFilesAction("trash");
  };

  $scope.restoreButtonClick = function() {
    $scope.processFilesAction("restore");
  };

  $scope.removePendingOperation = function(file) {
    var position = $scope.pendingOperations.indexOf(file);

    if(position >= 0) {
      $scope.pendingOperations.splice(position, 1);      
    }
  };

  $scope.selectButtonClick = function() {
    var fileUrls = [], data = {};
    data.params = [];
    getSelectedFiles().forEach(function(file) {
      var copyUrl = file.kind === "folder" ? folderSelfLinkUrl + encodeURIComponent(file.name) : bucketUrl + "o/" + encodeURIComponent(file.name) + "?&alt=media";
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
        var copyUrl = copyFile.kind === "folder" ? folderSelfLinkUrl + encodeURIComponent(copyFile.name) : bucketUrl + "o/" + encodeURIComponent(copyFile.name) + "?&alt=media";
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
    var selectedFiles = getSelectedFiles();
    var selectedFileNames = selectedFiles.map(function(file) {
        return file.name;
    });

    selectedFiles.forEach(function(file) {
      file.action = action;

      $scope.pendingOperations.push(file);
    });

    listSvc.removeFiles(selectedFiles);
    listSvc.resetSelections();
    $scope.isPOCollapsed = true;

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
          if (!resp.result) {
            $scope.statusDetails.code = resp.code;
            
            $translate("storage-client." + resp.message, { email: resp.userEmail }).then(function(msg) {
              $scope.statusDetails.message = msg;
            });

            selectedFiles.forEach(function(file) {
              file.actionFailed = true;

              $scope.filesDetails.files.push(file);
            });

            listSvc.resetSelections();
          }
          else {
            // Removed completed pending operations
            for(var i = $scope.pendingOperations.length - 1; i >= 0; i--) {
              var file = $scope.pendingOperations[i];

              if(selectedFiles.indexOf(file) >= 0) {
                $scope.pendingOperations.splice(i, 1);
              }
            }
          }

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
          if (newFolderName === "") {return;}
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

  $scope.taggingButtonClick = taggingSvc.taggingButtonClick;

  function getActivePendingOperations() {
    var ops = $scope.pendingOperations;
    var activeOps = [];

    for(var i = 0; i < ops.length; i++) {
      if(!ops[i].failed) {
        activeOps.push(ops[i]);
      }
    }

    return activeOps;
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
