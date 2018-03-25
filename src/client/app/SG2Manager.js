const sglib = require("exports-loader?SG2Reader,Reader555!../../../textures/sglib.js")
import { dict } from './utils.js'

export class SG2Manager {
    constructor(contentSg2, filenameSg2, content555, filename555) {
        this.sg2Reader = new sglib.SG2Reader(contentSg2, filenameSg2);
        this.reader555 = new sglib.Reader555(content555, filename555);
        this.sg2Reader.read();
        this.imageCache = new Map();
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', {alpha: true, depth: true});
    }

    loadList(definitions) {
        return Object.assign({}, ...definitions
            .map(method => method(this)));
    }

    loadRange({filename, start, count, key}, getOptions) {
        const bitmap = this.sg2Reader.bitmapsByFilename[filename];
        const images = bitmap.images.slice(start, start + count);
        const results = {};

        for (const index in images) {
            const image = images[index];
            const result = this.loadImage(image, getOptions);
            results[`${key}#${index}`] = result;
        }

        return {[key]: results};
    }

    loadImage(image, getOptions) {
        if (!this.imageCache.has(image)) {
            const loadedImage = this.reader555.readImage(image)
            const {width, height, data8} = loadedImage;
            const imageData = this.ctx.getImageData(0, 0, width, height);
            imageData.data.set(data8);
            this.ctx.putImageData(imageData, 0, 0);
            const href = this.canvas.toDataURL();
            const result = {href, width, height};
            Object.assign(result, getOptions(result) || result);
            this.ctx.clearRect(0, 0, width, height);
            this.imageCache.set(image, result);
        }

        return this.imageCache.get(image);
    }

    loadDefinitions(definitions) {
        const texturesByKey = Object.assign({}, ...definitions
                .map(definition => definition(this)))
        const textures = Object.assign({}, ...Object.values(texturesByKey));
        const texturesKeys = dict(Object.entries(texturesByKey)
            .map(([key, items]) => [key, Object.keys(items)]));

        return {textures, texturesKeys};
    }

    getImageReference(texturesKeys, key, randomValue) {
        const keys = texturesKeys[key];
        if (!keys) {
            console.warn(`Could not find textures from key "${key}"`);
            return null;
        }

        if (!keys.length) {
            console.warn(`There were no keys for "${key}"`);
            return null;
        }

        if (!randomValue && randomValue !== 0) {
            console.warn(`An invalid randomValue was passed: "${randomValue}"`);
        }

        const index = (randomValue || 0) % keys.length;
        if (!(index in keys)) {
            console.warn(
                `Could not find texture indexed "${index}": not between 0 and `
                + `${keys.length - 1}`);
            return null;
        }

        return keys[index];
    }
}
