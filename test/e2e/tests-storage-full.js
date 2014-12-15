/* global document: false, casper: false */
/* jshint globalstrict: true */

//Run tests:
//casperjs --cookies-file=$HOME/.storage-client-e2e-storage-full-cookies \
//[--user=XXXXXX] [--password=XXXXXX] test test/e2e/tests-storage-full.js
//Cookie file will be saved so that password option is only required once.
"use strict";

var foundFile = false;
var port = require("system").env.E2E_PORT || 8000;
var url = "http://localhost:" + port + "/index.html";

var loginPort = require("system").env.E2E_LOGIN_PORT || 8888;
var loginUrlRoot = "http://localhost:" + loginPort;
var loginUrl = loginUrlRoot + "/_ah/login?continue=%2f";

var imgdir = "test/e2e/storage-full/";
var customHeaders = {
  "Accept-Language": "en-US,en;q=0.8"
};

casper.options.waitTimeout = 50000;

casper.on("remote.message", function(msg) {
  casper.echo("DOM console: " + msg);
});

casper.test.begin("Connecting to " + url, function suite(test) {
  casper.start();

  casper.then(function() {
    casper.page.customHeaders = customHeaders;
  });

  casper.then(function() {
    casper.open(loginUrl).then(function() {
      this.evaluate(function(user) {
        document.querySelector("#email").value = user;
        document.querySelector("#btn-login").click();
      }, casper.cli.options.user);
    });

    casper.test.assert(true, "displayed local login");
  });

  casper.waitForUrl(loginUrlRoot, function() {
    casper.test.assert(true, "processed local login");
  });

  casper.then(function() {
    casper.open(url, { headers: customHeaders }).then(function(resp) {
      casper.echo("Response " + resp.status + " " + resp.statusText + " from " + resp.url);
      casper.viewport(1024, 768);
    });
  });

  // Clicks the Sign In button
  casper.then(function() {
    this.click(".sign-in.top-auth-button");
    casper.test.assert(true, "clicked on login button");
  });

  // Enters user credentials
  casper.waitForUrl(/accounts\.google\.com/, function() {
    this.evaluate(function(user, pass) {
      if (document.title === "Request for Permission") {
        document.querySelector("#submit approve access").click();
      }

      if (document.title === "Sign in - Google Accounts") {
        if (document.querySelector("#choose-account-0") !== null) {
          document.querySelector("#choose-account-0").click();
        } else {
          document.querySelector("#Email").value = user || "jenkins@risevision.com";
          document.querySelector("#Passwd").value = pass;
          document.querySelector("#signIn").click();
        }
      }

      return document.title;
    }, casper.cli.options.user, casper.cli.options.password);

    casper.test.assert(true, "entered login information");
  });

  // Expects an approve access page to show
  casper.waitForUrl(/accounts\.google\.com/, function() {
    casper.test.assert(true, "approve access displayed");
  });

  // Approves access to account data
  casper.waitUntilVisible("#submit_approve_access", function() {
    this.evaluate(function() {
      document.querySelector("#submit_approve_access").disabled = false;
      document.querySelector("#submit_approve_access").click();
    });

    casper.test.assert(true, "approve access clicked");
  });

  // Waits for the redirect page to load
  casper.waitForUrl(/index\.html/, function() {

  });

  // Waits for storage-modal iframe to load
  casper.waitUntilVisible("#storage-modal-embedded", function() {
    casper.test.assert(true, "storage-modal iframe displayed");
  });

  // From this point on, all the actions happen inside the iframe
  casper.withFrame("storage-modal-embedded", function() {
    // Waits for the loading info message to show
    casper.waitUntilVisible(".alert-info", function() {
      casper.test.assert(true, "files are being loaded");
    });

    // Waits until the file listing is loaded
    casper.waitUntilVisible("#filesTable", function() {
      casper.test.assert(true, "files have been listed");
    });

    // Clicks the Create Folder button
    casper.then(function() {
      this.click("button[ng-click=\"newFolderButtonClick('md')\"]");
    });

    // Waits for the popup to show
    casper.waitUntilVisible(".modal-dialog", function() {
      casper.test.assert(true, "create folder displayed");

      this.sendKeys("#newFolderInput", "test-folder");
      this.click("button[ng-click='ok()']");
    });

    // Waits for the popup to disappear
    casper.waitWhileVisible(".modal-dialog", function() {
      casper.test.assert(true, "confirm create folder dialog hidden");
    });

    // Waits for the loading info message to show
    casper.waitUntilVisible(".alert-info", function() {
      casper.test.assert(true, "files are being refreshed");
    });

    // Waits for the updated file listing to show
    casper.waitUntilVisible("#filesTable", function() {
      casper.test.assert(true, "files refreshed");
    });

    // Checks the newly created folder shows in the file listing. If it exists, its checkbox is clicked
    casper.waitFor(function() {
      return casper.evaluate(function() {
        var trs = document.querySelectorAll("#filesTable tbody tr");

        for(var i = 0; i < trs.length; i++) {
          if(trs[i].children[1].children[0].textContent === " test-folder/") {
            trs[i].children[0].children[0].click();
            return true;
          }
        }
        return false;
      });
    }, function() {
      casper.test.assert(true, "folder succesfully created and clicked");
    });
    // Clicks the Tagging Button, test if Modal becomes visible for folder
    casper.then(function() {
      this.click("button[ng-click='taggingButtonClick()']");
      casper.test.assert(true, "tagging button clicked for folder");
    });
    // Waits for the popup to show
    casper.waitUntilVisible(".modal-dialog", function() {
      casper.test.assert(true, "tagging modal displayed");
      casper.echo("Checking Lookup Tags Edit Screen and back button.");
      this.click("button[ng-click='editLookup()']");
      casper.test.assertVisible("div[title='Edit Lookup Tag View']");
      this.click("button[ng-click='resetView()']");
      casper.test.assertVisible("div[title='Main Tag View']");
      casper.echo("Checking click on lookup tag box goes to Edit screen");
      this.click("div[id='lookupEditBox']");
      casper.test.assertVisible("div[title='Edit Lookup Tag View']");
      //**** put here future e2e tests for add and remove functions on lookup Tags
      //****
      this.click("button[ng-click='cancel()']");
    });
    // Waits for the popup to disappear
    casper.waitWhileVisible(".modal-dialog", function() {
      casper.test.assert(true, "tagging dialog hidden");
    });

    // Clicks the Tagging icon, test if Modal becomes visible for file
    casper.then(function() {
      this.click("a[title='Tag File']");
      casper.test.assert(true, "tagging icon clicked for file");
    });
    // Waits for the popup to show
    casper.waitUntilVisible(".modal-dialog", function() {
      casper.test.assert(true, "tagging modal displayed");
      this.click("button[ng-click='cancel()']");
    });
    // Waits for the popup to disappear
    casper.waitWhileVisible(".modal-dialog", function() {
      casper.test.assert(true, "tagging dialog hidden");
    });
    // Clicks the Trash button, to send the folder to the Trash
    casper.then(function() {
      this.click("button[ng-click='trashButtonClick()']");
      casper.test.assert(true, "send to trash button clicked");
    });

    // Waits for the moving to trash info message to show
    casper.waitUntilVisible(".panel-info", function() {
      casper.test.assert(true, "folder is being moved to trash");
    });

    // Waits for the moving to trash info message to hide
    casper.waitWhileVisible(".panel-info", function() {
      casper.test.assert(true, "folder successfully moved to trash");
    });
    // Marks the first file if found as selected
    casper.then(function() {
      foundFile = this.evaluate(function() {
        var trs = document.querySelectorAll("#filesTable tbody tr");

        for(var i = 0; i < trs.length; i++) {
          if(trs[i].children[1].children[0].children[0].classList.contains("fa-file")) {
            trs[i].children[0].children[0].click();
            return true;
            //break;
          }
        }
        return false;
      });
      if(foundFile){
        // Test that tagging buttons are visible on file Select
        casper.echo("Checking tagging buttons visible on selected files.");
        casper.test.assertVisible("a[title='Tag File']");
        casper.test.assertVisible("button[title='Tagging']");
        casper.echo("file found and tag icons and buttons visible.");

        // Clicks the Tagging Button, test if Modal becomes visible for file
        casper.then(function() {
          this.click("button[ng-click='taggingButtonClick()']");
          casper.test.assert(true, "tagging button clicked for file");
        });
        // Waits for the popup to show
        casper.waitUntilVisible(".modal-dialog", function() {
          casper.test.assert(true, "tagging modal displayed");
          this.click("button[ng-click='cancel()']");
        });
        // Waits for the popup to disappear
        casper.waitWhileVisible(".modal-dialog", function() {
          casper.test.assert(true, "tagging dialog hidden");
        });

        // Clicks the Tagging icon, test if Modal becomes visible for file
        casper.then(function() {
          this.click("a[title='Tag File']");
          casper.test.assert(true, "tagging icon clicked for file");
        });
        // Waits for the popup to show
        casper.waitUntilVisible(".modal-dialog", function() {
          casper.test.assert(true, "tagging modal displayed");
          this.click("button[ng-click='cancel()']");
        });
        // Waits for the popup to disappear
        casper.waitWhileVisible(".modal-dialog", function() {
          casper.test.assert(true, "tagging dialog hidden");
        });

        // Clicks the Trash button, to send the file to the Trash
        casper.then(function() {
          this.click("button[ng-click='trashButtonClick()']");
          casper.test.assert(true, "send to trash button clicked");
        });

        // Waits for the moving to trash info message to show
        casper.waitUntilVisible(".panel-info", function() {
          casper.test.assert(true, "files are being moved to trash");
        });

        // Waits for the moving to trash info message to hide
        casper.waitWhileVisible(".panel-info", function() {
          casper.test.assert(true, "files successfully moved to trash");
        });
      }
    });

    // Clicks the Show Trash button, to list the files on Trash
    casper.then(function() {
      var sufix = "[ng-show='fileIsFolder(file) || !storageFull']";

      this.click("a[title='Trash']" + sufix);
      // When using PhantomJS, setting the locale is ignored (it does not happen with SlimerJS)
      //this.click("a[title='Papelera']" + sufix);

      casper.test.assert(true, "trash button clicked");
    });

    // Waits for the loading info message to show
    casper.waitUntilVisible(".alert-info", function() {
      casper.test.assert(true, "trash files are being loaded");
    });

    // Waits for the trash file listing to show
    casper.waitUntilVisible("#filesTable", function() {
      casper.test.assert(true, "trash displayed");
    });

    // Checks the newly moved to trash folder shows in the file listing
    casper.waitUntilVisible("a[title='test-folder/']", function() {
      casper.test.assert(true, "folder moved to trash succesfully");
    });

    // Marks the folder as selected
    casper.then(function() {
      this.evaluate(function() {
        var trs = document.querySelectorAll("#filesTable tbody tr");

        for(var i = 0; i < trs.length; i++) {
          if(trs[i].children[1].children[0].textContent === " test-folder/") {
            trs[i].children[0].children[0].click();
            break;
          }
        }

      });
      // Test that tagging button doesn't exist in trash
      casper.echo("Checking tagging buttons on selected folder in trash not visible");
      casper.test.assertNotVisible("a[title='Tag File']");
      casper.test.assertNotVisible("button[title='Tagging']");
      casper.echo("folder found and tag icons and buttons not visible");
      casper.test.assert(true, "test-folder in trash checked");
    });

    // Clicks the Delete button, to permanently delete the folder
    casper.then(function() {
      this.click("button[ng-click=\"deleteButtonClick()\"]");
      casper.test.assert(true, "delete button clicked");
    });

    // Waits for the popup to show and confirms the action
    casper.waitUntilVisible(".modal-dialog", function() {
      casper.test.assert(true, "confirm permanent deletion dialog displayed");

      this.click("button[ng-click='ok()']");
    });

    // Waits for the popup to disappear
    casper.waitWhileVisible(".modal-dialog", function() {
      casper.test.assert(true, "confirm permanent deletion dialog hidden");
    });

    // Waits for the deleting info message to show
    casper.waitUntilVisible(".panel-info", function() {
      casper.test.assert(true, "files are being deleted");
    });

    // Waits for the deleting info message to hide
    casper.waitWhileVisible(".panel-info", function() {
      casper.test.assert(true, "files successfully deleted");
    });

    // Checks the delete folder does not show in the file listing anymore
    casper.then(function() {
      casper.test.assertDoesntExist("a[title='test-folder/']");
    });

    // Marks the first file if found as selected
    casper.then(function() {
      this.evaluate(function () {
        var trs = document.querySelectorAll("#filesTable tbody tr");

        for (var i = 0; i < trs.length; i++) {
          if (trs[i].children[1].children[0].children[0].classList.contains("fa-file") &&
            trs[i].children[1].children[0].textContent !== " /Previous Folder") {
            trs[i].children[0].children[0].click();
            break;
          }
        }
      });

      if (foundFile) {
        // Checks if file is found that you can restore it from trash
        casper.then(function () {
          casper.test.assertVisible("button[title='Restore From Trash']");
          this.click("button[ng-click='restoreButtonClick()']");
          casper.test.assert(true, "restore button clicked");
        });

        // Waits for the moving to restoring message to show
        casper.waitUntilVisible(".panel-info", function () {
          casper.test.assert(true, "file is being restored");
        });

        // Waits for the moving to trash info message to hide
        casper.waitWhileVisible(".panel-info", function () {
          casper.test.assert(true, "file successfully restored");
        });
      }
    });
  });

  casper.then(function() {
    casper.capture(imgdir + "done.png");
    casper.echo("DONE. Final screenshot saved to test/e2e/done.png");
  });

  casper.run(function() {
    test.done();
  });
});