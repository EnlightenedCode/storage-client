"use strict";
/* global _: true */
angular.module("gapi-folder", ["gapi", "medialibraryServices","ui.router"])
  .factory("shareFolderListService", ["GAPIRequestService", "$stateParams",
    function (requestor, $stateParams) {

      var svc = {};
      svc.folderDetails = {folders: []
        ,localFolders: false
        ,totalBytes: 0
        ,empty: true};
      svc.subCompanies = {items:[]};
      svc.statusDetails = {code: 0};
      svc.sharedFolders = {items: [], code: 0};
      svc.sharedWithFolders = {items: [], code: 0};
      svc.userCompany = {};
      svc.state = {fullyLoaded: false,
        sharedFolderViewOnly: false,
        sharedRootFolder: "",
        originCompanyId: "",
        noSharedFolders: false,
        noSharedWithFolders: false,
        sharedFolderReset: "",
        deleteStatus: false};
      svc.loading = { completed: false, status: "Loading...",forbidden: false, accessDenied: true};

      svc.refreshFoldersList = function(){
        var params = {companyId: $stateParams.companyId};
        return requestor.executeRequest("storage.folders.get", params)
          .then(function (resp) {
            svc.folderDetails.folders = listToTree(resp.folders);
            svc.folderDetails.empty = false;
            svc.statusDetails.code = resp.code;
            return resp;
          });
      };

      svc.resetLoading = function(){
        svc.loading.forbidden = false;
        svc.loading.status = "Loading";
        svc.loading.completed = false;
      };

      svc.CheckAccess = function(){
        return svc.getSubCompanies();
      };

      svc.getSubCompanies = function(){
        var params = {companyId: $stateParams.companyId};
        return requestor.executeRequest("core.company.list", params)
          .then(function (resp){
            svc.access = true;
            svc.subCompanies.items = resp.items;
            svc.statusDetails.code = resp.code;
            svc.loading.accessDenied = false;
            svc.loading.completed = true;
            svc.state.sharedFolderViewOnly = false;
            svc.state.originCompanyId = "";
            return resp;
          }, function(){
            svc.loading.forbidden = true;
            svc.loading.accessDenied = true;
            svc.loading.status = "Access Denied";
            svc.loading.completed = true;
            svc.state.sharedFolderViewOnly = true;
          });
      };

      svc.getSharedFolders = function(){
        var params = {companyId: $stateParams.companyId};
        return requestor.executeRequest("storage.shareFolder.getSharedFolders", params)
          .then(function(getSharedResp){
            return svc.getSubCompanies().then(function(){
              svc.sharedFolders.items = sharedToTree(getSharedResp.sharedFolders, svc.subCompanies);
              svc.sharedFolders.code = getSharedResp.code;
              svc.state.noSharedFolders = (!svc.sharedFolders) ? true : svc.sharedFolders.items.length < 1;
              svc.loading.completed = true;
              return getSharedResp;
            }, function(){
              svc.loading.forbidden = true;
              svc.loading.status = "Access Denied";
              svc.loading.completed = true;
            });
          });
      };

      svc.getSharedWithFolders = function(){
        var params = {sharedCompanyId: $stateParams.companyId};
        return requestor.executeRequest("storage.shareFolder.getSharedFolders", params)
          .then(function(resp) {
            svc.sharedWithFolders.items = resp.sharedFolders;
            svc.sharedWithFolders.code = resp.code;
            svc.state.noSharedWithFolders = (!svc.sharedWithFolders.items) ? true : svc.sharedWithFolders.items.length < 1;
            svc.loading.completed = true;
            return resp;
          }, function(){
            svc.loading.forbidden = true;
            svc.loading.status = "Access Denied";
            svc.loading.completed = true;
          });
      };


      svc.addShareLink = function(originCompanyId, sharedWithCompanyId, folder, edit){
        var params = {companyId: originCompanyId, sharedCompanyId: sharedWithCompanyId, edit: edit, folder: folder};
        return requestor.executeRequest("storage.shareFolder.add", params)
          .then(function (resp){
            svc.statusDetails.code = resp.code;
            return resp;
          });
      };

      svc.unlinkSharedFolder = function(originCompanyId, companyIdToUnlink, folder){
        var params ={companyId: originCompanyId, sharedCompanyId: companyIdToUnlink, folder: folder};
        return requestor.executeRequest("storage.shareFolder.unlink", params)
          .then(function (resp){
            svc.statusDetails.code = resp.code;
            return resp;
          });
      };


      return svc;

    }]);

function sharedToTree(list, subCompanies){
  var folders = _.pluck(list, "folderName");
  folders = _.uniq(folders);
  var tree = [];
  for( var i = 0; i <folders.length; i++){
    var obj = {};
    obj.folderName = folders[i];
    var finder = _.where(list, {"folderName": folders[i]});
    obj.sharedCompanies = findSubCompanies(finder,subCompanies);
    tree.push(obj);
  }
  return tree;
}

function findSubCompanies(finder, subCompanies){
  finder = _.pluck(finder, "sharedCompanyId");
  finder = _.filter(subCompanies.items, function(comp){ return _.contains(finder,comp.id); });
  return _.pluck(finder, "name");
}


function listToTree(list){
  var tree = [];
  if(list) {
    for (var i = 0; i < list.length; i++) {
      var obj = {};
      obj.fullPath = list[i].name;
      var reformedString = list[i].name.substr(0, list[i].name.length - 1);
      var lastSlash = reformedString.substr(0, reformedString.lastIndexOf("/"));
      obj.parentid = (lastSlash === "") ? "" : lastSlash + "/";
      obj.id = list[i].name;
      obj.name = (lastSlash === "") ? reformedString : reformedString.substr(reformedString.lastIndexOf("/") + 1);
      tree.push(obj);
    }
  }
  return unflatten(tree);
}

function unflatten( array, parent, tree){
  tree = typeof tree !== "undefined" ? tree : [];
  parent = typeof parent !== "undefined" ? parent : { id: "" };

  var children = _.filter( array, function(child){ return child.parentid === parent.id; });

  if( !_.isEmpty( children )  ){
    if( parent.id === "" ){
      tree = children;
    }else{
      parent.children = children;
    }
    _.each( children, function( child ){ unflatten( array, child ); } );
  }
  return tree;
}