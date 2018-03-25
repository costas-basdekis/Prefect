import { dict, range } from './utils.js'

export class TextureManager {
    constructor() {
        this.imageCache = new Map();
        this.definitionsCache = new Map();
    }

    loadList(definitions) {
        return Object.assign({}, ...definitions
            .map(method => method(this)));
    }

    loadRange({start, count, key, ...imageParams}, getOptions) {
        const results = {};

        const indexes = range(start, start + count);
        for (const variantIndex in indexes) {
            const index = indexes[variantIndex]
            const cacheKey = `${key}#${variantIndex}`;
            const result = this.loadImage({cacheKey, index, ...imageParams}, getOptions);
            results[cacheKey] = result;
        }

        return {[key]: results};
    }

    loadImage({cacheKey, ...imageParams}, getOptions) {
        if (!this.imageCache.has(cacheKey)) {
            let result;
            try {
                result = this.readImage({cacheKey, ...imageParams});
            } catch (e) {
                console.error(
                    `Error while getting image for "${cacheKey}":`, e);
                result = {width: 1, height: 1, data8: new Uint8Array([])};
            }
            Object.assign(result, getOptions(result) || {});
            this.imageCache.set(cacheKey, result);
        }

        return this.imageCache.get(cacheKey);
    }

    readImage(image) {
        throw new Error("Not implemented");
    }

    loadDefinitions(definitions) {
        if (!this.definitionsCache.has(definitions)) {
            const texturesByKey = Object.assign({}, ...definitions
                    .map(definition => definition(this)))
            const textures = Object.assign({}, ...Object.values(texturesByKey));
            const texturesKeys = dict(Object.entries(texturesByKey)
                .map(([key, items]) => [key, Object.keys(items)]));

            this.definitionsCache.set(definitions, {textures, texturesKeys});
        }

        return this.definitionsCache.get(definitions);
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
