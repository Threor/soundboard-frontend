import {ipcRenderer, remote} from 'electron';
import {Settings} from "../settings";
import fs from "fs";

let settings: Settings;
let index: number;
ipcRenderer.on('settings', (event, data) => {
    console.log(data);
    settings = data;
});
ipcRenderer.on('index',(event, args) => {
    index=args;
});
ipcRenderer.on('sounds',(event, args: Array<string>) => {
    const list=document.getElementById('list') as HTMLSelectElement;
    list.size=args.length+1;
    args.forEach(sound=>{
        const option=document.createElement('option');
        option.value=sound;
        option.text=sound;
        list?.appendChild(option);
    })
});
document.getElementById('existingSound')?.addEventListener('click',()=>{
   const sound=(document.getElementById('list') as HTMLInputElement).value;
   if(!sound) {
       return;
   }
   ipcRenderer.send('existingSound',{file:sound,index:index});
});
document.getElementById('newSound')?.addEventListener('click',()=>{
    const dialog=remote.dialog;
    dialog.showOpenDialog({
        title:"Sound auswählen",
    }).then(async value => {
        const files=value.filePaths;
        if(!files||files.length!=1) {
            return
        }
        const file =files[0];
        ipcRenderer.send('newSound', {file:file,index:index});
    }).catch(console.error)

});