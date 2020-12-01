import {Settings} from "../settings";
import {ipcRenderer} from "electron";

let settings: Settings;
ipcRenderer.on('settings', (event, data) => {
    settings = data;
    if (settings) {
        if (settings.buttons) {
            document.querySelectorAll('.button-item').forEach(button => {
                (button as HTMLElement).innerText = "";
            });
            settings.buttons.forEach(button => {
                const htmlButton = document.getElementById(String(button.index));
                (htmlButton as HTMLElement).innerText = button.sound.substring(0, button.sound.lastIndexOf('.'));
            })
        }
    }
});
document.getElementById('settings')?.addEventListener('click', () => {
    ipcRenderer.send('showSettingsWindow');
});
document.getElementById('join')?.addEventListener('click', () => {
    ipcRenderer.send('join');
});
document.getElementById('stop')?.addEventListener('click', () => {
    ipcRenderer.send('stop');
});
document.getElementById('leave')?.addEventListener('click', () => {
    ipcRenderer.send('leave');
});

document.querySelectorAll('.button-item').forEach(button => {
    button.addEventListener('click', () => {
        const id = parseInt(button.id);
        if (settings?.buttons?.find(b => b.index === id)) {
            ipcRenderer.send("play", id);
        } else {
            ipcRenderer.send("showAddWindow", id);
        }
    });
    button.addEventListener('contextmenu', () => {
        ipcRenderer.send('showAddWindow', parseInt(button.id));
    })
});

document.querySelectorAll('.menu-button').forEach(button => {
    button.addEventListener('contextmenu', () => {
        ipcRenderer.send('showShortcutWindow', button.id);
    })
})