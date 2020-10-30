export class Button {
    index: number;
    sound: string;
    volume: number|undefined;

    constructor(index: number, sound: string,volume?:number) {
        this.index = index;
        this.sound = sound;
        this.volume=volume;
    }
}