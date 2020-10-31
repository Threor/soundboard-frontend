import {app, dialog, ipcMain} from 'electron';
import * as path from 'path';
import {DataStorage} from "./storage";
import {CustomWindow} from "./window";
import * as https from "https";
import * as fs from "fs";
import FormData from "form-data";
import {Button} from "./button";
import {Config} from "./config";
import {autoUpdater} from "electron-updater";
import log from "electron-log";

const storage = new DataStorage({
    configName: 'user-preferences',
});

const config: Config = require("./config.json");

app.on('ready', async () => {
    log.info("Checking for updates");
    await autoUpdater.checkForUpdates();
    log.info("Checked");
});
autoUpdater.autoDownload = false;
autoUpdater.logger = log;
autoUpdater.on('update-not-available', (info) => {
    log.info("No update available", info);
})
autoUpdater.on('update-available', async (updateInfo) => {
    log.info("Update found");
    let version = updateInfo.version;
    let releaseDate = updateInfo.releaseDate;
    const ret = await dialog.showMessageBox({
        title: "Update gefunden",
        type: "question",
        buttons: ["Update installieren", "Update installieren und neustarten", "Update installieren und beenden", "Update nicht installieren"],
        defaultId: 1,
        cancelId: 3,
        noLink: true,
        message: `Ein neues Update mit der Version: ${version}, veröffentlicht am ${releaseDate} wurde gefunden.\nInstallieren?`

    });
    let reponse = ret.response;
    if (reponse === 3) {
        return;
    }
    let shouldRestart = reponse === 1;
    await autoUpdater.downloadUpdate();
    if (reponse !== 0) {
        autoUpdater.quitAndInstall(true, shouldRestart);
    }
});
autoUpdater.on('error', (error) => {
    log.error("Error while checking for updates: ", error);
});

function main() {
    log.info('App is ready');
    let addWindow: CustomWindow | null;
    const window = new CustomWindow({
        file: path.join("render", 'index.html'),
    });
    window.setMenuBarVisibility(false);
    window.once('show', () => {
        window.webContents.send('settings', storage.getSettings());
    });
    ipcMain.on('usernameChanged', (event, args) => {
        window.webContents.send('settings', storage.changeUsername(args));
    });
    ipcMain.on('showAddWindow', (event, data) => {
        if (!addWindow) {
            addWindow = new CustomWindow({
                file: path.join('render', 'add.html'),
                width: 500,
                height: 650,
                parent: window,
                webPreferences: {
                    enableRemoteModule: true,
                    nodeIntegration: true
                }
            });
            addWindow.setMenuBarVisibility(false);
            addWindow.once('show', () => {
                addWindow?.webContents.send('settings', storage.getSettings());
                addWindow?.webContents.send('index', data);
                getSounds().then(sounds => {
                    addWindow?.webContents.send('sounds', sounds);
                }).catch(log.error);
            });
            addWindow.on('closed', () => {
                addWindow = null
            });
        }
    });
    ipcMain.on('play', async (event, args) => {
        const button = storage.getButtonByIndex(args);
        if (!button) {
            return;
        }
        playSound(button.sound, button.volume).catch(log.error);
    });
    ipcMain.on('stop', async () => {
        stopSound().catch(log.error);
    });
    ipcMain.on('join', async () => {
        joinServer().catch(log.error);
    });
    ipcMain.on('leave', async () => {
        leaveServer().catch(log.error);
    });
    ipcMain.on('newSound', async (event, args) => {
        const fileStream = fs.createReadStream(args.file);
        try {
            await addNewSound(fileStream);
            const fileName: string = args.file.substring(args.file.lastIndexOf(path.sep) + 1);
            addButton(args.index, fileName, args.volume);
            addWindow?.close();
            window.show();
            window.webContents.send('settings', storage.getSettings());
        } catch (e) {
            log.error(e);
        }
    });
    ipcMain.on('existingSound', (event, args) => {
        addButton(args.index, args.file, args.volume);
        addWindow?.close();
        window.show();
        window.webContents.send('settings', storage.getSettings());
    })
    ipcMain.on('deleteButton', (event, args) => {
        storage.deleteButton(args);
        window.webContents.send('settings', storage.getSettings());
    });
    ipcMain.on('addButton', (event, args) => {
        storage.addButton(args);
    });
}

