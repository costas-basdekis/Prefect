export const RESIZE_TERRAIN = 'RESIZE_TERRAIN';
export const SELECTION_END = 'SELECTION_END';

export const resizeTerrain = (width, height) => ({
    type: RESIZE_TERRAIN,
    width,
    height,
});

export const selectionEnd = (toolKey, selectedTiles) => ({
    type: SELECTION_END,
    toolKey,
    selectedTiles,
});
