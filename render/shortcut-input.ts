let shortcutInput = false;
let shortcut: string | undefined;

document.getElementById('shortcut')?.addEventListener('click', () => {
    shortcutInput = !shortcutInput;
    if (shortcutInput) {
        shortcut = undefined;
        (document.getElementById('shortcutValue') as HTMLSpanElement).innerText = "Enter key";
    }
});
document.addEventListener('keydown', (event) => {
    if (shortcutInput) {
        shortcutInput = false;
        shortcut = event.key;
        (document.getElementById('shortcutValue') as HTMLSpanElement).innerText = event.key;
    }
});

function getShortcut() {
    if (!shortcut) return undefined;
    const ctrl = (document.getElementById('ctrl') as HTMLInputElement).checked;
    const alt = (document.getElementById('alt') as HTMLInputElement).checked;
    const shift = (document.getElementById('shift') as HTMLInputElement).checked;
    let ret = "";
    if (ctrl) {
        ret += "CommandOrControl+"
    }
    if (alt) {
        ret += "Alt+";
    }
    if (shift) {
        ret += "Shift+";
    }
    ret += shortcut;
    return ret;

}