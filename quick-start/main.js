touchfree.init();

const COLOR_MAP = [
    'var(--melon)',
    'var(--sunset)',
    'var(--cream)',
    'var(--tea-green)',
    'var(--electric-blue)',
    'var(--jordy-blue)',
    'var(--periwinkle)',
    'var(--mauve)',
    'var(--baby-powder)',
];

let isDark = false;
let clicked = false;

const dark = document.getElementById('dark');
const label = document.getElementById('label');
const textArea = document.querySelector('.text-container');
const root = document.querySelector(':root');

dark?.addEventListener('pointerup', () => {
    if (!label) return;
    if (isDark) {
        root?.style.setProperty('--background-color', 'white');
        root?.style.setProperty('--percent', '80%');
        textArea?.style.setProperty('color', 'black');
        label.textContent = 'Dark';
        isDark = false;
    } else {
        root?.style.setProperty('--background-color', '#5c5c5c');
        root?.style.setProperty('--percent', '50%');
        if (!clicked) {
            textArea?.style.setProperty('color', 'white');
        }
        label.textContent = 'Light';
        isDark = true;
    }
});

function onClick(event) {
    if (!textArea) return;
    clicked = true;
    const button = event.target;
    textArea.textContent = button.textContent;
    textArea.style.backgroundColor = button.style.backgroundColor;
    root?.style.setProperty('--display-color', button.style.backgroundColor);
    textArea?.style.setProperty('color', 'black');
}

function onPointerEnter(event) {
    const element = event.target;
    element.classList.add('hovered');
    element.style.transform = 'scale(1.1)';
}

function onPointerLeave(event) {
    const element = event.target;
    element.classList.remove('hovered');
    element.style.transform = 'scale(1)';
}

function createButton(index, content) {
    const button = document.createElement('button');
    button.textContent = content === 'ALPHA' ? String.fromCharCode(index + 65) : (index + 1).toString();
    button.addEventListener('pointerup', onClick);
    button.addEventListener('pointerenter', onPointerEnter);
    button.addEventListener('pointerleave', onPointerLeave);
    button.style.backgroundColor = COLOR_MAP[index];
    return button;
}

for (let i = 0; i < 8; i++) {
    const button = createButton(i, 'NUM');
    document.querySelector('.button-container--vertical').appendChild(button);
}

for (let i = 0; i < 8; i++) {
    const button = createButton(i, 'ALPHA');
    document.querySelector('.button-container--horizontal').appendChild(button);
}

touchfree.registerEventCallback('transmitInputAction', (action) => {
    const hovered = document.querySelector('.hovered');
    if (!hovered) return;
    hovered.style.transform = `scale(${1.1 - action.ProgressToClick * 0.1})`;
});
