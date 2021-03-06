// SG2 library in C:
// https://github.com/lclarkmichalek/libsg/
// SG2 reader program in C++:
// https://github.com/lclarkmichalek/sgreader/

const SG_HEADER_SIZE = 680;
const SG_BITMAP_RECORD_SIZE = 200;

const ISOMETRIC_TILE_WIDTH = 58;
const ISOMETRIC_TILE_HEIGHT = 30;
const ISOMETRIC_TILE_BYTES = 1800;
const ISOMETRIC_LARGE_TILE_WIDTH = 78;
const ISOMETRIC_LARGE_TILE_HEIGHT = 40;
const ISOMETRIC_LARGE_TILE_BYTES = 3200;

export class SG2Reader {
    constructor(content, filename, reader555=null) {
        this.stream = new Stream(content, filename);
        this.reader555 = reader555;
        this.header = null;
        this.bitmaps = null;
        this.bitmapsByFilename = null;
        this.images = null;
    }

    read() {
        const header = this.readHeader();
        const bitmaps = this.readBitmaps(header);
        const bitmapsByFilename = {};
        for (const bitmap of bitmaps) {
            bitmapsByFilename[bitmap.record.filename] = bitmap;
        }
        this.stream.seek(SG_HEADER_SIZE
            + this.maxBitmapRecords(header) * SG_BITMAP_RECORD_SIZE);
        const images =  this.readImages(header, bitmaps, header.version >= 0xd6);

        Object.assign(this, {
            header,
            bitmaps,
            bitmapsByFilename,
            images,
        });

        return {
            header,
            bitmaps,
            bitmapsByFilename,
            images,
        };
    }

    readHeader() {
        const header = this.stream.readDict([
            ["sg_filesize", "readUInt32LE"],
            ["version", "readUInt32LE"],
            ["unknown1", "readUInt32LE"],
            ["max_image_records", "readInt32LE"],
            ["num_image_records", "readInt32LE"],
            ["num_bitmap_records", "readInt32LE"],
            ["num_bitmap_records_without_system", "readInt32LE"],
            ["total_filesize", "readUInt32LE"],
            ["filesize_555", "readUInt32LE"],
            ["filesize_external", "readUInt32LE"],
            [undefined, "skip", [640]],
        ]);

        try {
            this.checkVersion(header);
        } catch (e) {
            header.error = e.toString();
        }

        return header;
    }

    readBitmaps(header) {
        const bitmaps = [];

        for (let index = 0 ; index < header.num_bitmap_records ; index++) {
            bitmaps.push(this.readBitmap(index));
        }

        return bitmaps;
    }

    readBitmap(index) {
        return {
            images: [],
            images_n: 0,
            images_c: 0,
            record: this.stream.readDict([
                ["filename", "readString", [65]],
                ["comment", "readString", [51]],
                ["width", "readUInt32LE"],
                ["height", "readUInt32LE"],
                ["num_images", "readUInt32LE"],
                ["start_index", "readUInt32LE"],
                ["end_index", "readUInt32LE"],
                ["index", "readUInt32LE"],
                ["unknown1", "readUInt32LE"],
                ["unknown2", "readUInt32LE"],
                ["unknown3", "readUInt32LE"],
                ["unknown4", "readUInt32LE"],
                ["real_width", "readUInt32LE"],
                ["real_height", "readUInt32LE"],
                ["internal1", "readUInt32LE"],
                ["internal2", "readUInt32LE"],
                ["internal3", "readUInt32LE"],
                [undefined, "skip", [24]],
            ]),
            filename: this.stream.filename,
            bitmapId: index,
        };
    }

