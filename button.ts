export class Button {
    index: number;
    sound: string;
    volume: number | undefined;
    shortcut: string | undefined;

    constructor(index: number, sound: string, volume?: number, shortcut?: string) {
        this.index = index;
        this.sound = sound;
        this.volume = volume;
        this.shortcut=shortcut;
    }
}