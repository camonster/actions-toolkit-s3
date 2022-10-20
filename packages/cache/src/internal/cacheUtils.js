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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
exports.__esModule = true;
var core = require("@actions/core");
var exec = require("@actions/exec");
var glob = require("@actions/glob");
var io = require("@actions/io");
var fs = require("fs");
var path = require("path");
var semver = require("semver");
var util = require("util");
var uuid_1 = require("uuid");
var constants_1 = require("./constants");
// From https://github.com/actions/toolkit/blob/main/packages/tool-cache/src/tool-cache.ts#L23
function createTempDirectory() {
    return __awaiter(this, void 0, void 0, function () {
        var IS_WINDOWS, tempDirectory, baseLocation, dest;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    IS_WINDOWS = process.platform === 'win32';
                    tempDirectory = process.env['RUNNER_TEMP'] || '';
                    if (!tempDirectory) {
                        baseLocation = void 0;
                        if (IS_WINDOWS) {
                            // On Windows use the USERPROFILE env variable
                            baseLocation = process.env['USERPROFILE'] || 'C:\\';
                        }
                        else {
                            if (process.platform === 'darwin') {
                                baseLocation = '/Users';
                            }
                            else {
                                baseLocation = '/home';
                            }
                        }
                        tempDirectory = path.join(baseLocation, 'actions', 'temp');
                    }
                    dest = path.join(tempDirectory, uuid_1.v4());
                    return [4 /*yield*/, io.mkdirP(dest)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, dest];
            }
        });
    });
}
exports.createTempDirectory = createTempDirectory;
function getArchiveFileSizeInBytes(filePath) {
    return fs.statSync(filePath).size;
}
exports.getArchiveFileSizeInBytes = getArchiveFileSizeInBytes;
function resolvePaths(patterns) {
    var e_1, _a;
    var _b;
    return __awaiter(this, void 0, void 0, function () {
        var paths, workspace, globber, _c, _d, file, relativeFile, e_1_1;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    paths = [];
                    workspace = (_b = process.env['GITHUB_WORKSPACE']) !== null && _b !== void 0 ? _b : process.cwd();
                    return [4 /*yield*/, glob.create(patterns.join('\n'), {
                            implicitDescendants: false
                        })];
                case 1:
                    globber = _e.sent();
                    _e.label = 2;
                case 2:
                    _e.trys.push([2, 7, 8, 13]);
                    _c = __asyncValues(globber.globGenerator());
                    _e.label = 3;
                case 3: return [4 /*yield*/, _c.next()];
                case 4:
                    if (!(_d = _e.sent(), !_d.done)) return [3 /*break*/, 6];
                    file = _d.value;
                    relativeFile = path
                        .relative(workspace, file)
                        .replace(new RegExp("\\" + path.sep, 'g'), '/');
                    core.debug("Matched: " + relativeFile);
                    // Paths are made relative so the tar entries are all relative to the root of the workspace.
                    paths.push("" + relativeFile);
                    _e.label = 5;
                case 5: return [3 /*break*/, 3];
                case 6: return [3 /*break*/, 13];
                case 7:
                    e_1_1 = _e.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 13];
                case 8:
                    _e.trys.push([8, , 11, 12]);
                    if (!(_d && !_d.done && (_a = _c["return"]))) return [3 /*break*/, 10];
                    return [4 /*yield*/, _a.call(_c)];
                case 9:
                    _e.sent();
                    _e.label = 10;
                case 10: return [3 /*break*/, 12];
                case 11:
                    if (e_1) throw e_1.error;
                    return [7 /*endfinally*/];
                case 12: return [7 /*endfinally*/];
                case 13: return [2 /*return*/, paths];
            }
        });
    });
}
exports.resolvePaths = resolvePaths;
function unlinkFile(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, util.promisify(fs.unlink)(filePath)];
        });
    });
}
exports.unlinkFile = unlinkFile;
function getVersion(app) {
    return __awaiter(this, void 0, void 0, function () {
        var versionOutput, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    core.debug("Checking " + app + " --version");
                    versionOutput = '';
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, exec.exec(app + " --version", [], {
                            ignoreReturnCode: true,
                            silent: true,
                            listeners: {
                                stdout: function (data) { return (versionOutput += data.toString()); },
                                stderr: function (data) { return (versionOutput += data.toString()); }
                            }
                        })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    core.debug(err_1.message);
                    return [3 /*break*/, 4];
                case 4:
                    versionOutput = versionOutput.trim();
                    core.debug(versionOutput);
                    return [2 /*return*/, versionOutput];
            }
        });
    });
}
// Use zstandard if possible to maximize cache performance
function getCompressionMethod() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, versionOutput, version;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = process.platform === 'win32';
                    if (!_a) return [3 /*break*/, 2];
                    return [4 /*yield*/, isGnuTarInstalled()];
                case 1:
                    _a = !(_b.sent());
                    _b.label = 2;
                case 2:
                    if (_a) {
                        // Disable zstd due to bug https://github.com/actions/cache/issues/301
                        return [2 /*return*/, constants_1.CompressionMethod.Gzip];
                    }
                    return [4 /*yield*/, getVersion('zstd')];
                case 3:
                    versionOutput = _b.sent();
                    version = semver.clean(versionOutput);
                    if (!versionOutput.toLowerCase().includes('zstd command line interface')) {
                        // zstd is not installed
                        return [2 /*return*/, constants_1.CompressionMethod.Gzip];
                    }
                    else if (!version || semver.lt(version, 'v1.3.2')) {
                        // zstd is installed but using a version earlier than v1.3.2
                        // v1.3.2 is required to use the `--long` options in zstd
                        return [2 /*return*/, constants_1.CompressionMethod.ZstdWithoutLong];
                    }
                    else {
                        return [2 /*return*/, constants_1.CompressionMethod.Zstd];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.getCompressionMethod = getCompressionMethod;
function getCacheFileName(compressionMethod) {
    return compressionMethod === constants_1.CompressionMethod.Gzip
        ? constants_1.CacheFilename.Gzip
        : constants_1.CacheFilename.Zstd;
}
exports.getCacheFileName = getCacheFileName;
function isGnuTarInstalled() {
    return __awaiter(this, void 0, void 0, function () {
        var versionOutput;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getVersion('tar')];
                case 1:
                    versionOutput = _a.sent();
                    return [2 /*return*/, versionOutput.toLowerCase().includes('gnu tar')];
            }
        });
    });
}
exports.isGnuTarInstalled = isGnuTarInstalled;
function assertDefined(name, value) {
    if (value === undefined) {
        throw Error("Expected " + name + " but value was undefiend");
    }
    return value;
}
exports.assertDefined = assertDefined;
function isGhes() {
    var ghUrl = new URL(process.env['GITHUB_SERVER_URL'] || 'https://github.com');
    return ghUrl.hostname.toUpperCase() !== 'GITHUB.COM';
}
exports.isGhes = isGhes;