    readImages(header, bitmaps, includeAlpha) {
        // The first one is a dummy/null record
        this.readImage(0, includeAlpha);

        const images = [];
        for (let index = 0 ; index < header.num_image_records ; index++) {
            const image = this.readImage(index + 1, includeAlpha);
            images.push(image);
        }

        for (const index in images) {
            const image = images[index];
            const {invert_offset} = image.workRecord;
            const invertIndex = index + invert_offset;
            if (0 <= invertIndex && invertIndex < index) {
                image.workRecord = images[invertIndex];
            }
            const {bitmap_id} = image.workRecord;
            if (0 <= bitmap_id && bitmap_id < bitmaps.length) {
                bitmaps[bitmap_id].images.push(image);
                image.parent = bitmaps[bitmap_id];
            }
        }

        return images;
    }

    readImage(index, includeAlpha) {
        const image = {
            parent: null,
            error: null,
            imageId: index,
            record: this.stream.readDict([
                ["offset", "readUInt32LE"],
                ["length", "readUInt32LE"],
                ["uncompressed_length", "readUInt32LE"],
                [undefined, "skip", [4]], // 4 zero bytes
                ["invert_offset", "readInt32LE"],
                ["width", "readInt16LE"],
                ["height", "readInt16LE"],
                // 26 unknown bytes, mostly zero, first four are 2 shorts
                [undefined, "skip", [26]],
                ["type", "readInt16LE"],
                ["flags", "readList", [[
                    ["readChar"],
                    ["readChar"],
                    ["readChar"],
                    ["readChar"],
                ]]],
                ["bitmap_id", "readUInt8LE"],
                [undefined, "skip", [7]], // 3 bytes + 4 zero bytes
            ]),
        };
        image.invert = !!image.record.invert_offset;
        // For D6 and up SG3 versions: alpha masks
        if (includeAlpha) {
            Object.assign(image.record, this.stream.readDict([
                ["alpha_offset", "readUInt32LE"],
                ["alpha_length", "readUInt32LE"],
            ]));
        } else {
            Object.assign(image.record, {
                alpha_offset: 0,
                alpha_length: 0,
            });
        }

        image.workRecord = image.record;

        return image
    }

    maxBitmapRecords(header) {
        if (header.version === 0xd3) {
            return 100; // SG2
        } else {
            return 200; // SG3
        }
    }

    checkVersion(header) {
        if (header.version === 0xd3) {
            // SG2 file: filesize = 74480 or 522680 (depending on whether
            // it's a "normal" sg2 or an enemy sg2
            if (header.sg_filesize === 74480
                || header.sg_filesize === 522680) {
                return true;
            } else {
                throw new Error(
                    `Expected reported file size to be 74480 or 522680, `
                    + `but was ${header.sg_filesize}`)
            }
        } else if (header.version === 0xd5 || header.version === 0xd6) {
            // SG3 file: filesize = the actual size of the sg3 file
            if (header.sg_filesize === 74480
                || this.stream.length === header.sg_filesize) {
                return true;
            } else {
                throw new Error(
                    `Expected reported file size to be 74480 or equal to `
                    + `the actual file size(${this.stream.length}), but `
                    + `was ${header.sg_filesize}`);
            }
        } else {
            throw new Error(
                `Expected version to be 0xd3, 0xd5, or 0xd6, but was `
                + `0x${header.version.toString(16)}`);
        }
    }
}

export class Reader555 {
    constructor(content, filename) {
        this.stream = new Stream(content, filename);
    }

    readImage(image) {
        if (image.workRecord.width <=0 || image.workRecord.height <= 0) {
            throw new Error(
                `Width or height invalid: `
                + `${image.workRecord.width}x${image.workRecord.height}`)
        }
        if (image.workRecord.length <= 0) {
            throw new Error(
                `No image data available, length is `
                + `${image.workRecord.length}`)
        }

        const buffer = this.fillBuffer(image);
        const pixels = new Uint32Array(
            image.workRecord.width * image.workRecord.height);

        switch (image.workRecord.type) {
            case 0:
            case 1:
            case 10:
            case 12:
            case 13:
                this.readPlainImage(image, pixels, buffer)
                break;
            case 30:
                this.readIsometricImage(image, pixels, buffer)
                break;
            case 256:
            case 257:
            case 276:
                this.readSpriteImage(image, pixels, buffer)
                break;
            default:
                throw new Error(`Uknown image type ${image.workRecord.type}`);
        }

        if (image.workRecord.alpha_length) {
            this.loadAlphaMask(
                image, pixels, buffer, image.workRecord.length);
        }

        if (image.invert) {
            this.mirrorImage(image, pixels);
        }

        return {
            width: image.workRecord.width,
            height: image.workRecord.height,
            rMask: 0x000000ff,
            gMask: 0x0000ff00,
            bMask: 0x00ff0000,
            aMask: 0xff000000,
            data: pixels,
            data8: this.pixelsTo8(pixels),
        };
    }

