"use strict";

angular.module("medialibraryServices", ["ngResource", "risevision.common.config"]).
factory("MediaFiles", ["$resource", function($resource) {
  return $resource("/getFiles?companyId=:companyId", {}, {
    query: {method:"GET", params:{companyId:""}, isArray:false},
    remove: {method:"POST", params:{companyId:""}, isArray:false}
  });
}]).
factory("LocalFiles", ["$resource", "STAGE_STANDALONE_DEMO", "$location", function($resource, STAGE_STANDALONE_DEMO, $location) {
    if($location.absUrl().substring(0, STAGE_STANDALONE_DEMO.length) === STAGE_STANDALONE_DEMO) {
      return $resource("/~rvi/storage-client-stage1/files/files.json", {}, {
        query: {method: "GET", params: {}, isArray: true}
      });
    } else {
      return $resource("/files/files.json", {}, {
        query: {method:"GET", params:{}, isArray:true}
      });
    }
}]).
factory("LocalTagsConfigFiles", ["$resource", "STAGE_STANDALONE_DEMO", "$location", function($resource, STAGE_STANDALONE_DEMO, $location) {
    if($location.absUrl().substring(0, STAGE_STANDALONE_DEMO.length) === STAGE_STANDALONE_DEMO) {
      return $resource("/~rvi/storage-client-stage1/files/tags-config.json", {}, {
        query: {method: "GET", params: {}, isArray: true}
      });
    } else {
      return $resource("/files/tags-config.json", {}, {
        query: {method:"GET", params:{}, isArray:true}
      });
    }
}])
;
