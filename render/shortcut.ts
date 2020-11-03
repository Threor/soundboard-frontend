import {ipcRenderer} from 'electron';

let action: string;

ipcRenderer.on('init', (event, args) => {
    action = args.action;
    document.title = `Shortcut für ${action} setzen`;
    markExistingShortcut(args.shortcut)
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