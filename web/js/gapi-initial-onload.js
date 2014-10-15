"use strict";
/* global handleClientJSLoad: false */
/* jshint unused: false */
function handleClientJSLoad() {
  console.log("Google JS client is loaded");
  angular.element(document).ready(function() {
    angular.element(document).injector()
    .invoke(["gapiClientService", "$window", "STORAGE_URL", "$q", "$log",
             "cookieTester", "CORE_URL","shareFolderListService", "$rootScope",
    function(gapiClient, $window, STORAGE_URL, $q, $log, cookieTester, CORE_URL, shareFolderListSvc, $rootScope) {
      return cookieTester.checkCookies()
             .then(function() {
               return loadStorageClient();
             })
             .then(function() {
                return gapiClient.fulfill($window.gapi.client);
              })
             .then(null, function() {console.log("Cookie check error");});

      function loadStorageClient() {
        var storageDefer = $q.defer();
        var coreDefer = $q.defer();
        var promises = [];

        promises.push(storageDefer.promise);
        promises.push(coreDefer.promise);
        $window.gapi.client.load("storage", "v0.01", function () {
          if ($window.gapi.client.storage) {
            $log.info("Storage API is loaded");
            storageDefer.resolve();
          } else {
            $log.error("Storage API is NOT loaded");
            storageDefer.reject();
          }
        }, STORAGE_URL);

        $window.gapi.client.load("core", "v0", function () {
          if ($window.gapi.client.core) {
            $log.info("Core API is loaded");
            coreDefer.resolve();
          } else {
            $log.error("Core API is NOT loaded");
            coreDefer.reject();
          }
        }, CORE_URL);



        return $q.all(promises).then(function(){ shareFolderListSvc.state.fullyLoaded = true;});
      }
    }]);
  });
}
angular.module("gapi", [])
.factory("gapiClientService", ["$q", function ($q) {
  var svc = {};
  var defer = $q.defer();
  svc.get= function () {
    return defer.promise;
  };
  svc.fulfill = function(gapiClient) {
    return defer.resolve(gapiClient);
  };
  return svc;
}]);
