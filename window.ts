const {BrowserWindow} = require('electron')

// default window settings
const defaultProps = {
    width: 920,
    height: 550,
    // update for electron V5+
    webPreferences: {
        nodeIntegration: true
    }
}

export class CustomWindow extends BrowserWindow {
    // @ts-ignore
    constructor({file, ...windowSettings}) {
        // calls new BrowserWindow with these props
        super({...defaultProps, ...windowSettings})

        // load the html and open devtools
        this.loadFile(file)
        // this.webContents.openDevTools()

        // gracefully show when ready to prevent flickering
        this.once('ready-to-show', () => {
            this.show()
        })
    }
}