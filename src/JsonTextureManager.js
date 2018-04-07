import { TextureManager } from './TextureManager.js'

export class JsonTextureManager extends TextureManager {
    constructor(content) {
        super();
        this.content = JSON.parse(content);
    }

    readImage({cacheKey}) {
        if (!(cacheKey in this.content)) {
            throw new Error(
                `Cache key "${cacheKey}" not found in JSON textures`);
        }
        return this.content[cacheKey];
    }
}
