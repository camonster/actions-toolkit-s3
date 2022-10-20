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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var core = require("@actions/core");
var http_client_1 = require("@actions/http-client");
var auth_1 = require("@actions/http-client/lib/auth");
var client_s3_1 = require("@aws-sdk/client-s3");
var lib_storage_1 = require("@aws-sdk/lib-storage");
var crypto = require("crypto");
var fs = require("fs");
var url_1 = require("url");
var utils = require("./cacheUtils");
var constants_1 = require("./constants");
var downloadUtils_1 = require("./downloadUtils");
var options_1 = require("../options");
var requestUtils_1 = require("./requestUtils");
var versionSalt = '1.0';
function getCacheApiUrl(resource) {
    var baseUrl = process.env['ACTIONS_CACHE_URL'] || '';
    if (!baseUrl) {
        throw new Error('Cache Service Url not found, unable to restore cache.');
    }
    var url = baseUrl + "_apis/artifactcache/" + resource;
    core.debug("Resource Url: " + url);
    return url;
}
function createAcceptHeader(type, apiVersion) {
    return type + ";api-version=" + apiVersion;
}
function getRequestOptions() {
    var requestOptions = {
        headers: {
            Accept: createAcceptHeader('application/json', '6.0-preview.1')
        }
    };
    return requestOptions;
}
function createHttpClient() {
    var token = process.env['ACTIONS_RUNTIME_TOKEN'] || '';
    var bearerCredentialHandler = new auth_1.BearerCredentialHandler(token);
    return new http_client_1.HttpClient('actions/cache', [bearerCredentialHandler], getRequestOptions());
}
function getCacheVersion(paths, compressionMethod) {
    var components = paths.concat(!compressionMethod || compressionMethod === constants_1.CompressionMethod.Gzip
        ? []
        : [compressionMethod]);
    // Add salt to cache version to support breaking changes in cache entry
    components.push(versionSalt);
    return crypto
        .createHash('sha256')
        .update(components.join('|'))
        .digest('hex');
}
exports.getCacheVersion = getCacheVersion;
function getCacheEntryS3(s3Options, s3BucketName, keys, paths) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var primaryKey, s3client, param, contents, hasNext, response, found_1, notPrimaryKey, found;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    primaryKey = keys[0];
                    s3client = new client_s3_1.S3Client(s3Options);
                    param = {
                        Bucket: s3BucketName
                    };
                    contents = new Array();
                    hasNext = true;
                    _b.label = 1;
                case 1:
                    if (!hasNext) return [3 /*break*/, 3];
                    return [4 /*yield*/, s3client.send(new client_s3_1.ListObjectsV2Command(param))];
                case 2:
                    response = _b.sent();
                    if (!response.Contents) {
                        throw new Error("Cannot found object in bucket " + s3BucketName);
                    }
                    found_1 = response.Contents.find(function (content) { return content.Key === primaryKey; });
                    if (found_1 && found_1.LastModified) {
                        return [2 /*return*/, {
                                cacheKey: primaryKey,
                                creationTime: found_1.LastModified.toString()
                            }];
                    }
                    hasNext = (_a = response.IsTruncated) !== null && _a !== void 0 ? _a : false;
                    response.Contents.map(function (obj) {
                        return contents.push({
                            Key: obj.Key,
                            LastModified: obj.LastModified
                        });
                    });
                    return [3 /*break*/, 1];
                case 3:
                    notPrimaryKey = keys.slice(1);
                    found = searchRestoreKeyEntry(notPrimaryKey, contents);
                    if (found != null && found.LastModified) {
                        return [2 /*return*/, {
                                cacheKey: found.Key,
                                creationTime: found.LastModified.toString()
                            }];
                    }
                    return [2 /*return*/, null];
            }
        });
    });
}
function searchRestoreKeyEntry(notPrimaryKey, entries) {
    for (var _i = 0, notPrimaryKey_1 = notPrimaryKey; _i < notPrimaryKey_1.length; _i++) {
        var k = notPrimaryKey_1[_i];
        var found = _searchRestoreKeyEntry(k, entries);
        if (found != null) {
            return found;
        }
    }
    return null;
}
function _searchRestoreKeyEntry(notPrimaryKey, entries) {
    var _a, _b;
    var matchPrefix = new Array();
    for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
        var entry = entries_1[_i];
        if (entry.Key === notPrimaryKey) {
            // extractly match, Use this entry
            return {
                cacheKey: entry.Key,
                creationTime: (_a = entry.LastModified) === null || _a === void 0 ? void 0 : _a.toString()
            };
        }
        if ((_b = entry.Key) === null || _b === void 0 ? void 0 : _b.startsWith(notPrimaryKey)) {
            matchPrefix.push(entry);
        }
    }
    if (matchPrefix.length === 0) {
        // not found, go to next key
        return null;
    }
    matchPrefix.sort(function (i, j) {
        var _a, _b, _c, _d, _e, _f;
        if ((i.LastModified == undefined) || (j.LastModified == undefined)) {
            return 0;
        }
        if (((_a = i.LastModified) === null || _a === void 0 ? void 0 : _a.getTime()) === ((_b = j.LastModified) === null || _b === void 0 ? void 0 : _b.getTime())) {
            return 0;
        }
        if (((_c = i.LastModified) === null || _c === void 0 ? void 0 : _c.getTime()) > ((_d = j.LastModified) === null || _d === void 0 ? void 0 : _d.getTime())) {
            return -1;
        }
        if (((_e = i.LastModified) === null || _e === void 0 ? void 0 : _e.getTime()) < ((_f = j.LastModified) === null || _f === void 0 ? void 0 : _f.getTime())) {
            return 1;
        }
        return 0;
    });
    // return newest entry
    return matchPrefix[0];
}
function getCacheEntry(keys, paths, options, s3Options, s3BucketName) {
    return __awaiter(this, void 0, void 0, function () {
        var httpClient, version, resource, response, cacheResult, cacheDownloadUrl;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(s3Options && s3BucketName)) return [3 /*break*/, 2];
                    return [4 /*yield*/, getCacheEntryS3(s3Options, s3BucketName, keys, paths)];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    httpClient = createHttpClient();
                    version = getCacheVersion(paths, options === null || options === void 0 ? void 0 : options.compressionMethod);
                    resource = "cache?keys=" + encodeURIComponent(keys.join(',')) + "&version=" + version;
                    core.debug("getCacheEntry.resource:::");
                    core.debug(JSON.stringify(resource));
                    return [4 /*yield*/, requestUtils_1.retryTypedResponse('getCacheEntry', function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, httpClient.getJson(getCacheApiUrl(resource))];
                        }); }); })];
                case 3:
                    response = _a.sent();
                    if (response.statusCode === 204) {
                        return [2 /*return*/, null];
                    }
                    if (!requestUtils_1.isSuccessStatusCode(response.statusCode)) {
                        throw new Error("Cache service responded with " + response.statusCode);
                    }
                    core.debug("getCacheEntry.response:::");
                    core.debug(JSON.stringify(response));
                    cacheResult = response.result;
                    cacheDownloadUrl = cacheResult === null || cacheResult === void 0 ? void 0 : cacheResult.archiveLocation;
                    if (!cacheDownloadUrl) {
                        throw new Error('Cache not found.');
                    }
                    core.setSecret(cacheDownloadUrl);
                    core.debug("Cache Result:");
                    core.debug(JSON.stringify(cacheResult));
                    return [2 /*return*/, cacheResult];
            }
        });
    });
}
exports.getCacheEntry = getCacheEntry;
function downloadCache(cacheEntry, archivePath, options, s3Options, s3BucketName) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var archiveLocation, archiveUrl, downloadOptions;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    archiveLocation = (_a = cacheEntry.archiveLocation) !== null && _a !== void 0 ? _a : "https://example.com" // for dummy
                    ;
                    archiveUrl = new url_1.URL(archiveLocation);
                    downloadOptions = options_1.getDownloadOptions(options);
                    if (!(downloadOptions.useAzureSdk &&
                        archiveUrl.hostname.endsWith('.blob.core.windows.net'))) return [3 /*break*/, 2];
                    // Use Azure storage SDK to download caches hosted on Azure to improve speed and reliability.
                    return [4 /*yield*/, downloadUtils_1.downloadCacheStorageSDK(archiveLocation, archivePath, downloadOptions)];
                case 1:
                    // Use Azure storage SDK to download caches hosted on Azure to improve speed and reliability.
                    _b.sent();
                    _b.label = 2;
                case 2:
                    if (!(s3Options && s3BucketName && cacheEntry.cacheKey)) return [3 /*break*/, 4];
                    return [4 /*yield*/, downloadUtils_1.downloadCacheStorageS3(cacheEntry.cacheKey, archivePath, s3Options, s3BucketName)];
                case 3:
                    _b.sent();
                    return [3 /*break*/, 6];
                case 4: 
                // Otherwise, download using the Actions http-client.
                return [4 /*yield*/, downloadUtils_1.downloadCacheHttpClient(archiveLocation, archivePath)];
                case 5:
                    // Otherwise, download using the Actions http-client.
                    _b.sent();
                    _b.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.downloadCache = downloadCache;
