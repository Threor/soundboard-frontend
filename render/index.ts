import {Settings} from "../settings";
import {ipcRenderer} from "electron";

let settings: Settings;
ipcRenderer.on('settings', (event, data) => {
    settings = data;
    if (settings) {
        if(settings.username) {
            // @ts-ignore
            document.getElementById('username').value = settings.username;
        }
        if (settings.buttons) {
            settings.buttons.forEach(button => {
                const htmlButton = document.getElementById(String(button.index));
                // @ts-ignore
                htmlButton.innerText = button.sound.substring(0, button.sound.lastIndexOf('.'));
            })
        }
    }
});
// @ts-ignore
document.getElementById('username').addEventListener('change', () => {
    // @ts-ignore
    const username = document.getElementById('username').value;
    ipcRenderer.send('usernameChanged', username);
});

// @ts-ignore
document.getElementById('join').addEventListener('click',()=>{
    ipcRenderer.send('join');
});
// @ts-ignore
document.getElementById('stop').addEventListener('click',()=>{
    ipcRenderer.send('stop');
});
// @ts-ignore
document.getElementById('leave').addEventListener('click',()=>{
    ipcRenderer.send('leave');
});

document.querySelectorAll('.button-item').forEach(button => {
    button.addEventListener('click', () => {
        const id = parseInt(button.id);
        console.log(id);
        if (settings?.buttons?.find(b => b.index === id)) {
            ipcRenderer.send("play", id);
        } else {
            ipcRenderer.send("showAddWindow", id);
        }
    });
    button.addEventListener('contextmenu',()=>{
        (button as HTMLElement).innerText="";
        ipcRenderer.send('deleteButton',parseInt(button.id));
    })
});

