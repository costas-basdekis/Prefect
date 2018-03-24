const sglib = require("exports-loader?SG2Reader,Reader555!../../../textures/sglib.js")

export class SG2Manager {
    constructor(contentSg2, filenameSg2, content555, filename555) {
        this.sg2Reader = new sglib.SG2Reader(contentSg2, filenameSg2);
        this.reader555 = new sglib.Reader555(content555, filename555);
        this.sg2Reader.read();
    }

    loadRange({filename, start, count, key}, getOptions) {
        const bitmap = this.sg2Reader.bitmapsByFilename[filename];
        const images = bitmap.images.slice(start, start + count);
        const results = {};
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', {alpha: true, depth: true});

        for (const index in images) {
            const image = images[index];
            const loadedImage = this.reader555.readImage(image)
            const {width, height, data8} = loadedImage;
            const imageData = ctx.getImageData(0, 0, width, height);
            imageData.data.set(data8);
            ctx.putImageData(imageData, 0, 0);
            const href = canvas.toDataURL();
            const result = {href, width, height};
            Object.assign(result, getOptions(result) || result);
            results[`${key}#${index}`] = result;
        }

        return {[key]: results};
    }
}
