"use strict";
angular.module("tagging", [])
.controller("TaggingCtrl", ["$scope","$modalInstance", "tagGroups", function($scope, $modalInstance, tagGroups) {

  $scope.tagGroups = tagGroups;

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
    svc.taggingButtonClick = function(items, command){
      var tagGroups = {};
      if(command === "union" || command === "copy"){
        tagGroups = unionTagGroups(items);
      }

      svc.modalInstance = $modal.open({
        templateUrl: "Tagging.html",
        controller: "TaggingCtrl",
        resolve: {
          tagGroups: function () {
            return tagGroups;
          }
        }
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

    //Helper functions
    function unionTagGroups(items) {
      var tagGroups = {};
      var lookupTags = [];
      var freeformTags = [];
      var uniqueLookupValues = [];
      var uniqueFreeformValues = [];

      for ( var i = 0; i < items.length; ++i ) {
        if(typeof items[i].tags !== "undefined") {
          for (var x = 0; x < items[i].tags.length; ++x) {
            if(items[i].tags[x].type === "Lookup"){
              for (var y = 0; y < items[i].tags[x].values.length; ++y) {
                var addLookup = {};
                addLookup.name = items[i].tags[x].name;
                addLookup.value = items[i].tags[x].values[y];
                if(uniqueLookupValues.length < 1 || uniqueLookupValues.lastIndexOf(addLookup.name + addLookup.value) === -1){
                  uniqueLookupValues.push(addLookup.name + addLookup.value);
                  lookupTags.push(addLookup);
                }
              }
            }
            if(items[i].tags[x].type === "Freeform"){
              var addFreeform = {};
              addFreeform.name = items[i].tags[x].name;
              addFreeform.value = items[i].tags[x].value;
              if(uniqueFreeformValues.length < 1 || uniqueFreeformValues.lastIndexOf(addFreeform.name + addFreeform.value) === -1){
                uniqueFreeformValues.push(addFreeform.name + addFreeform.value);
                freeformTags.push(addFreeform);
              }
            }
          }
        }
      }

      tagGroups.lookupTags = lookupTags;
      tagGroups.freeformTags = freeformTags;
      return tagGroups;
    }

  }]);