    pixelsTo8(pixels) {
        const pixels8 = new Uint8ClampedArray(pixels.length * 4);
        const dataView = new DataView(pixels8.buffer);
        for (let i = 0 ; i < pixels.length ; i++) {
            dataView.setUint32(i * 4, pixels[i], true);
            const [b, g, r] = [
                dataView.getUint8(i * 4 + 2, true),
                dataView.getUint8(i * 4 + 1, true),
                dataView.getUint8(i * 4 + 0, true),
            ];
            dataView.setUint8(i * 4 + 0, b, true);
            dataView.setUint8(i * 4 + 1, g, true);
            dataView.setUint8(i * 4 + 2, r, true);
        }

        return pixels8;
    }

    readPlainImage(image, pixels, buffer) {
        const dataLength = image.workRecord.height * image.workRecord.width * 2;
        if (dataLength !== image.workRecord.length) {
            throw new Error(
                `Image data length (${dataLength}) doesn't match image `
                + `size (${image.workRecord.length})`)
        }
        let i = 0;
        for (let y = 0 ; y < image.workRecord.height ; y++) {
            for (let x = 0 ; x < image.workRecord.width ; x++, i += 2) {
                this.read555Pixel(image, pixels, x, y, buffer[i] | (buffer[i + 1] << 8));
            }
        }
    }

    readIsometricImage(image, pixels, buffer) {
        this.prepareIsometricBase(image, pixels, buffer);
        this.readTransparentImage(
            image, pixels, buffer, image.workRecord.uncompressed_length,
            image.workRecord.length -  image.workRecord.uncompressed_length);
    }

    prepareIsometricBase(image, pixels, buffer) {
        const width = image.workRecord.width;
        const height = (width + 2) / 2;
        const heightOffset = image.workRecord.height - height;
        let size = image.workRecord.flags[3];
        if (size === 0) {
            // Derive the tile size from the height (more regular than
            // width)
            // Note that this causes a problem with 4x4 regular vs 3x3
            // large:
            // 4 * 30 = 120; 3 * 40 = 120 -- give precedence to regular
            if (height % ISOMETRIC_TILE_HEIGHT === 0) {
                size = height / ISOMETRIC_TILE_HEIGHT;
            } else if (height % ISOMETRIC_LARGE_TILE_HEIGHT === 0) {
                size = height / ISOMETRIC_LARGE_TILE_HEIGHT;
            }
        }

        let tileBytes, tileHeight, tileWidth;
        // Determine whether we should use the regular or large (emperor)
        // tiles
        if (ISOMETRIC_TILE_HEIGHT * size === height) {
            // Regular tile
            tileBytes  = ISOMETRIC_TILE_BYTES;
            tileHeight = ISOMETRIC_TILE_HEIGHT;
            tileWidth  = ISOMETRIC_TILE_WIDTH;
        } else if (ISOMETRIC_LARGE_TILE_HEIGHT * size === height) {
            /* Large (emperor) tile */
            tileBytes  = ISOMETRIC_LARGE_TILE_BYTES;
            tileHeight = ISOMETRIC_LARGE_TILE_HEIGHT;
            tileWidth  = ISOMETRIC_LARGE_TILE_WIDTH;
        } else {
            throw new Error(`Unknown tile size ${width}x${height}`);
        }

        // Check if buffer length is enough: (width + 2) * height / 2 * 2bpp
        const dataLength = (width + 2) * height;
        if (dataLength !== image.workRecord.uncompressed_length) {
            throw new Error(
                `Data length (${dataLength}) doesn't match footprint size `
                + `({image.workRecord.uncompressed_length})`)
        }

        let i = 0;
        const yMax = (size + (size - 1));
        const yOffset0 = heightOffset;
        for (let y = 0 ; y < yMax ; y++) {
            const yOffset = yOffset0 + y * (tileHeight / 2);
            const xOffset0 = (y < size ? (size - y - 1) : (y - size + 1))
                * tileHeight
            const xMax = (y < size ? y + 1 : 2 * size - y - 1);
            for (let x = 0 ; x < xMax ; x++, i++) {
                const xOffset = xOffset0 + x * (tileWidth + 2);
                this.prepareIsometricTile(
                    image, pixels, buffer, i * tileBytes, xOffset, yOffset,
                    tileWidth, tileHeight);
            }
        }
    }

