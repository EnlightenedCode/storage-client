"use strict";
angular.module("gapi-file", ["gapi", "medialibraryServices","ui.router"])
.factory("FileListService", ["LocalFiles", "GAPIRequestService", "$stateParams",
function (LocalFiles, requestor, $stateParams) {
  var svc = {};
  svc.filesDetails = {files: []
                     ,localFiles: false
                     ,totalBytes: 0
                     ,checkedCount: 0
                     ,folderCheckedCount: 0
                     ,checkedItemsCount: 0};

  svc.statusDetails = {code: 200};

  svc.addFile = function(newFile) {
    var existingFileNameIndex;
    for (var i = 0, j = svc.filesDetails.files.length; i < j; i += 1) {
      if (svc.filesDetails.files[i].name === newFile.name) {
        existingFileNameIndex = i;
        break;
      }
    }

    if (existingFileNameIndex) {
      svc.filesDetails.files.splice(existingFileNameIndex, 1, newFile);
    } else {
      svc.filesDetails.files.push(newFile);
    }
  };

  svc.getFileNameIndex = function(fileName) {
    for (var i = 0, j = svc.filesDetails.files.length; i < j; i += 1) {
      if (svc.filesDetails.files[i].name === fileName) {
        return i;
      }
    }
    return -1;
  };

  svc.resetSelections = function() {
    svc.filesDetails.files.forEach(function(val) {
      val.isChecked = false;
    });
    
    svc.filesDetails.checkedCount = 0;
    svc.filesDetails.folderCheckedCount = 0;
    svc.filesDetails.checkedItemsCount = 0;
  };

  svc.removeFiles = function(files) {
    var oldFiles = svc.filesDetails.files;
    var removedSize = 0;

    for(var i = oldFiles.length - 1; i >= 0; i--) {
      if(files.indexOf(oldFiles[i]) >= 0) {
        removedSize += parseInt(oldFiles[i].size);
        oldFiles.splice(i, 1);
      }
    }

    svc.filesDetails.totalBytes -= removedSize;
  };

  svc.refreshFilesList = function () {
    var params = {companyId: $stateParams.companyId};
    if ($stateParams.folderPath) {
      params.folder = decodeURIComponent($stateParams.folderPath);
      svc.statusDetails.folder = params.folder;
    }
    else {
      svc.statusDetails.folder = "/";
    }

    svc.statusDetails.code = 202;

    if (!$stateParams.companyId) {
      svc.filesDetails.localFiles = true;
      return LocalFiles.query().$promise.then(function(resp) {
        return processFilesResponse({"files": resp, "code": 200});
      });
    }

    svc.filesDetails.localFiles = false;
    return requestor.executeRequest("storage.files.get", params)
    .then(function (resp) {
      return processFilesResponse(resp);
    });

    function processFilesResponse(resp) {
      var TRASH = "--TRASH--/";
      var parentFolder = decodeURIComponent($stateParams.folderPath);
      var parentFolderFound = false;

      resp.files = resp.files || [];

      if(parentFolder.indexOf(TRASH) === 0) {
        for(var i = 0; i < resp.files.length; i++) {
          var file = resp.files[i];

          if(file.name === parentFolder) {
            parentFolderFound = true;
            break;
          }
        }

        if(!parentFolderFound) {
          resp.files.unshift({ name: parentFolder, size: 0, updated: null });
        }          
      }

      svc.filesDetails.totalBytes = resp.files.reduce(function(prev, next) {
        return prev + parseInt(next.size);
      }, 0);

      console.log(svc.filesDetails.totalBytes + " bytes in " +
      resp.files.length + " files");
      
      svc.filesDetails.files = resp.files || [];
      svc.statusDetails.code = resp.code;

      if(!$stateParams.folderPath || !parentFolder || parentFolder === "/") {
        svc.filesDetails.files.splice(1, 0, { name: TRASH, size: 0, updated: null });
      }
        
      return resp;
    }
  };
  return svc;
}]);
