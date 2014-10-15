"use strict";

/*
 * App Configuration File
 * Put environment-specific global variables in this file.
 *
 * In general, if you put an variable here, you will want to 
 * make sure to put an equivalent variable in all three places:
 * dev.js, stage.js & prod.js
 * 
 */

angular.module("risevision.common.config")
    .value("GAPI_CLIENT_ID", "614513768474.apps.googleusercontent.com")
    .value("GAPI_SCOPES", "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile")
    //.value("CORE_URL", "https://store-dot-rvacore-test.appspot.com/_ah/api")
    .value("COOKIE_CHECK_URL", "http://cookie-dot-storage-dot-rvacore-test.appspot.com")
    .value("STORAGE_URL", "http://localhost:8888/_ah/api")
    .value("STORAGE_API_URL", "https://www.googleapis.com/download/storage/v1/b/")
    .value("STORE_PRODUCT_CODE", "b0cba08a4baa0c62b8cdc621b6f6a124f89a03db")
    .value("STORE_PRODUCT_ID", "24")
    // Subscription status
    //.value("STORE_SERVER_URL", "https://store-dot-rvacore-test.appspot.com/")
    //.value("IN_RVA_PATH", "?up_id=iframeId&parent=parentUrl#/product/productId/?inRVA&cid=companyId")
    //.value("PATH_URL", "v1/company/companyId/product/status?pc=")
    //.value("STORE_URL", "https://store.risevision.com") // Also used by common-header
    //.value("CORE_URL", "https://rvacore-test.appspot.com/_ah/api")
    ;
