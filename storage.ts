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
        if (!settings.buttons) {
            settings.buttons = [];
        }
        settings.buttons.push(button);
        return this.saveSettings(settings);
    }

    deleteButton(index: number): Settings {
        const settings = this.getSettings();
        if (!settings.buttons) {
            settings.buttons = [];
        }
        settings.buttons = settings.buttons.filter(b => b.index !== index);
        return this.saveSettings(settings);
    }

    getButtonByIndex(index: number): Button | undefined {
        return this.getSettings().buttons.find(b => b.index === index);
    }

    getButtons(): Array<Button> {
        return this.getSettings().buttons;
    }

    private get(key: string) {
        return this.data[key];
    }

    private set(key: string, val: any) {
        this.data[key] = val;
        fs.writeFileSync(this.path, JSON.stringify(this.data));
    }

    private static parseDataFile(filePath: string, defaults: any) {
        try {
            // @ts-ignore
            return JSON.parse(fs.readFileSync(filePath));
        } catch (error) {
            return defaults;
        }
    }

    getUsername(): string {
        return this.getSettings().username;
    }
}