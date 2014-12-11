"use strict";
angular.module("medialibrary")
.factory("UploadURIService", ["$q", "GAPIRequestService", "OAuthStatusService", "$stateParams", "$interpolate", "$translate",
function uploadURIService ($q, gapiRequestor, OAuthService, $stateParams, $interpolate, $translate) {
  var svc = {};

  var uriFailed = "storage-client.upload-uri-request-failed";
  var uriFailedMail = "storage-client.upload-uri-request-failed-mail";
  var inactiveSubscription = "storage-client.upload-inactive-subscription";
  var verifyCompany = "storage-client.upload-verify-company";

  $translate([uriFailed, uriFailedMail, inactiveSubscription, verifyCompany], { email: "{{email}}" }).then(function(values) {
    uriFailed = values[uriFailed];
    uriFailedMail = $interpolate(values[uriFailedMail]);
    inactiveSubscription = $interpolate(values[inactiveSubscription]);
    verifyCompany = $interpolate(values[verifyCompany]);
  });

  svc.getURI = function getURI(file) {
    if (!$stateParams.companyId || !file.name) {
      return $q.reject("Invalid Params");
    }

    return OAuthService.getAuthStatus()
    .then(function() {
      var gapiPath = "storage.getResumableUploadURI";
      var params = {"companyId": $stateParams.companyId,
                    "fileName": encodeURIComponent(file.name),
                    "fileType": file.type};
      return gapiRequestor.executeRequest(gapiPath,params);
    })
    .then(function(resp) {
      if (resp.result === false) {
        if(resp.message === "upload-inactive-subscription") {
          resp.message = inactiveSubscription({ email: resp.userEmail });
        }
        else if(resp.message === "upload-verify-company") {
          resp.message = verifyCompany({ email: resp.userEmail });
        }
        else {
          resp.message = resp.userEmail ? uriFailedMail({ email: resp.userEmail })
                                        : uriFailed;          
        }

        return $q.reject(resp.message);
      } else {
        return resp.message;
      }
    })
    .then(null, function(resp) {
      return $q.reject(resp || "An error ocurred attempting to begin an upload");
    });
  };

  return svc;
}]);
