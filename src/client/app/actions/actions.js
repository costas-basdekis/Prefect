export const RESIZE_TERRAIN = 'RESIZE_TERRAIN';
export const SELECTION_END = 'SELECTION_END';
export const TICK = 'TICK';
export const ANIMATION_TICK = 'ANIMATION_TICK';
export const SAVE = 'SAVE';
export const LOAD = 'LOAD';

export const resizeTerrain = (width, height) => ({
    type: RESIZE_TERRAIN,
    width,
    height,
});

export const selectionEnd = (tool, selectedTiles) => ({
    type: SELECTION_END,
    tool,
    selectedTiles,
});

export const tick = () => ({
    type: TICK,
});

export const animationTick = (fraction) => ({
    type: ANIMATION_TICK,
    fraction,
});

export const save = () => ({
    type: SAVE,
})

export const load = () => ({
    type: LOAD,
})
