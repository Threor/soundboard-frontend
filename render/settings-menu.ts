import {Settings} from "../settings";
import {ipcRenderer} from "electron";

ipcRenderer.on('init', (event, data) => {
    const settings: Settings = data;
    if (settings.username) {
        (document.getElementById('username') as HTMLInputElement).value = settings.username;
    }
    if (settings.guild) {
        (document.getElementById('guild') as HTMLInputElement).value = settings.guild;
    }
    if (settings.server) {
        (document.getElementById('server') as HTMLInputElement).value = settings.server;
    }
});
document.getElementById('changeSettings')?.addEventListener('click', () => {
    const username = (document.getElementById('username') as HTMLInputElement).value;
    const guild = (document.getElementById('guild') as HTMLInputElement).value;
    const server = (document.getElementById('server') as HTMLInputElement).value;
    ipcRenderer.send('changeSettings', {
        username: username,
        guild: guild,
        server: server
    })
});