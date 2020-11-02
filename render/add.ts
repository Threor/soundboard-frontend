import {ipcRenderer, remote} from 'electron';
import {Settings} from "../settings";

let settings: Settings;
let index: number;
let shortcutInput=false;
let shortcut: string|undefined;
ipcRenderer.on('settings', (event, data) => {
    settings = data;
});
ipcRenderer.on('index', (event, args) => {
    index = args;
});
ipcRenderer.on('sounds', (event, args: Array<string>) => {
    const list = document.getElementById('list') as HTMLSelectElement;
    list.size = args.length + 1;
    args.forEach(sound => {
        const option = document.createElement('option');
        option.value = sound;
        option.text = sound;
        list?.appendChild(option);
    })
});
document.getElementById('list')?.addEventListener('dblclick', () => {
    const sound = (document.getElementById('list') as HTMLInputElement).value;
    if (!sound) {
        return;
    }
    ipcRenderer.send('existingSound', {file: sound, index: index, volume: volume.value,shortcut: getShortcut()});
})
document.getElementById('newSound')?.addEventListener('click', () => {
    const dialog = remote.dialog;
    dialog.showOpenDialog({
        title: "Sound auswählen",
    }).then(async value => {
        const files = value.filePaths;
        if (!files || files.length != 1) {
            return
        }
        const file = files[0];
        ipcRenderer.send('newSound', {file: file, index: index, volume: volume.value,shortcut:getShortcut()});
    }).catch(console.error)

});

document.getElementById('shortcut')?.addEventListener('click',()=>{
    shortcutInput=!shortcutInput;
    if(shortcutInput) {
        shortcut=undefined;
        (document.getElementById('shortcutValue')as HTMLSpanElement).innerText="Enter key";
    }
})
document.addEventListener('keypress',(event)=>{
    if(shortcutInput) {
        shortcutInput=false;
        shortcut=event.key;
        (document.getElementById('shortcutValue')as HTMLSpanElement).innerText=event.key;
    }
})
const volumeSpan = document.getElementById('volumeValue') as HTMLSpanElement;
const volume = document.getElementById('volume') as HTMLInputElement;
volumeSpan.innerText = volume.value;
volume.addEventListener('input', () => {
    volumeSpan.innerText = volume.value;
});
volume.addEventListener('change', () => {
    volumeSpan.innerText = volume.value;
});

function getShortcut() {
    if(!shortcut)return undefined;
    const ctrl=(document.getElementById('ctrl')as HTMLInputElement).checked;
    const alt=(document.getElementById('alt')as HTMLInputElement).checked;
    const shift=(document.getElementById('shift')as HTMLInputElement).checked;
    let ret="";
    if(ctrl) {
        ret+="CommandOrControl+"
    }
    if(alt) {
        ret+="Alt+";
    }
    if(shift) {
        ret+="Shift+";
    }
    ret+=shortcut;
    return ret;

}