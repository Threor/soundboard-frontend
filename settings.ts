import {Button} from "./button";

export interface Settings {
    username: string,
    buttons: Array<Button>,
    menuShortcuts: Array<MenuShortcut>,
    server: string,
    guild: string
}

export interface MenuShortcut {
    action: string;
    shortcut: string;
}