    prepareIsometricTile(image, pixels, buffer, offset, xOffset, yOffset,
                         tileWidth, tileHeight) {
        const halfHeight = tileHeight / 2;

        let i = 0;
        for (let y = 0 ; y < halfHeight ; y++) {
            const start = tileHeight - 2 * (y + 1);
            const end = tileWidth - start;
            for (let x = start ; x < end ; x++, i += 2) {
                this.read555Pixel(
                    image, pixels, xOffset + x, yOffset + y,
                    (buffer[offset + i + 1] << 8) | buffer[offset + i]);
            }
        }
        for (let y = halfHeight ; y < tileHeight ; y++) {
            const start = 2 * y - tileHeight;
            const end = tileWidth - start;
            for (let x = start ; x < end ; x++, i += 2) {
                this.read555Pixel(
                    image, pixels, xOffset + x, yOffset + y,
                    (buffer[offset + i + 1] << 8) | buffer[offset + i]);
            }
        }
    }

    readTransparentImage(image, pixels, buffer, offset, length) {
        const width = image.workRecord.width;

        let i = 0;
        let x = 0, y = 0;
        while (i < length) {
            const c = buffer[offset + i];
            i++;
            if (c === 255) {
                // The next byte is the number of pixels to skip
                x += buffer[offset + i];
                i++;
                while (x >= width) {
                    y++;
                    x -= width;
                }
            } else {
                // `c` is the number of image data bytes
                for (let j = 0 ; j < c ; j++, i += 2) {
                    this.read555Pixel(
                        image, pixels, x, y,
                        buffer[offset + i] | (buffer[offset + i + 1] << 8));
                    x++;
                    if (x >= width) {
                        y++;
                        x = 0;
                    }
                }
            }
        }
    }

    readSpriteImage(image, pixels, buffer) {
        this.readTransparentImage(
            image, pixels, buffer, 0, image.workRecord.length);
    }

    loadAlphaMask(image, pixels, buffer, offset) {
        let i = 0;
        let x = 0, y =  0;
        const width = image.workRecord.width;
        const length = image.workRecord.alpha_length;

        while (i < length) {
            const c = buffer[offset + i];
            i++;
            if (c === 255) {
                // The next byte is the number of pixels to skip
                x += buffer[offset + i];
                i++;
                while (x >= width) {
                    y++;
                    x -= width;
                }
            } else {
                // `c` is the number of image data bytes
                for (let j = 0 ; j < c ; j++, i++) {
                    this.readAlphaPixel(
                        image, pixels, x, y, buffer[offset + i]);
                    x++;
                    if (x >= width) {
                        y++;
                        x = 0;
                    }
                }
            }
        }
    }

    mirrorImage(image, pixels) {
        for (let x = 0 ; x < (image.workRecord.width - 1) / 2 ; x++) {
            for (let y = 0 ; y < image.workRecord.height ; y++) {
                const p1 = y * image.workRecord.width + x;
                const p2 = (y + 1) * image.workRecord.width - x;
                [pixels[p1], pixels[p2]] = [pixels[p2], pixels[p1]];
            }
        }
    }

