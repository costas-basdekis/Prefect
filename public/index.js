function onCheck(el) {
    const prop = el.name;
    saveChecked(prop, el.checked);
}

function saveChecked(prop, checked) {
    const state = JSON.parse(
        localStorage.getItem('displayOptions') || '{}');
    state[prop] = checked;
    localStorage.setItem('displayOptions', JSON.stringify(state));
}

function setCheck(el) {
    const prop = el.name;
    const _default = (el.dataset.default || "on") === "on";
    el.checked = shouldBeChecked(prop, _default);
}

function shouldBeChecked(prop, _default) {
    const state = JSON.parse(
        localStorage.getItem('displayOptions') || '{}');
    if (!(prop in state)) {
        state[prop] = _default;
    }
    return !!state[prop];
}

function setAllCheck() {
    const elements = document.getElementsByClassName('check');
    for (const el of elements) {
        setCheck(el);
    }
}

window.onload = setAllCheck;
