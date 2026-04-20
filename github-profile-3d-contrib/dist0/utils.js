"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toFixed = exports.toScale = exports.inertThousandSeparator = exports.toIsoDate = void 0;
const toIsoDate = (date) => date.toISOString().substring(0, 10);
exports.toIsoDate = toIsoDate;
const inertThousandSeparator = (value) => {
    if (value <= 9999) {
        // 4 digits or less, do not need to be separated.
        // e.g. "1234"
        return value.toFixed(0);
    }
    // 5 digits or more, separate each 3 digits with a space(SI format).
    // e.g. "12 345"
    return value.toFixed(0).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1 ');
};
exports.inertThousandSeparator = inertThousandSeparator;
/** Round large numbers */
const toScale = (value) => {
    if (value <= 9999) {
        // 0 - 9999
        return value.toFixed(0);
    }
    else if (value <= 999999) {
        // 10K - 999K
        return Math.floor(value / 1000).toFixed(0) + 'K';
    }
    else {
        return '1M+';
    }
};
exports.toScale = toScale;
/** Round to two decimal places. */
const toFixed = (value) => +value.toFixed(2);
exports.toFixed = toFixed;
//# sourceMappingURL=utils.js.map