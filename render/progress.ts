import {ipcRenderer} from 'electron';
import {ProgressInfo} from "builder-util-runtime";

ipcRenderer.on('progress', (event, args: ProgressInfo) => {
    const sizeInMB = Math.floor(args.total / 1048576 * 100) / 100;
    const progressInMB = Math.floor(args.transferred / 1048576 * 100) / 100;
    const mBS = Math.floor(args.bytesPerSecond / 1048576 * 100) / 100;
    const percentage = String(Math.round(args.percent * 100) / 100) + "%";
    (document.getElementById('header') as HTMLHeadingElement).innerText = `${progressInMB}MB/${sizeInMB}MB heruntergeladen! Aktuelle Geschwindigkeit: ${mBS}MB/S`;
    const progress = document.querySelector('.progress-bar') as HTMLDivElement;
    progress.style.width = percentage;
    progress.innerText = percentage;
})