    read555Pixel(image, pixels, x, y, colour) {
        if (colour === 0xf81f) {
            return;
        }

        let rgb = 0xff000000;

        // Red: bits 11-15, should go to bits 17-24
        rgb |= ((colour & 0x7c00) << 9) | ((colour & 0x7000) << 4);
        // Green: bits 6-10, should go to bits 9-16
        rgb |= ((colour & 0x3e0) << 6) | ((colour & 0x300));
        // Blue: bits 1-5, should go to bits 1-8
        rgb |= ((colour & 0x1f) << 3) | ((colour & 0x1c) >> 2);

        pixels[y * image.workRecord.width + x] = rgb;
    }

    readAlphaPixel(image, pixels, x, y, colour) {
        // Only the first five bits of the alpha channel are used
        const alpha = ((colour & 0x1f) << 3) | ((colour & 0x1c) >> 2);

        const p = y * image.workRecord.width + x;
        pixels[p] = (pixels[p] & 0x00ffffff) | (alpha << 24);
    }

    fillBuffer(image) {
        const dataLength = image.workRecord.length + image.workRecord.alpha_length;
        if (dataLength <= 0) {
            throw new Error(`Data length invalid: ${dataLength}`);
        }
        // Somehow externals have 1 byte added to their offset
        this.stream.seek(image.workRecord.offset - image.workRecord.flags[0]);
        let buffer;
        if (this.stream.exactlyEof(dataLength - 4)) {
            const smallerBuffer = this.stream.readUInt8LEArray(dataLength - 4);
            buffer = new Uint8Array(dataLength);
            buffer.set(smallerBuffer);
            buffer.set([0, 0, 0, 0], smallerBuffer.length);
        } else {
            buffer = this.stream.readUInt8LEArray(dataLength);
        }

        return buffer;
    }
}

class Stream {
    constructor(contents, filename) {
        this.contents = contents;
        const bytes = contents.split("").map(c => c.charCodeAt(0));
        this.array = Uint8Array.from(bytes);
        this.dataView = new DataView(this.array.buffer);
        this.length = this.dataView.byteLength;
        this.filename = filename;
        this.seek(0);
    }

    readDict(ops) {
        const data = {};

        for (const [key, op, args] of ops) {
            const value = this[op].apply(this, args || []);
            if (typeof key !== typeof undefined) {
                data[key] = value;
            }
        }

        return data;
    }

    readList(ops) {
        const data = [];

        for (const [op, args, ignore=false] of ops) {
            const value = this[op].apply(this, args || []);
            if (!ignore) {
                data.push(value);
            }
        }

        return data;
    }

    get(length) {
        const index = this.index;
        this.seek(this.index + length);
        return index;
    }

    seek(index) {
        if (index > this.length) {
            throw new Error("Past buffer end");
        }
        this.index = index;
    }

    exactlyEof(index=null) {
        if (index === null) {
            index = this.index;
        }
        return index === this.length;
    }

    readUInt32LE() {
        return this.dataView.getUint32(this.get(4), true);
    }

    readUInt8LE() {
        return this.dataView.getUint8(this.get(1), true);
    }

    readUInt8LEArray(length) {
        const index = this.get(length);
        return this.array.slice(index, index + length);
    }

    readInt32LE() {
        return this.dataView.getInt32(this.get(4), true);
    }

    readInt16LE() {
        return this.dataView.getInt16(this.get(2), true);
    }

    skip(length) {
        this.get(length);
    }

    readString(length, trimAtNull=true) {
        let value = this.contents.substr(this.get(length), length);
        if (trimAtNull) {
            const end = value.indexOf('\0');
            if (end >= 0) {
                value = value.substr(0, end);
            }
        }
        return value;
    }

    readChar() {
        return this.readString(1, false).charCodeAt(0);
    }
}