// Reserve Cache
function reserveCache(key, paths, options, s3Options, s3BucketName) {
    return __awaiter(this, void 0, void 0, function () {
        var httpClient, version, reserveCacheRequest, response;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (s3Options && s3BucketName) {
                        return [2 /*return*/, {
                                statusCode: 200,
                                result: null,
                                headers: {}
                            }];
                    }
                    httpClient = createHttpClient();
                    version = getCacheVersion(paths, options === null || options === void 0 ? void 0 : options.compressionMethod);
                    reserveCacheRequest = {
                        key: key,
                        version: version,
                        cacheSize: options === null || options === void 0 ? void 0 : options.cacheSize
                    };
                    return [4 /*yield*/, requestUtils_1.retryTypedResponse('reserveCache', function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2 /*return*/, httpClient.postJson(getCacheApiUrl('caches'), reserveCacheRequest)];
                            });
                        }); })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response];
            }
        });
    });
}
exports.reserveCache = reserveCache;
function getContentRange(start, end) {
    // Format: `bytes start-end/filesize
    // start and end are inclusive
    // filesize can be *
    // For a 200 byte chunk starting at byte 0:
    // Content-Range: bytes 0-199/*
    return "bytes " + start + "-" + end + "/*";
}
function uploadChunk(httpClient, resourceUrl, openStream, start, end) {
    return __awaiter(this, void 0, void 0, function () {
        var additionalHeaders, uploadChunkResponse;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    core.debug("Uploading chunk of size " + (end -
                        start +
                        1) + " bytes at offset " + start + " with content range: " + getContentRange(start, end));
                    additionalHeaders = {
                        'Content-Type': 'application/octet-stream',
                        'Content-Range': getContentRange(start, end)
                    };
                    return [4 /*yield*/, requestUtils_1.retryHttpClientResponse("uploadChunk (start: " + start + ", end: " + end + ")", function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2 /*return*/, httpClient.sendStream('PATCH', resourceUrl, openStream(), additionalHeaders)];
                            });
                        }); })];
                case 1:
                    uploadChunkResponse = _a.sent();
                    if (!requestUtils_1.isSuccessStatusCode(uploadChunkResponse.message.statusCode)) {
                        throw new Error("Cache service responded with " + uploadChunkResponse.message.statusCode + " during upload chunk.");
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function uploadFileS3(s3options, s3BucketName, archivePath, key, concurrency, maxChunkSize) {
    return __awaiter(this, void 0, void 0, function () {
        var fileStream, parallelUpload, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    core.debug("Start upload to S3 (bucket: " + s3BucketName + ")");
                    fileStream = fs.createReadStream(archivePath);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    parallelUpload = new lib_storage_1.Upload({
                        client: new client_s3_1.S3Client(s3options),
                        queueSize: concurrency,
                        partSize: maxChunkSize,
                        params: {
                            Bucket: s3BucketName,
                            Key: key,
                            Body: fileStream
                        }
                    });
                    parallelUpload.on("httpUploadProgress", function (progress) {
                        core.debug("Uploading chunk progress: " + JSON.stringify(progress));
                    });
                    return [4 /*yield*/, parallelUpload.done()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    throw new Error("Cache upload failed because " + error_1);
                case 4: return [2 /*return*/];
            }
        });
    });
}
function uploadFile(httpClient, cacheId, archivePath, key, options, s3options, s3BucketName) {
    return __awaiter(this, void 0, void 0, function () {
        var uploadOptions, concurrency, maxChunkSize, parallelUploads, offset, fileSize, resourceUrl, fd;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    uploadOptions = options_1.getUploadOptions(options);
                    concurrency = utils.assertDefined('uploadConcurrency', uploadOptions.uploadConcurrency);
                    maxChunkSize = utils.assertDefined('uploadChunkSize', uploadOptions.uploadChunkSize);
                    parallelUploads = __spreadArrays(new Array(concurrency).keys());
                    core.debug('Awaiting all uploads');
                    offset = 0;
                    if (!(s3options && s3BucketName)) return [3 /*break*/, 2];
                    return [4 /*yield*/, uploadFileS3(s3options, s3BucketName, archivePath, key, concurrency, maxChunkSize)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
                case 2:
                    fileSize = utils.getArchiveFileSizeInBytes(archivePath);
                    resourceUrl = getCacheApiUrl("caches/" + cacheId.toString());
                    fd = fs.openSync(archivePath, 'r');
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, , 5, 6]);
                    return [4 /*yield*/, Promise.all(parallelUploads.map(function () { return __awaiter(_this, void 0, void 0, function () {
                            var _loop_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _loop_1 = function () {
                                            var chunkSize, start, end;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        chunkSize = Math.min(fileSize - offset, maxChunkSize);
                                                        start = offset;
                                                        end = offset + chunkSize - 1;
                                                        offset += maxChunkSize;
                                                        return [4 /*yield*/, uploadChunk(httpClient, resourceUrl, function () {
                                                                return fs
                                                                    .createReadStream(archivePath, {
                                                                    fd: fd,
                                                                    start: start,
                                                                    end: end,
                                                                    autoClose: false
                                                                })
                                                                    .on('error', function (error) {
                                                                    throw new Error("Cache upload failed because file read failed with " + error.message);
                                                                });
                                                            }, start, end)];
                                                    case 1:
                                                        _a.sent();
                                                        return [2 /*return*/];
                                                }
                                            });
                                        };
                                        _a.label = 1;
                                    case 1:
                                        if (!(offset < fileSize)) return [3 /*break*/, 3];
                                        return [5 /*yield**/, _loop_1()];
                                    case 2:
                                        _a.sent();
                                        return [3 /*break*/, 1];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 5:
                    fs.closeSync(fd);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function commitCache(httpClient, cacheId, filesize) {
    return __awaiter(this, void 0, void 0, function () {
        var commitCacheRequest;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    commitCacheRequest = { size: filesize };
                    return [4 /*yield*/, requestUtils_1.retryTypedResponse('commitCache', function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2 /*return*/, httpClient.postJson(getCacheApiUrl("caches/" + cacheId.toString()), commitCacheRequest)];
                            });
                        }); })];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function saveCache(cacheId, archivePath, key, options, s3Options, s3BucketName) {
    return __awaiter(this, void 0, void 0, function () {
        var httpClient, cacheSize, commitCacheResponse;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    httpClient = createHttpClient();
                    core.debug('Upload cache');
                    return [4 /*yield*/, uploadFile(httpClient, cacheId, archivePath, key, options, s3Options, s3BucketName)
                        // Commit Cache
                    ];
                case 1:
                    _a.sent();
                    // Commit Cache
                    core.debug('Commiting cache');
                    cacheSize = utils.getArchiveFileSizeInBytes(archivePath);
                    core.info("Cache Size: ~" + Math.round(cacheSize / (1024 * 1024)) + " MB (" + cacheSize + " B)");
                    if (!!s3Options) return [3 /*break*/, 3];
                    return [4 /*yield*/, commitCache(httpClient, cacheId, cacheSize)];
                case 2:
                    commitCacheResponse = _a.sent();
                    if (!requestUtils_1.isSuccessStatusCode(commitCacheResponse.statusCode)) {
                        throw new Error("Cache service responded with " + commitCacheResponse.statusCode + " during commit cache.");
                    }
                    _a.label = 3;
                case 3:
                    core.info('Cache saved successfully');
                    return [2 /*return*/];
            }
        });
    });
}
exports.saveCache = saveCache;