function addButton(index: number, sound: string, volume: string) {
    let vol;
    if (volume) {
        try {
            vol = parseFloat(volume);
        } catch (ignored) {
        }
    }
    storage.addButton(new Button(index, sound, vol));
}

function getSounds(): Promise<Array<string>> {
    return new Promise<Array<string>>((res, rej) => {
        if (config.acceptSelfSignedCerts) {
            process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = String(0);
        }
        const options = {
            hostname: config.hostname,
            port: config.port,
            path: `/sound`,
            method: 'GET',
            json: true,
            headers: {
                'username': storage.getUsername()
            }
        }
        https.get(options, (response => {
            if (response.statusCode !== 200) {
                rej(response.statusCode);
            }
            response.on('data', (d) => {
                if (response.statusCode !== 200) {
                    rej(response.statusCode);
                } else {
                    res(JSON.parse(d));
                }
            });
        })).on('error', (err) => {
            rej(err);
        });
    });

}

function getBasicOption(path: string): https.RequestOptions {
    if (config.acceptSelfSignedCerts) {
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = String(0);
    }
    return {
        hostname: config.hostname,
        port: config.port,
        path: path,
        method: 'GET',
        headers: {
            'username': storage.getUsername()
        }
    }
}

function joinServer(): Promise<void> {
    return new Promise<void>((res, rej) => {
        const options = getBasicOption('/join');
        https.get(options, (response => {
            if (response.statusCode !== 200) {
                log.warn(response);
                rej(response.statusCode);
            } else {
                res();
            }
        })).on('error', (err) => {
            rej(err);
        });
    });
}

function leaveServer(): Promise<void> {
    return new Promise<void>((res, rej) => {
        const options = getBasicOption('/leave');
        https.get(options, (response => {
            if (response.statusCode !== 200) {
                log.warn(response);
                rej(response.statusCode);
            } else {
                res();
            }
        })).on('error', (err) => {
            rej(err);
        });
    });
}

function stopSound(): Promise<void> {
    return new Promise<void>((res, rej) => {
        const options = getBasicOption('/stop');
        https.get(options, (response => {
            if (response.statusCode !== 200) {
                log.warn(response);
                rej(response.statusCode);
            } else {
                res();
            }
        })).on('error', (err) => {
            rej(err);
        });
    });
}

function addNewSound(file: fs.ReadStream): Promise<void> {
    return new Promise<void>((res, rej) => {
        if (config.acceptSelfSignedCerts) {
            process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = String(0);
        }
        const form = new FormData();
        const options = {
            hostname: config.hostname,
            port: config.port,
            path: `/upload`,
            method: 'POST',
            headers: form.getHeaders({'username': storage.getUsername()})
        }
        const request = https.request(options, (response => {
            if (response.statusCode !== 200) {
                rej(response.statusCode);
            }
            response.on('data', (d) => {
                if (response.statusCode !== 200) {
                    rej(response.statusCode);
                }
                res();
            });
        })).on('error', (err) => {
            rej(err);
        });
        form.append('file', file);
        form.pipe(request);
    });
}

function playSound(sound: string, volume?: number): Promise<boolean> {
    return new Promise<boolean>((res, rej) => {
        let url = `/play?sound=${encodeURIComponent(sound)}`;
        if (volume) {
            url += `&volume=${encodeURIComponent(volume)}`;
        }
        const options = getBasicOption(url);
        https.get(options, (response => {
            if (response.statusCode !== 200) {
                log.warn(response);
                rej(response.statusCode);
            } else {
                res(true);
            }
        })).on('error', (err) => {
            rej(err);
        });
    });

}

app.on('ready', main);
app.on('window-all-closed', app.quit);