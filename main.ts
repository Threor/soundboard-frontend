import {app, dialog, globalShortcut, ipcMain} from 'electron';
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
import {MenuShortcut} from "./settings";

const storage = new DataStorage({
    configName: 'user-preferences',
});

const config: Config = require("./config.json");

app.on('ready', async () => {
    storage.getButtons().forEach(button => {
        addShortcutForButton(button);
    });
    storage.getMenuShortcuts().forEach(shortcut => {
        addShortcutForMenu(shortcut);
    });
    log.info("Checking for updates");
    await autoUpdater.checkForUpdates();
    log.info("Checked");
});

setupAutoUpdate();
let window: CustomWindow;

function main() {
    log.info('App is ready');
    let addWindow: CustomWindow | null;
    let shortcutWindow: CustomWindow | null;
    window = new CustomWindow({
        file: path.join("render", 'index.html'),
    });
    window.once('show', () => {
        window.webContents.send('settings', storage.getSettings());
    });
    ipcMain.on('usernameChanged', (event, args) => {
        window.webContents.send('settings', storage.changeUsername(args));
    });
    ipcMain.on('showShortcutWindow', (event, args) => {
        if (!shortcutWindow) {
            shortcutWindow = new CustomWindow({
                file: path.join('render', 'shortcut.html'),
                width: 500,
                height: 225,
                parent: window,
            });
            shortcutWindow.once('show', () => {
                shortcutWindow?.webContents.send('init', {
                    action: args,
                    shortcut: storage.getShortcutForAction(args)?.shortcut
                });
            });
            shortcutWindow.on('closed', () => {
                shortcutWindow = null
            });
        }
    })
    ipcMain.on('showAddWindow', (event, data) => {
        if (!addWindow) {
            let height = 700;
            if (storage.getButtonByIndex(data)) {
                height += 50;
            }
            addWindow = new CustomWindow({
                file: path.join('render', "add.html"),
                width: 500,
                height: height,
                parent: window,
            });
            addWindow.once('show', () => {
                addWindow?.webContents.send('init', {settings: storage.getSettings(), index: data});
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
            if (args.change) {
                deleteButton(args.index);
            }
            addButton(args.index, fileName, args.volume, args.shortcut);
            addWindow?.close();
            window.show();
            window.webContents.send('settings', storage.getSettings());
        } catch (e) {
            log.error(e);
        }
    });
    ipcMain.on('existingSound', (event, args) => {
        if (args.change) {
            deleteButton(args.index);
        }
        addButton(args.index, args.file, args.volume, args.shortcut);
        addWindow?.close();
        window.show();
        window.webContents.send('settings', storage.getSettings());
    });
    ipcMain.on('setShortcut', (event, args) => {
        addMenuShortcut(args.action, args.shortcut);
        shortcutWindow?.close();
        window.show();
        window.webContents.send('settings', storage.getSettings());
    });
    ipcMain.on('deleteShortcut', (event, args) => {
        shortcutWindow?.close();
        window.show();
        window.webContents.send('settings', storage.getSettings());
        deleteMenuShortcut(args);
    })
    ipcMain.on('deleteButton', (event, args) => {
        deleteButton(args);
        addWindow?.close();
        window.show();
        window.webContents.send('settings', storage.getSettings());
    });
    ipcMain.on('addButton', (event, args) => {
        storage.addButton(args);
    });
}

function setupAutoUpdate() {
    autoUpdater.autoDownload = false;
    autoUpdater.logger = log;
    let progressWindow: CustomWindow | null = null;
    autoUpdater.on('download-progress', (info) => {
        if (!progressWindow) {
            progressWindow = new CustomWindow({
                file: path.join('render', "progress.html"),
                width: 600,
                height: 125,
                parent: window,
            });
            progressWindow.once('show', () => {
                progressWindow?.webContents.send('progress', info);
            });
            progressWindow.on('closed', () => {
                progressWindow = null
            });
        } else {
            progressWindow?.webContents.send('progress', info);
        }

    });
    autoUpdater.on('update-downloaded', async () => {
        progressWindow?.close();
        const ret = await dialog.showMessageBox({
            title: "Update heruntergeladen",
            type: "question",
            buttons: ["Update installieren und neustarten", "Update installieren und beenden", "Update jetzt nicht installieren"],
            defaultId: 0,
            cancelId: 2,
            noLink: true,
            message: `Das Update wurde heruntergeladen. Update jetzt installieren?`
        });
        const response = ret.response;
        if (response === 2) {
            return;
        }
        autoUpdater.quitAndInstall(true, response === 0);
    })
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
            buttons: ["Update herunterladen", "Update nicht herunterladen"],
            defaultId: 0,
            cancelId: 1,
            noLink: true,
            message: `Ein neues Update mit der Version: ${version}, veröffentlicht am ${releaseDate} wurde gefunden.\nHerunterladen?`

        });
        let reponse = ret.response;
        if (reponse === 1) {
            return;
        }
        await autoUpdater.downloadUpdate();
    });
    autoUpdater.on('error', (error) => {
        log.error("Error while checking for updates: ", error);
    });
}

