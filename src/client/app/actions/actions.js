export const RESIZE_TERRAIN = 'RESIZE_TERRAIN';

export const resizeTerrain = (width, height) => ({
    type: RESIZE_TERRAIN,
    width,
    height,
});
