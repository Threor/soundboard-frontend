import {ipcRenderer} from 'electron';

let action: string;

ipcRenderer.on('init', (event, args) => {
    action = args.action;
    document.title = `Shortcut für ${action} setzen`;
    if (!args.shortcut) {
        return;
    }
    let fullShortcut: string = args.shortcut;
    const ctrl = fullShortcut.includes("CommandOrControl+");
    const alt = fullShortcut.includes("Alt+");
    const shift = fullShortcut.includes("Shift+");
    if (ctrl) {
        fullShortcut = fullShortcut.replace("CommandOrControl+", "");
    }
    if (alt) {
        fullShortcut = fullShortcut.replace("Alt+", "");
    }
    if (shift) {
        fullShortcut = fullShortcut.replace("Shift+", "");
    }
    (document.getElementById('ctrl') as HTMLInputElement).checked = ctrl;
    (document.getElementById('shift') as HTMLInputElement).checked = shift;
    (document.getElementById('alt') as HTMLInputElement).checked = alt;
    shortcut = fullShortcut;
    (document.getElementById('shortcutValue') as HTMLSpanElement).innerText = shortcut;
});

document.getElementById('setShortcut')?.addEventListener('click', () => {
    const shortcut = getShortcut();
    if (shortcut) {
        ipcRenderer.send('setShortcut', {
            action: action,
            shortcut: shortcut
        });
    }
});
document.getElementById('deleteShortcut')?.addEventListener('click', () => {
    ipcRenderer.send('deleteShortcut', action);
})