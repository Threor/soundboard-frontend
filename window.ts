const {BrowserWindow} = require('electron')

// default window settings
const defaultProps = {
    width: 920,
    height: 550,
    // update for electron V5+
    webPreferences: {
        enableRemoteModule: true,
        nodeIntegration: true
    }
}

export class CustomWindow extends BrowserWindow {
    // @ts-ignore
    constructor({file, ...windowSettings}) {
        super({...defaultProps, ...windowSettings})
        this.loadFile(file)
        this.once('ready-to-show', () => {
            this.show()
        });
        this.setMenuBarVisibility(false);
    }
}