"use strict";
angular.module("tagging", [])
.controller("TaggingCtrl", ["$scope","$modalInstance", function($scope, $modalInstance) {
  $scope.ok = function() {
    $modalInstance.close();
  };
  $scope.cancel = function() {
    $modalInstance.dismiss("cancel");
  };
}
])
.service("TaggingService", ["$modal", "$log",function($modal, $log){
    var svc = {};
    svc.taggingButtonClick = function(){
      svc.modalInstance = $modal.open({
        templateUrl: "Tagging.html",
        controller: "TaggingCtrl"
      });

      svc.modalInstance.result.then(function(){
        //do what you need if user presses ok
        console.log("ok");
      }, function (){
        // do what you need to do if user cancels
        $log.info("Modal dismissed at: " + new Date());
      });
    };

    return svc;
  }]);