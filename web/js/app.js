"use strict";
angular.module("medialibrary", [
  "risevision.common.config",
  "ui.router",
  "ui.bootstrap",
  "medialibraryFilters", 
  "medialibraryServices",
  "gapi-auth",
  "cookieTester",
  "gapi-folder",
  "gapi-file",
  "angularFileUpload",
  "multi-download",
  "risevision.widget.common.subscription-status",
  "risevision.common.i18n"
]);

angular.module("medialibrary")
.config(["$urlRouterProvider", "$stateProvider",
function($urlRouterProvider, $stateProvider) {
  $urlRouterProvider.otherwise("/files/local");
  $stateProvider
  .state("main", {
       url: "/files",
       templateUrl: "partials/main.html"
  })
  .state("main.local", {
       url: "/local",
       templateUrl: "partials/file-items.html"
  })
  .state("main.company-root", {
       url: "/:companyId",
       templateUrl: "partials/file-items.html"
  })
  .state("main.company-folders", {
       url: "/:companyId/*folderPath",
       templateUrl: "partials/file-items.html"
  });
}]);
