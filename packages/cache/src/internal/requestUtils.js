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
var constants_1 = require("./constants");
function isSuccessStatusCode(statusCode) {
    if (!statusCode) {
        return false;
    }
    return statusCode >= 200 && statusCode < 300;
}
exports.isSuccessStatusCode = isSuccessStatusCode;
function isServerErrorStatusCode(statusCode) {
    if (!statusCode) {
        return true;
    }
    return statusCode >= 500;
}
exports.isServerErrorStatusCode = isServerErrorStatusCode;
function isRetryableStatusCode(statusCode) {
    if (!statusCode) {
        return false;
    }
    var retryableStatusCodes = [
        http_client_1.HttpCodes.BadGateway,
        http_client_1.HttpCodes.ServiceUnavailable,
        http_client_1.HttpCodes.GatewayTimeout
    ];
    return retryableStatusCodes.includes(statusCode);
}
exports.isRetryableStatusCode = isRetryableStatusCode;
function sleep(milliseconds) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) { return setTimeout(resolve, milliseconds); })];
        });
    });
}
function retry(name, method, getStatusCode, maxAttempts, delay, onError) {
    if (maxAttempts === void 0) { maxAttempts = constants_1.DefaultRetryAttempts; }
    if (delay === void 0) { delay = constants_1.DefaultRetryDelay; }
    if (onError === void 0) { onError = undefined; }
    return __awaiter(this, void 0, void 0, function () {
        var errorMessage, attempt, response, statusCode, isRetryable, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    errorMessage = '';
                    attempt = 1;
                    _a.label = 1;
                case 1:
                    if (!(attempt <= maxAttempts)) return [3 /*break*/, 7];
                    response = undefined;
                    statusCode = undefined;
                    isRetryable = false;
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, method()];
                case 3:
                    response = _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    if (onError) {
                        response = onError(error_1);
                    }
                    isRetryable = true;
                    errorMessage = error_1.message;
                    return [3 /*break*/, 5];
                case 5:
                    if (response) {
                        statusCode = getStatusCode(response);
                        if (!isServerErrorStatusCode(statusCode)) {
                            return [2 /*return*/, response];
                        }
                    }
                    if (statusCode) {
                        isRetryable = isRetryableStatusCode(statusCode);
                        errorMessage = "Cache service responded with " + statusCode;
                    }
                    core.debug(name + " - Attempt " + attempt + " of " + maxAttempts + " failed with error: " + errorMessage);
                    if (!isRetryable) {
                        core.debug(name + " - Error is not retryable");
                        return [3 /*break*/, 7];
                    }
                    return [4 /*yield*/, sleep(delay)];
                case 6:
                    _a.sent();
                    attempt++;
                    return [3 /*break*/, 1];
                case 7: throw Error(name + " failed: " + errorMessage);
            }
        });
    });
}
exports.retry = retry;
function retryTypedResponse(name, method, maxAttempts, delay) {
    if (maxAttempts === void 0) { maxAttempts = constants_1.DefaultRetryAttempts; }
    if (delay === void 0) { delay = constants_1.DefaultRetryDelay; }
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, retry(name, method, function (response) { return response.statusCode; }, maxAttempts, delay, 
                    // If the error object contains the statusCode property, extract it and return
                    // an TypedResponse<T> so it can be processed by the retry logic.
                    function (error) {
                        if (error instanceof http_client_1.HttpClientError) {
                            return {
                                statusCode: error.statusCode,
                                result: null,
                                headers: {},
                                error: error
                            };
                        }
                        else {
                            return undefined;
                        }
                    })];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
exports.retryTypedResponse = retryTypedResponse;
function retryHttpClientResponse(name, method, maxAttempts, delay) {
    if (maxAttempts === void 0) { maxAttempts = constants_1.DefaultRetryAttempts; }
    if (delay === void 0) { delay = constants_1.DefaultRetryDelay; }
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, retry(name, method, function (response) { return response.message.statusCode; }, maxAttempts, delay)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
exports.retryHttpClientResponse = retryHttpClientResponse;
