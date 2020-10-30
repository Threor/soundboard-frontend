import {Settings} from "./settings";
import {Button} from "./button";
import * as electron from "electron";
import * as path from "path";
import * as fs from "fs";

export class DataStorage {

    private settings: Settings;
    private readonly path: string;
    private readonly data: any;

    constructor(opts: any) {
        const userDataPath = (electron.app || electron.remote.app).getPath('userData');
        // We'll use the `configName` property to set the file name and path.join to bring it all together as a string
        this.path = path.join(userDataPath, opts.configName + '.json');
        this.data = DataStorage.parseDataFile(this.path, {});
        this.settings = this.getSettings();
    }

    getSettings(): Settings {
        // @ts-ignore
        this.settings = this.get('settings') || {}
        return this.settings;
    }

    changeUsername(username: string): Settings {
        const settings = this.getSettings();
        settings.username = username;
        return this.saveSettings(settings);
    }

    saveSettings(settings: Settings): Settings {
        this.set('settings', settings)
        return this.getSettings();
    }

    addButton(button: Button): Settings {
        const settings = this.getSettings();
        if(!settings.buttons) {
            settings.buttons=[];
        }
        settings.buttons.push(button);
        return this.saveSettings(settings);
    }

    deleteButton(index: number): Settings {
        const settings = this.getSettings();
        if(!settings.buttons) {
            settings.buttons=[];
        }
        settings.buttons = settings.buttons.filter(b => b.index !== index);
        return this.saveSettings(settings);
    }

    getButtonByIndex(index: number) {
        return this.getSettings().buttons.find(b => b.index === index);
    }

    private get(key: string) {
        return this.data[key];
    }

    private set(key: string, val: any) {
        this.data[key] = val;
        fs.writeFileSync(this.path, JSON.stringify(this.data));
    }

    private static parseDataFile(filePath: string, defaults: any) {
        // We'll try/catch it in case the file doesn't exist yet, which will be the case on the first application run.
        // `fs.readFileSync` will return a JSON string which we then parse into a Javascript object
        try {
            // @ts-ignore
            return JSON.parse(fs.readFileSync(filePath));
        } catch (error) {
            // if there was some kind of error, return the passed in defaults instead.
            return defaults;
        }
    }

    getUsername(): string {
        return this.getSettings().username;
    }
}