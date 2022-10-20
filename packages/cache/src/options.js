"use strict";
exports.__esModule = true;
var core = require("@actions/core");
/**
 * Returns a copy of the upload options with defaults filled in.
 *
 * @param copy the original upload options
 */
function getUploadOptions(copy) {
    var result = {
        uploadConcurrency: 4,
        uploadChunkSize: 32 * 1024 * 1024
    };
    if (copy) {
        if (typeof copy.uploadConcurrency === 'number') {
            result.uploadConcurrency = copy.uploadConcurrency;
        }
        if (typeof copy.uploadChunkSize === 'number') {
            result.uploadChunkSize = copy.uploadChunkSize;
        }
    }
    core.debug("Upload concurrency: " + result.uploadConcurrency);
    core.debug("Upload chunk size: " + result.uploadChunkSize);
    return result;
}
exports.getUploadOptions = getUploadOptions;
/**
 * Returns a copy of the download options with defaults filled in.
 *
 * @param copy the original download options
 */
function getDownloadOptions(copy) {
    var result = {
        useAzureSdk: true,
        downloadConcurrency: 8,
        timeoutInMs: 30000
    };
    if (copy) {
        if (typeof copy.useAzureSdk === 'boolean') {
            result.useAzureSdk = copy.useAzureSdk;
        }
        if (typeof copy.downloadConcurrency === 'number') {
            result.downloadConcurrency = copy.downloadConcurrency;
        }
        if (typeof copy.timeoutInMs === 'number') {
            result.timeoutInMs = copy.timeoutInMs;
        }
    }
    core.debug("Use Azure SDK: " + result.useAzureSdk);
    core.debug("Download concurrency: " + result.downloadConcurrency);
    core.debug("Request timeout (ms): " + result.timeoutInMs);
    return result;
}
exports.getDownloadOptions = getDownloadOptions;
