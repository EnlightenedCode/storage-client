"use strict";
/* global sinon: "" */


var gadgets = {
    rpc: {
        call: function() {}
    }
};

describe("FileListCtrl", function() {

    var $window;
    var FileListCtrl, scope;
    var FileListService;
    var invokedMethod = "";
    var postMessage;
    
    beforeEach(module("medialibrary"));

    beforeEach(inject(function ($controller, $rootScope, _$window_, $injector) {
        var $httpBackend = $injector.get("$httpBackend");
        $httpBackend.whenGET(/\.*/).respond(200, {});

        FileListService = {};

        FileListService.filesDetails = {
                           files: [{ "name": "test/file1", "size": 5 }, 
                                   { "name": "test/file2", "size": 3 },
                                   { "name": "test/file3", "size": 8 },
                                   { "name": "test/", "size": 0 }]
                           ,localFiles: false
                           ,totalBytes: 16
                           ,checkedCount: 0
                           ,folderCheckedCount: 0 };

        FileListService.statusDetails = { code: 200 };

        var GAPIRequestService = {};
  
        GAPIRequestService.executeRequest = function (apiPath) {
          invokedMethod = apiPath;

          return {
            then: function() {
                return { code: 200, message: "" };
            }
          };
        };

        $window =  _$window_;
        scope = $rootScope.$new();

        postMessage = sinon.spy($window.parent, "postMessage");

        FileListCtrl = $controller("FileListCtrl", {
            $scope: scope, GAPIRequestService: GAPIRequestService,
                FileListService: FileListService });
      }));

    afterEach(function() {
      $window.parent.postMessage.restore();
    });

    it("should be defined", function() {
        expect(FileListCtrl).to.exist;
    });

    it("should call storage.createBucket", function() {
        scope.createBucket();
        scope.$apply();

        expect(invokedMethod).to.equal("storage.createBucket");
    });

    it("should post a message to its parent when a file is clicked", function() {
        var file = FileListService.filesDetails.files[0];
        var call = sinon.spy(gadgets.rpc, "call");

        scope.$emit("FileSelectAction", file);

        scope.$apply();

        expect(call.called).to.equal(true);

        // postMessage receives an array of file paths and a "*" as second parameter
        expect(postMessage.args[0][0].length).to.equal(1);
    });

    it("should test file is the current folder", function() {
        var file = FileListService.filesDetails.files[3];

        scope.currentDecodedFolder = "test/";
        
        expect(scope.fileIsCurrentFolder(file)).to.be.equal(true);
    });

    it("should test an item is a not folder", function() {
        var file = FileListService.filesDetails.files[0];
        
        expect(scope.fileIsFolder(file)).to.be.equal(false);
    });

    it("should test an item is a folder", function() {
        var file = FileListService.filesDetails.files[3];
        
        expect(scope.fileIsFolder(file)).to.be.equal(true);
    });

    it("should select all files and folders", function() {
        scope.selectAll = true;
        scope.selectAllCheckboxes();

        expect(scope.filesDetails.checkedCount).to.be.equal(3);
        expect(scope.filesDetails.folderCheckedCount).to.be.equal(1);
    });

    it("should deselect all files and folders", function() {
        scope.selectAll = false;
        scope.selectAllCheckboxes();

        expect(scope.filesDetails.checkedCount).to.be.equal(0);
        expect(scope.filesDetails.folderCheckedCount).to.be.equal(0);
    });
});
