"use strict";
function getService(serviceName) {
  var injectedService;
  inject([serviceName, function(serviceInstance) {
    injectedService = serviceInstance;
  }]);
  return injectedService;
}

function setupMocks(servicesPassFail) {
  return function($provide) {
    $provide.service("OAuthStatusService", function() {
      var service = {authCheckCount: 0};

      service.getAuthStatus = function () {
        service.authCheckCount += 1;
        return (servicesPassFail.auth ? new Q("true") : Q.reject("no auth"));
      };
      return service;
    });

    $provide.service("GAPIRequestService", function() {
      var service = {bandwidthCallCount: 0};

      service.executeRequest = function (apiPath) {
        if (apiPath === "storage.getBucketBandwidth") {
          service.bandwidthCallCount += 1;
        }

        return  new Q({message: servicesPassFail.bandwidth ? true : null});
      };

      return service;
    });

    $provide.service("$q", function() {
      return Q;
    });

    $provide.provider("$translate", function() {
      var service = {};

      service.$get = function() {
      	var fun = function(key) {
      		return key;
      	};

        fun.storage = function() {
        	return null;
        };

        fun.storageKey = function(key) {
        	return key;
        };

        fun.preferredLanguage = function() {
        	return "en";
        };

        fun.use = function() {

        };

      	return fun;
      };

      return service;
    });
  };
}

describe("Services: Bandwidth", function() {
  beforeEach(module("medialibrary"));

  describe("With successful bandwith result", function() {
    beforeEach(module(setupMocks({bandwidth: true, auth: true})));

    it("should reject if no companyId", function() {
      var bandwidthService = getService("BandwidthService");
      return bandwidthService.getBandwidth()
      .then(function() {assert(false);}, function(resp) {
        expect(resp).to.equal("No companyId");
      }); 
    });

    it("should get bandwidth", function() {
      var bandwidthService = getService("BandwidthService");
      return bandwidthService.getBandwidth("Some companyId")
      .then(function(resp) {
        expect(resp).to.equal(true);
      }, function() {assert(false);});
    });

    it("should execute a request only on first call", function() {
      var bandwidthService = getService("BandwidthService");
      var gapiRequestService = getService("GAPIRequestService");
      expect(gapiRequestService.bandwidthCallCount).to.equal(0);
      return bandwidthService.getBandwidth("Some companyId")
      .then(function() {
        expect(gapiRequestService.bandwidthCallCount).to.equal(1);
      }).then(function() {
        return bandwidthService.getBandwidth("Some companyId");
      }).then(function() {
        expect(gapiRequestService.bandwidthCallCount).to.equal(1);
      });
    });
  });

  describe("With failed bandwith result", function() {
    beforeEach(module(setupMocks({bandwidth: false, auth: true})));

    it("should reject", function() {
      var bandwidthService = getService("BandwidthService");
      return bandwidthService.getBandwidth("Some companyId")
      .then(function() {assert(false);}, function() {assert(true);});
    });
  });

  describe("With failed auth result", function() {
    beforeEach(module(setupMocks({bandwidth: true, auth: false})));

    it("should reject", function() {
      var bandwidthService = getService("BandwidthService");
      return bandwidthService.getBandwidth("Some companyId")
      .then(function() {assert(false);}, function() {assert(true);}); 
    });
  });
});

