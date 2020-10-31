import {ipcRenderer, remote} from 'electron';
import {Settings} from "../settings";

let settings: Settings;
let index: number;
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
    ipcRenderer.send('existingSound', {file: sound, index: index, volume: volume.value});
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
        ipcRenderer.send('newSound', {file: file, index: index, volume: volume.value});
    }).catch(console.error)

});

const volumeSpan = document.getElementById('volumeValue') as HTMLSpanElement;
const volume = document.getElementById('volume') as HTMLInputElement;
volumeSpan.innerText = volume.value;
volume.addEventListener('input', () => {
    volumeSpan.innerText = volume.value;
});
volume.addEventListener('change', () => {
    volumeSpan.innerText = volume.value;
});