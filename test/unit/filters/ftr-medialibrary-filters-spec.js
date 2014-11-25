/*jshint expr:true */
"use strict";

var translations = {
  "common.jan": "Jan",
  "common.feb": "Feb",
  "common.mar": "Mar",
  "common.apr": "Apr",
  "common.may": "May",
  "common.jun": "Jun",
  "common.jul": "Jul",
  "common.aug": "Aug",
  "common.sep": "Sep",
  "common.oct": "Oct",
  "common.nov": "Nov",
  "common.dec": "Dec"
};

var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];

Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

Date.prototype.addMinutes = function(minutes) {
  return new Date(this.getTime() + minutes * 60 * 1000);
};

Date.prototype.addMonths = function(months) {
  var date = new Date(this.getTime());
  date.setMonth(date.getMonth() + months);
  return date;
};

describe("Filters: lastModifiedFilter", function() {
  beforeEach(module("medialibraryFilters"));

  it("should exist", function(done) {
    inject(function($filter) {
      expect($filter("lastModifiedFilter")).be.defined;
      done();
    });
  });
});


describe("Filters: fileTypeFilter", function() {
  beforeEach(module("medialibraryFilters"));

  it("should exist", function(done) {
    inject(function($filter) {
      expect($filter("fileTypeFilter")).be.defined;
      done();
    });
  });

  it("should extract file type", inject(function ($filter) {
    expect($filter("fileTypeFilter")("hello.txt")).to.equal("TXT");
    expect($filter("fileTypeFilter")("4g43g43gj34iogj43iogj34ig4j3g4i3.jpeg")).to.equal("JPEG");
    expect($filter("fileTypeFilter")("dash-and.dot-in.file.name.xml")).to.equal("XML");
    expect($filter("fileTypeFilter")("no.extension")).to.equal("");
    expect($filter("fileTypeFilter")("noextension")).to.equal("");
  }));
});

describe("Filters: fileSizeFilter", function() {

  beforeEach(module("medialibraryFilters"));

  it("should exist", function(done) {
    inject(function($filter) {
      expect($filter("fileSizeFilter")).be.defined;
      done();
    });
  });

  it("should format file size", inject(function ($filter) {
    expect($filter("fileSizeFilter")(0)).to.equal("0 bytes");
    expect($filter("fileSizeFilter")(200)).to.equal("200 bytes");
    expect($filter("fileSizeFilter")(2 * 1024)).to.equal("2 KB");
    expect($filter("fileSizeFilter")(1023 * 1024)).to.equal("1023 KB");
    expect($filter("fileSizeFilter")(3 * 1024 * 1024)).to.equal("3 MB");
    expect($filter("fileSizeFilter")(5 * 1024 * 1024 + 600 * 1024)).to.equal("5.5 MB");
    expect($filter("fileSizeFilter")(17 * 1024 * 1024 * 1024)).to.equal("17 GB");
    expect($filter("fileSizeFilter")(23 * 1024 * 1024 * 1024 + 700 * 1024 * 1024)).to.equal("23.6 GB");
    expect($filter("fileSizeFilter")(2002 * 1024 * 1024 * 1024)).to.equal("2002 GB");
  }));
});

describe("Filters: groupBy", function() {
  beforeEach(module("medialibraryFilters"));
  it("should exist", function(done) {
    inject(function($filter) {
      expect($filter("groupBy")).be.defined;
      done();
    });
  });
});

describe("Filters: lastModifiedFilter", function() {
  beforeEach(module("medialibraryFilters", function($provide) {
    $provide.provider("$translate", function() {
      var service = {};

      service.$get = function() {
        var fun = function(key) {
          return {
            then: function(cb) {
              if(Array.isArray(key)) {
                var map = {};

                for(var i = 0; i < key.length; i++) {
                  map[key[i]] = translations[key[i]];
                }

                cb(map);
              }
              else {
                cb(translations[key]);
              }
            }
          };
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
  }));

  it("should exist", function(done) {
    inject(function($filter) {
      expect($filter("lastModifiedFilter")).be.defined;
      done();
    });
  });

  it("should format last modified date", inject(function ($filter) {
    var filter = $filter("lastModifiedFilter");
    var date1obj = new Date("2002/12/11");
    var date1 = { value: date1obj.getTime() };
    var date2obj = new Date().addDays(-1);
    var date2 = { value: date2obj.getTime() };
    var date3obj = new Date().addMinutes(-1);
    var date3 = { value: date3obj.getTime() };

    expect(filter(date1)).to.equal(date1obj.toLocaleDateString());

    // Not run if month changes, because filter uses new Date() internally
    if(new Date().getMonth() === date2obj.getMonth()) {
      expect(filter(date2)).to.equal(monthNames[date2obj.getMonth()] + " " + date2obj.getDate());
    }

    // Not run if day changes, because filter uses new Date() internally
    if(new Date().getDate() === date3obj.getDate()) {
      expect(filter(date3).indexOf(":")).to.be.above(-1);
    }
  }));
});
