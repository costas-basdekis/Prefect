import { TextureManager } from './TextureManager.js'
import { SG2Reader, Reader555 } from './sglib.js';

export class SG2Manager extends TextureManager {
    constructor(contentSg2, filenameSg2, content555, filename555) {
        super();
        this.sg2Reader = new SG2Reader(contentSg2, filenameSg2);
        this.reader555 = new Reader555(content555, filename555);
        this.sg2Reader.read();
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', {alpha: true, depth: true});
    }

    readImage({filename, index}) {
        const bitmap = this.sg2Reader.bitmapsByFilename[filename];
        const image = bitmap.images[index];

        const loadedImage = this.reader555.readImage(image)
        const {width, height, data8} = loadedImage;
        const imageData = this.ctx.getImageData(0, 0, width, height);
        imageData.data.set(data8);
        this.ctx.putImageData(imageData, 0, 0);
        const href = this.canvas.toDataURL();
        this.ctx.clearRect(0, 0, width, height);
        return {href, width, height};
    }
}
