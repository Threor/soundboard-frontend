import {ipcRenderer, remote} from 'electron';
import {Settings} from "../settings";
import {Button} from "../button";
import path from "path";

let settings: Settings;
let index: number;

ipcRenderer.on('init', (event, data) => {
    settings = data.settings;
    index = data.index;
    if (buttonExists()) {
        let button: Button = getExistingButton() as Button;
        volume.value = button.volume ? '' + button.volume : '1';
        volumeSpan.innerText = volume.value;
        markExistingShortcut(button.shortcut);
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-primary ml-4 mr-4 mt-1 mb-1';
        deleteButton.addEventListener('click', () => {
            ipcRenderer.send('deleteButton', index);
        })
        deleteButton.innerText = 'Delete Sound';
        document.getElementById('mainContainer')?.appendChild(deleteButton);
    }
});
ipcRenderer.on('sounds', (event, args: Array<string>) => {
    const list = document.getElementById('list') as HTMLSelectElement;
    list.size = args.length + 1;
    args.forEach(sound => {
        const option = document.createElement('option');
        option.value = sound;
        option.text = sound;
        list?.appendChild(option);
    });
    if (buttonExists()) {
        let sound = getExistingButton()?.sound as string;
        for (const option of list.options) {
            let optionSoundName = option.value.substring(option.value.lastIndexOf(path.sep) + 1)
            if (optionSoundName === sound) {
                list.selectedIndex = option.index;
                break;
            }
        }
    }
});
document.getElementById('list')?.addEventListener('dblclick', () => {
    const sound = (document.getElementById('list') as HTMLInputElement).value;
    if (!sound) {
        return;
    }
    ipcRenderer.send('existingSound', {
        file: sound,
        index: index,
        volume: volume.value,
        shortcut: getShortcut(),
        change: buttonExists()
    });
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
        ipcRenderer.send('newSound', {
            file: file,
            index: index,
            volume: volume.value,
            shortcut: getShortcut(),
            change: buttonExists()
        });
    }).catch(console.error)

});

function buttonExists(): boolean {
    return !!getExistingButton();
}

function getExistingButton(): Button | undefined {
    return settings?.buttons?.find(b => b.index === index);
}

const volumeSpan = document.getElementById('volumeValue') as HTMLSpanElement;
const volume = document.getElementById('volume') as HTMLInputElement;
volumeSpan.innerText = volume.value;
volume.addEventListener('input', () => {
    volumeSpan.innerText = volume.value;
});
volume.addEventListener('change', () => {
    volumeSpan.innerText = volume.value;
});