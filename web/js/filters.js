"use strict";

/* Filters */

angular.module("medialibraryFilters", ["risevision.common.i18n"])

.filter("lastModifiedFilter", ["$translate", function($translate) {
  var mtr = null;

  $translate(["common.jan", "common.feb", "common.mar", "common.apr",
  	          "common.may", "common.jun", "common.jul", "common.aug",
  	          "common.sep", "common.oct", "common.nov", "common.dec"])
  	.then(function(values) {
      mtr = values;
    });

  return function(timestamp) {
		if (!timestamp) {
			return "";
		}

		var monthNames = [ mtr["common.jan"], mtr["common.feb"], mtr["common.mar"], mtr["common.apr"],
			               mtr["common.may"], mtr["common.jun"], mtr["common.jul"], mtr["common.aug"], 
			               mtr["common.sep"], mtr["common.oct"], mtr["common.nov"], mtr["common.dec"]];

		var oldDate = new Date();
                    oldDate.setTime(timestamp.value);
		var difference = "";
		var newDate = new Date();
		
		if (newDate.getYear() > oldDate.getYear() || newDate.getMonth() > oldDate.getMonth()) {
			return oldDate.toLocaleDateString();
		}
		else if (newDate.getDate() > oldDate.getDate()) {
			return monthNames[oldDate.getMonth()] + " " + oldDate.getDate();
		}
		else {
			var hours = oldDate.getHours();
			hours = !hours ? 12 : hours > 12 ? hours - 12 : hours;
			var ampm = "AM";
			if (oldDate.getHours() > 11) {
				ampm = "PM";
			}
		
			var minutes = oldDate.getMinutes();
//			if ( hours < 10 ) { hours   = "0" + hours; }
			if ( minutes < 10 ) { minutes = "0" + minutes; }

			return hours + ":" + minutes + " " + ampm;

			//return oldDate.toLocaleTimeString();
		}
		
		return difference;
	};
}])

.filter("fileTypeFilter", ["$translate", function($translate) {
	var folderLabel = "";

    $translate("common.folder").then(function(value) {
      folderLabel = value;
    });

	return function(filename) {
		var re = /(?:\.([^.]+))?$/
                   ,ext;

                if (filename.substr(-1) === "/") {return folderLabel;}

		ext = re.exec(filename)[1];

		if (ext && ext.length <= 4) {
			ext = ext.toUpperCase();
			return ext;
		}

		return "";
	};
}])

.filter("fileNameFilter", ["$translate", function($translate) {
	var trash = "--TRASH--/";
	
	var previousFolderLabel = "";
	var trashLabel = "";

    $translate(["common.previous-folder", "storage-client.trash"]).then(function(values) {
      previousFolderLabel = values["common.previous-folder"];
      trashLabel = values["storage-client.trash"];
    });

	return function(filename, currentFolder) {
		if (currentFolder && currentFolder.length > 0) {
                  if (filename === currentFolder) {
                    return "/" + previousFolderLabel;
                  } else {
                    return filename.substr(currentFolder.length);
                  }
		}
		else if(filename === trash) {
      	  return trashLabel;
        }
        
		return filename;
	};
}])

.filter("cleanFolderName",function(){
		return function(path){
			var pathWithoutLastSlash = (path) ? path.substr(0, path.length -1) : path;
			var cleanFolderName = (path) ? path.substr(pathWithoutLastSlash.lastIndexOf("/") + 1).replace("/", "") : "";
			return cleanFolderName;
		};
})

.filter("fileSizeFilter", function() {
	return function(size) {
		var sizeString = "";
                if (size === 0) {return "0 bytes";}

                if (!size) { return "";}
		
		if (size < 1000) {
			sizeString = size + " bytes";
		}
		else if (size > 1024 && size < Math.pow(1024, 2)) {
			sizeString = Math.floor(size / (1024 / 10)) / 10.0 + " KB";
		}
		else if (size >= Math.pow(1024, 2) && size < Math.pow(1024, 3)) {
			sizeString = Math.floor(size / (Math.pow(1024, 2) / 10)) / 10.0 + " MB";
		}
		else if (size >= Math.pow(1024, 3)) {
			sizeString = Math.floor(size / (Math.pow(1024, 3) / 10)) / 10.0 + " GB";
		}
		
		return sizeString;
	};
})

.filter("bandwidthUseFilter",
["fileSizeFilterFilter", "$translate", function(fileSizeFilter, $translate) {
	var lessThan1MB = "";

    $translate("storage-client.lessThan1MB").then(function(value) {
      lessThan1MB = value;
    });

  return function bandwidthUseFilter(bytes) {
  	if(isNaN(bytes)) {
  		return bytes;
  	}

    return parseInt(bytes, 10) / 1000000 < 1 ? lessThan1MB :
                                               fileSizeFilter(bytes);
  };
}])

.filter("groupBy", function() {
  return function(items, groupedBy) {
    if (items) {
      var finalItems = [],
        thisGroup;
      for (var i = 0; i < items.length; i++) {
        if (!thisGroup) {
          thisGroup = [];
        }
        thisGroup.push(items[i]);
        if (((i+1) % groupedBy) === 0) {
          finalItems.push(thisGroup);
          thisGroup = null;
        }
      }
      if (thisGroup) {
        finalItems.push(thisGroup);
      }
      return finalItems;
    }
  };
})


.filter("trashItemFilter", [function() {
	return function(itemName) {
		var trash = "--TRASH--/";

		if(itemName && itemName.indexOf(trash) === 0) {
			return itemName.substr(trash.length);
		}
		else {
			return itemName;
		}
	};
}])

;
