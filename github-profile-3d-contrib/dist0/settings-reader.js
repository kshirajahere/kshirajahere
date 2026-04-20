"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readSettingJson = void 0;
const fs_1 = require("fs");
const readSettingJson = (filePath) => {
    const content = (0, fs_1.readFileSync)(filePath, {
        encoding: 'utf8',
        flag: 'r',
    });
    return JSON.parse(content);
};
exports.readSettingJson = readSettingJson;
//# sourceMappingURL=settings-reader.js.map