function addButton(index: number, sound: string, volume: string, shortcut: string | undefined) {
    let vol;
    if (volume) {
        try {
            vol = parseFloat(volume);
        } catch (ignored) {
        }
    }
    const button = new Button(index, sound, vol, shortcut);
    storage.addButton(button);
    if (button.shortcut && !addShortcutForButton(button)) {
        dialog.showErrorBox("Shortcut nicht hinzugefügt", "Der Shortcut " + button.shortcut + " konnte nicht registriert werden! Eventuell wird er nicht unterstützt");
    }
}

function addMenuShortcut(action: string, shortcut: string) {
    if (!action || !shortcut) {
        return;
    }
    let oldShortcuts = storage.getMenuShortcuts();
    const menuShortcut = {
        action: action,
        shortcut: shortcut
    }
    storage.addMenuShortcut(menuShortcut);
    if (storage.getMenuShortcuts().length !== (oldShortcuts.length + 1)) {
        oldShortcuts.forEach(shortcut => unregisterShortcut(shortcut.shortcut));
        storage.getMenuShortcuts().forEach(addShortcutForMenu);
    } else {
        addShortcutForMenu(menuShortcut);
    }
}

function deleteMenuShortcut(action: string) {
    let menuShortcut = storage.getShortcutForAction(action);
    if (!menuShortcut) {
        return;
    }
    unregisterShortcut(menuShortcut.shortcut);
    storage.deleteMenuShortcut(action);
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
            response.on('data', () => {
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

function addShortcutForMenu(menuShortcut: MenuShortcut): boolean {
    return addShortcut(menuShortcut.shortcut, `Action: ${menuShortcut.action}`, () => {
        switch (menuShortcut.action) {
            case 'join':
                joinServer().catch(log.error);
                break
            case 'stop':
                stopSound().catch(log.error);
                break;
            case 'leave':
                leaveServer().catch(log.error);
                break;
            default:
                log.warn(`Action ${menuShortcut.action} is not supported at this time!`);
        }
    });
}

function addShortcutForButton(button: Button): boolean {
    return !!button.shortcut && addShortcut(button.shortcut, `Button: ${button.index}`, () => playSound(button.sound, button.volume).catch(log.error));
}

function addShortcut(shortcut: string, id: string, callback: () => void) {
    let registerSuccess = globalShortcut.register(shortcut, callback);
    if (!registerSuccess) {
        log.warn(`Couldn't register shortcut ` + shortcut + " for " + id);
    } else {
        log.debug("Added Shortcut " + shortcut);
    }
    return registerSuccess;
}

function unregisterShortcut(shortcut: string) {
    globalShortcut.unregister(shortcut);
    log.debug("Unregistered Shortcut " + shortcut);
}

function deleteButton(index: number) {
    const button = storage.getButtonByIndex(index);
    if (button?.shortcut) {
        unregisterShortcut(button.shortcut);
        log.debug("Unregistered " + button.shortcut);
    }
    storage.deleteButton(index);
}

app.on('ready', main);
app.on('window-all-closed', app.quit);
app.on('will-quit', globalShortcut.unregisterAll);