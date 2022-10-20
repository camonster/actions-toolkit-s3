"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var core = require("@actions/core");
var http_client_1 = require("@actions/http-client");
var storage_blob_1 = require("@azure/storage-blob");
var client_s3_1 = require("@aws-sdk/client-s3");
var buffer = require("buffer");
var fs = require("fs");
var stream = require("stream");
var util = require("util");
var utils = require("./cacheUtils");
var constants_1 = require("./constants");
var requestUtils_1 = require("./requestUtils");
/**
 * Pipes the body of a HTTP response to a stream
 *
 * @param response the HTTP response
 * @param output the writable stream
 */
function pipeResponseToStream(response, output) {
    return __awaiter(this, void 0, void 0, function () {
        var pipeline;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pipeline = util.promisify(stream.pipeline);
                    return [4 /*yield*/, pipeline(response.message, output)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Class for tracking the download state and displaying stats.
 */
var DownloadProgress = /** @class */ (function () {
    function DownloadProgress(contentLength) {
        this.contentLength = contentLength;
        this.segmentIndex = 0;
        this.segmentSize = 0;
        this.segmentOffset = 0;
        this.receivedBytes = 0;
        this.displayedComplete = false;
        this.startTime = Date.now();
    }
    /**
     * Progress to the next segment. Only call this method when the previous segment
     * is complete.
     *
     * @param segmentSize the length of the next segment
     */
    DownloadProgress.prototype.nextSegment = function (segmentSize) {
        this.segmentOffset = this.segmentOffset + this.segmentSize;
        this.segmentIndex = this.segmentIndex + 1;
        this.segmentSize = segmentSize;
        this.receivedBytes = 0;
        core.debug("Downloading segment at offset " + this.segmentOffset + " with length " + this.segmentSize + "...");
    };
    /**
     * Sets the number of bytes received for the current segment.
     *
     * @param receivedBytes the number of bytes received
     */
    DownloadProgress.prototype.setReceivedBytes = function (receivedBytes) {
        this.receivedBytes = receivedBytes;
    };
    /**
     * Returns the total number of bytes transferred.
     */
    DownloadProgress.prototype.getTransferredBytes = function () {
        return this.segmentOffset + this.receivedBytes;
    };
    /**
     * Returns true if the download is complete.
     */
    DownloadProgress.prototype.isDone = function () {
        return this.getTransferredBytes() === this.contentLength;
    };
    /**
     * Prints the current download stats. Once the download completes, this will print one
     * last line and then stop.
     */
    DownloadProgress.prototype.display = function () {
        if (this.displayedComplete) {
            return;
        }
        var transferredBytes = this.segmentOffset + this.receivedBytes;
        var percentage = (100 * (transferredBytes / this.contentLength)).toFixed(1);
        var elapsedTime = Date.now() - this.startTime;
        var downloadSpeed = (transferredBytes /
            (1024 * 1024) /
            (elapsedTime / 1000)).toFixed(1);
        core.info("Received " + transferredBytes + " of " + this.contentLength + " (" + percentage + "%), " + downloadSpeed + " MBs/sec");
        if (this.isDone()) {
            this.displayedComplete = true;
        }
    };
    /**
     * Returns a function used to handle TransferProgressEvents.
     */
    DownloadProgress.prototype.onProgress = function () {
        var _this = this;
        return function (progress) {
            _this.setReceivedBytes(progress.loadedBytes);
        };
    };
    /**
     * Starts the timer that displays the stats.
     *
     * @param delayInMs the delay between each write
     */
    DownloadProgress.prototype.startDisplayTimer = function (delayInMs) {
        var _this = this;
        if (delayInMs === void 0) { delayInMs = 1000; }
        var displayCallback = function () {
            _this.display();
            if (!_this.isDone()) {
                _this.timeoutHandle = setTimeout(displayCallback, delayInMs);
            }
        };
        this.timeoutHandle = setTimeout(displayCallback, delayInMs);
    };
    /**
     * Stops the timer that displays the stats. As this typically indicates the download
     * is complete, this will display one last line, unless the last line has already
     * been written.
     */
    DownloadProgress.prototype.stopDisplayTimer = function () {
        if (this.timeoutHandle) {
            clearTimeout(this.timeoutHandle);
            this.timeoutHandle = undefined;
        }
        this.display();
    };
    return DownloadProgress;
}());
exports.DownloadProgress = DownloadProgress;
/**
 * Download the cache using the Actions toolkit http-client
 *
 * @param archiveLocation the URL for the cache
 * @param archivePath the local path where the cache is saved
 */
function downloadCacheHttpClient(archiveLocation, archivePath) {
    return __awaiter(this, void 0, void 0, function () {
        var writeStream, httpClient, downloadResponse, contentLengthHeader, expectedLength, actualLength;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    writeStream = fs.createWriteStream(archivePath);
                    httpClient = new http_client_1.HttpClient('actions/cache');
                    return [4 /*yield*/, requestUtils_1.retryHttpClientResponse('downloadCache', function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, httpClient.get(archiveLocation)];
                        }); }); })
                        // Abort download if no traffic received over the socket.
                    ];
                case 1:
                    downloadResponse = _a.sent();
                    // Abort download if no traffic received over the socket.
                    downloadResponse.message.socket.setTimeout(constants_1.SocketTimeout, function () {
                        downloadResponse.message.destroy();
                        core.debug("Aborting download, socket timed out after " + constants_1.SocketTimeout + " ms");
                    });
                    return [4 /*yield*/, pipeResponseToStream(downloadResponse, writeStream)
                        // Validate download size.
                    ];
                case 2:
                    _a.sent();
                    contentLengthHeader = downloadResponse.message.headers['content-length'];
                    if (contentLengthHeader) {
                        expectedLength = parseInt(contentLengthHeader);
                        actualLength = utils.getArchiveFileSizeInBytes(archivePath);
                        if (actualLength !== expectedLength) {
                            throw new Error("Incomplete download. Expected file size: " + expectedLength + ", actual file size: " + actualLength);
                        }
                    }
                    else {
                        core.debug('Unable to validate download, no Content-Length header');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.downloadCacheHttpClient = downloadCacheHttpClient;
/**
 * Download the cache using the Azure Storage SDK.  Only call this method if the
 * URL points to an Azure Storage endpoint.
 *
 * @param archiveLocation the URL for the cache
 * @param archivePath the local path where the cache is saved
 * @param options the download options with the defaults set
 */
function downloadCacheStorageSDK(archiveLocation, archivePath, options) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var client, properties, contentLength, maxSegmentSize, downloadProgress, fd, segmentStart, segmentSize, result;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    client = new storage_blob_1.BlockBlobClient(archiveLocation, undefined, {
                        retryOptions: {
                            // Override the timeout used when downloading each 4 MB chunk
                            // The default is 2 min / MB, which is way too slow
                            tryTimeoutInMs: options.timeoutInMs
                        }
                    });
                    return [4 /*yield*/, client.getProperties()];
                case 1:
                    properties = _b.sent();
                    contentLength = (_a = properties.contentLength) !== null && _a !== void 0 ? _a : -1;
                    if (!(contentLength < 0)) return [3 /*break*/, 3];
                    // We should never hit this condition, but just in case fall back to downloading the
                    // file as one large stream
                    core.debug('Unable to determine content length, downloading file with http-client...');
                    return [4 /*yield*/, downloadCacheHttpClient(archiveLocation, archivePath)];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 9];
                case 3:
                    maxSegmentSize = Math.min(2147483647, buffer.constants.MAX_LENGTH);
                    downloadProgress = new DownloadProgress(contentLength);
                    fd = fs.openSync(archivePath, 'w');
                    _b.label = 4;
                case 4:
                    _b.trys.push([4, , 8, 9]);
                    downloadProgress.startDisplayTimer();
                    _b.label = 5;
                case 5:
                    if (!!downloadProgress.isDone()) return [3 /*break*/, 7];
                    segmentStart = downloadProgress.segmentOffset + downloadProgress.segmentSize;
                    segmentSize = Math.min(maxSegmentSize, contentLength - segmentStart);
                    downloadProgress.nextSegment(segmentSize);
                    return [4 /*yield*/, client.downloadToBuffer(segmentStart, segmentSize, {
                            concurrency: options.downloadConcurrency,
                            onProgress: downloadProgress.onProgress()
                        })];
                case 6:
                    result = _b.sent();
                    fs.writeFileSync(fd, result);
                    return [3 /*break*/, 5];
                case 7: return [3 /*break*/, 9];
                case 8:
                    downloadProgress.stopDisplayTimer();
                    fs.closeSync(fd);
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    });
}
exports.downloadCacheStorageSDK = downloadCacheStorageSDK;
/**
 * Download the cache using the AWS S3.  Only call this method if the use S3.
 *
 * @param key the key for the cache in S3
 * @param archivePath the local path where the cache is saved
 * @param s3Options: the option for AWS S3 client
 * @param s3BucketName: the name of bucket in AWS S3
 */
function downloadCacheStorageS3(key, archivePath, s3Options, s3BucketName) {
    return __awaiter(this, void 0, void 0, function () {
        var s3client, param, response, fileStream, pipeline;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    s3client = new client_s3_1.S3Client(s3Options);
                    param = {
                        Bucket: s3BucketName,
                        Key: key
                    };
                    return [4 /*yield*/, s3client.send(new client_s3_1.GetObjectCommand(param))];
                case 1:
                    response = _a.sent();
                    if (!response.Body) {
                        throw new Error("Incomplete download. response.Body is undefined from S3.");
                    }
                    fileStream = fs.createWriteStream(archivePath);
                    pipeline = util.promisify(stream.pipeline);
                    return [4 /*yield*/, pipeline(response.Body, fileStream)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.downloadCacheStorageS3 = downloadCacheStorageS3;
