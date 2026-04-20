"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.create3DContrib = exports.addDefines = void 0;
const d3 = __importStar(require("d3"));
const util = __importStar(require("./utils"));
const ANGLE = 30;
const DARKER_RIGHT = 1;
const DARKER_LEFT = 0.5;
const DARKER_TOP = 0;
const toEpochDays = (date) => Math.floor(date.getTime() / (24 * 60 * 60 * 1000));
const addNormalColor = (path, contribLevel, panel) => {
    path.attr('class', `cont-${panel}-${contribLevel}`);
};
const decideSeasonPatternNo = (date) => {
    const sunday = new Date(date.getTime());
    sunday.setDate(sunday.getDate() - sunday.getDay());
    const month = sunday.getUTCMonth();
    const dayOfMonth = sunday.getUTCDate();
    const diff = dayOfMonth <= 7
        ? 0
        : dayOfMonth <= 14
            ? 1
            : dayOfMonth <= 21
                ? 2
                : dayOfMonth <= 28
                    ? 3
                    : 4;
    switch (month + 1) {
        case 9:
            // summer -> autumn = 0-4
            return 0 + diff;
        case 10:
        case 11:
            // autumn = 4
            return 4;
        case 12:
            // autumn -> winter = 5-9
            return 5 + diff;
        case 1:
        case 2:
            // winter = 9
            return 9;
        case 3:
            // winter -> spring = 10-14
            return 10 + diff;
        case 4:
        case 5:
            // spring = 14
            return 14;
        case 6:
            // spring -> summer = 15-19
            return 15 + diff;
        case 7:
        case 8:
        default:
            // summer = 19
            return 19;
    }
};
const addSeasonColor = (path, contribLevel, panel, date) => {
    const pattern = decideSeasonPatternNo(date);
    path.attr('class', `cont-${panel}-p${pattern}-${contribLevel}`);
};
const addRainbowColor = (path, contribLevel, settings, darker, week) => {
    const offsetHue = week * settings.hueRatio;
    const saturation = settings.saturation;
    const lightness = settings.contribLightness[contribLevel];
    const values = [...Array(7)]
        .map((_, i) => (i * 60 + offsetHue) % 360)
        .map((hue) => `hsl(${hue},${saturation},${lightness})`)
        .map((c) => d3.rgb(c).darker(darker).toString())
        .join(';');
    path.append('animate')
        .attr('attributeName', 'fill')
        .attr('values', values)
        .attr('dur', settings.duration)
        .attr('repeatCount', 'indefinite');
};
const addBitmapPattern = (path, contributionLevel, panel) => {
    path.attr('fill', `url(#pattern_${contributionLevel}_${panel})`);
};
const atan = (value) => (Math.atan(value) * 360) / 2 / Math.PI;
const addPatternForBitmap = (defs, panelPattern, contributionLevel, panel) => {
    const width = Math.max(1, panelPattern.width);
    const height = Math.max(1, panelPattern.bitmap.length);
    const pattern = defs
        .append('pattern')
        .attr('id', `pattern_${contributionLevel}_${panel}`)
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', height)
        .attr('patternUnits', 'userSpaceOnUse');
    pattern
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', height)
        .attr('class', `cont-${panel}-bg-${contributionLevel}`);
    const path = d3.path();
    for (const [y, bitmapValue] of panelPattern.bitmap.entries()) {
        const bitmap = typeof bitmapValue === 'string'
            ? parseInt(bitmapValue, 16)
            : bitmapValue;
        for (let x = 0; x < width; x++) {
            if ((bitmap & (1 << (width - x - 1))) !== 0) {
                path.rect(x, y, 1, 1);
            }
        }
    }
    pattern
        .append('path')
        .attr('stroke', 'none')
        .attr('class', `cont-${panel}-fg-${contributionLevel}`)
        .attr('d', path.toString());
};
const addDefines = (svg, settings) => {
    if (settings.type === 'bitmap') {
        const defs = svg.append('defs');
        for (const [contribLevel, info] of settings.contribPatterns.entries()) {
            addPatternForBitmap(defs, info.top, contribLevel, 'top');
            addPatternForBitmap(defs, info.left, contribLevel, 'left');
            addPatternForBitmap(defs, info.right, contribLevel, 'right');
        }
    }
};
exports.addDefines = addDefines;
const create3DContrib = (svg, userInfo, x, y, width, height, settings, isForcedAnimation = false) => {
    var _a;
    if (userInfo.contributionCalendar.length === 0) {
        return;
    }
    const firstDate = userInfo.contributionCalendar[0].date;
    const sundayOfFirstWeek = toEpochDays(firstDate) - firstDate.getUTCDay();
    const weekcount = Math.ceil((userInfo.contributionCalendar.length + firstDate.getUTCDay()) / 7.0);
    const dx = width / 64;
    const dy = dx * Math.tan(ANGLE * ((2 * Math.PI) / 360));
    const dxx = dx * 0.9;
    const dyy = dy * 0.9;
    const offsetX = dx * 7;
    const offsetY = height - (weekcount + 7) * dy;
    const group = svg.append('g');
    const maxContribCount = Math.max(...userInfo.contributionCalendar.map(c => c.contributionCount));
    const highestBlockDate = (_a = userInfo.contributionCalendar.slice().reverse().find(c => c.contributionCount === maxContribCount)) === null || _a === void 0 ? void 0 : _a.date.getTime();
    userInfo.contributionCalendar.forEach((cal) => {
        const week = Math.floor((toEpochDays(cal.date) - sundayOfFirstWeek) / 7);
        const dayOfWeek = cal.date.getUTCDay(); // sun = 0, mon = 1, ...
        const baseX = offsetX + (week - dayOfWeek) * dx;
        const baseY = offsetY + (week + dayOfWeek) * dy;
        // ref. https://github.com/yoshi389111/github-profile-3d-contrib/issues/27
        const calHeight = Math.log10(cal.contributionCount / 20 + 1) * 144 + 3;
        const contribLevel = cal.contributionLevel;
        const isAnimate = settings.growingAnimation || isForcedAnimation;
        const bar = group
            .append('g')
            .attr('transform', `translate(${util.toFixed(baseX)} ${util.toFixed(baseY - calHeight)})`);
        if (isAnimate && contribLevel !== 0) {
            bar.append('animateTransform')
                .attr('attributeName', 'transform')
                .attr('type', 'translate')
                .attr('values', `${util.toFixed(baseX)} ${util.toFixed(baseY - 3)};${util.toFixed(baseX)} ${util.toFixed(baseY - calHeight)}`)
                .attr('dur', '3s')
                .attr('repeatCount', '1');
        }
        const widthTop = settings.type === 'bitmap'
            ? Math.max(1, settings.contribPatterns[contribLevel].top.width)
            : dxx;
        const topPanel = bar
            .append('rect')
            .attr('stroke', 'none')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', util.toFixed(widthTop))
            .attr('height', util.toFixed(widthTop))
            .attr('transform', `skewY(${-ANGLE}) skewX(${util.toFixed(atan(dxx / 2 / dyy))}) scale(${util.toFixed(dxx / widthTop)} ${util.toFixed((2 * dyy) / widthTop)})`);
        if (settings.type === 'normal') {
            addNormalColor(topPanel, contribLevel, 'top');
        }
        else if (settings.type === 'season') {
            addSeasonColor(topPanel, contribLevel, 'top', cal.date);
        }
        else if (settings.type === 'rainbow') {
            addRainbowColor(topPanel, contribLevel, settings, DARKER_TOP, week);
        }
        else if (settings.type === 'bitmap') {
            addBitmapPattern(topPanel, contribLevel, 'top');
        }
        const widthLeft = settings.type === 'bitmap'
            ? Math.max(1, settings.contribPatterns[contribLevel].left.width)
            : dxx;
        const scaleLeft = Math.sqrt(dxx ** 2 + dyy ** 2) / widthLeft;
        const heightLeft = calHeight / scaleLeft;
        const leftPanel = bar
            .append('rect')
            .attr('stroke', 'none')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', util.toFixed(widthLeft))
            .attr('height', util.toFixed(heightLeft))
            .attr('transform', `skewY(${ANGLE}) scale(${util.toFixed(dxx / widthLeft)} ${util.toFixed(scaleLeft)})`);
        if (settings.type === 'normal') {
            addNormalColor(leftPanel, contribLevel, 'left');
        }
        else if (settings.type === 'season') {
            addSeasonColor(leftPanel, contribLevel, 'left', cal.date);
        }
        else if (settings.type === 'rainbow') {
            addRainbowColor(leftPanel, contribLevel, settings, DARKER_LEFT, week);
        }
        else if (settings.type === 'bitmap') {
            addBitmapPattern(leftPanel, contribLevel, 'left');
        }
        if (isAnimate && contribLevel !== 0) {
            leftPanel
                .append('animate')
                .attr('attributeName', 'height')
                .attr('values', `${util.toFixed(3 / scaleLeft)};${util.toFixed(heightLeft)}`)
                .attr('dur', '3s')
                .attr('repeatCount', '1');
        }
        const widthRight = settings.type === 'bitmap'
            ? Math.max(1, settings.contribPatterns[contribLevel].right.width)
            : dxx;
        const scaleRight = Math.sqrt(dxx ** 2 + dyy ** 2) / widthRight;
        const heightRight = calHeight / scaleRight;
        const rightPanel = bar
            .append('rect')
            .attr('stroke', 'none')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', util.toFixed(widthRight))
            .attr('height', util.toFixed(heightRight))
            .attr('transform', `translate(${util.toFixed(dxx)} ${util.toFixed(dyy)}) skewY(${-ANGLE}) scale(${util.toFixed(dxx / widthRight)} ${util.toFixed(scaleRight)})`);
        if (settings.type === 'normal') {
            addNormalColor(rightPanel, contribLevel, 'right');
        }
        else if (settings.type === 'season') {
            addSeasonColor(rightPanel, contribLevel, 'right', cal.date);
        }
        else if (settings.type === 'rainbow') {
            addRainbowColor(rightPanel, contribLevel, settings, DARKER_RIGHT, week);
        }
        else if (settings.type === 'bitmap') {
            addBitmapPattern(rightPanel, contribLevel, 'right');
        }
        if (isAnimate && contribLevel !== 0) {
            rightPanel
                .append('animate')
                .attr('attributeName', 'height')
                .attr('values', `${util.toFixed(3 / scaleRight)};${util.toFixed(heightRight)}`)
                .attr('dur', '3s')
                .attr('repeatCount', '1');
        }
        // Add character on top of the highest contribution block
        if (cal.contributionCount === maxContribCount && cal.contributionCount > 0 && cal.date.getTime() === highestBlockDate) {
            const charWidth = dxx * 8; // Scale character relative to block size
            const charHeight = charWidth;
            const xPos = dxx - (charWidth / 2);
            const yPos = -charHeight + (dyy * 2); // Placed right on the peak
            // A floating or bouncing animation for the character
            const character = bar.append('image')
                .attr('href', 'https://sdk.bitmoji.com/render/panel/10214842-100234057829_2-s5-v1.png?transparent=1&palette=1') // Default female bitmoji sitting or waving
                .attr('x', util.toFixed(xPos))
                .attr('y', util.toFixed(yPos))
                .attr('width', util.toFixed(charWidth))
                .attr('height', util.toFixed(charHeight));
            if (isAnimate) {
                // Add a floating animation to the character
                character.append('animateTransform')
                    .attr('attributeName', 'transform')
                    .attr('type', 'translate')
                    .attr('values', `0,0; 0,-10; 0,0`)
                    .attr('dur', '2s')
                    .attr('repeatCount', 'indefinite');
            }
        }
    });
};
exports.create3DContrib = create3DContrib;
//# sourceMappingURL=create-3d-contrib.js.map