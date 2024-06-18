import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GdkPixbuf from 'gi://GdkPixbuf';
import Cogl from 'gi://Cogl?version=14';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as ModalDialog from 'resource:///org/gnome/shell/ui/modalDialog.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
// TODO: more extensions
const imgExtensions = new Set(['png', 'jpg', 'jpeg', 'bmp', 'webp']);
class Indicator extends PanelMenu.Button {
    static GObject = GObject.registerClass({
        Properties: {
            memeFolder: GObject.ParamSpec.string('memeFolder', 'memeFolder', 'memeFolder', GObject.ParamFlags.READWRITE, 'none')
        }
    }, Indicator);
    memeFolder;
    _init(...args) {
        super._init(...args);
        this.add_child(new St.Label({
            text: this.accessibleName,
            yAlign: Clutter.ActorAlign.CENTER
        }));
        const item = new PopupMenu.PopupMenuItem(_('Show random'));
        item.connect('activate', () => {
            this.showRandomMeme();
        });
        // @ts-ignore: `addMenuItem` does not exist on type for some reason
        this.menu.addMenuItem(item);
    }
    showRandomMeme() {
        const [pathToMeme, err] = this.getMeme();
        if (!pathToMeme || err) {
            return logError('Failed to get img path', err);
        }
        let pixbuf;
        try {
            pixbuf = GdkPixbuf.Pixbuf.new_from_file(pathToMeme);
            if (!pixbuf) {
                throw new Error('No error caught but pixbuf is NULL');
            }
        }
        catch (err) {
            return logError('Failed to load img', err);
        }
        const img = new Clutter.Image();
        try {
            const succ = img.set_bytes(pixbuf.get_pixels(), pixbuf.hasAlpha ? Cogl.PixelFormat.RGBA_8888 : Cogl.PixelFormat.RGB_888, pixbuf.width, pixbuf.height, pixbuf.rowstride);
            if (!succ) {
                throw new Error('No error caught but `set_bytes` returned `false`');
            }
        }
        catch (err) {
            return logError('Failed to set img bytes', err);
        }
        const dlg = new ModalDialog.ModalDialog({
            destroyOnClose: true,
            styleClass: 'meme-dialog',
        });
        const maxW = dlg.dialogLayout.width;
        const maxH = dlg.dialogLayout.height - 96;
        let imgW = pixbuf.width;
        let imgH = pixbuf.height;
        const scaleW = maxW / imgW;
        const scaleH = maxH / imgH;
        const scale = Math.min(scaleW, scaleH);
        if (scale < 1) {
            imgW = Math.floor(imgW * scale);
            imgH = Math.floor(imgH * scale);
        }
        const box = new St.BoxLayout({
            width: imgW,
            height: imgH,
        });
        box.set_content(img);
        dlg.dialogLayout.add_child(box);
        dlg.setButtons([{
                label: _('Thanks'),
                action: () => dlg.close(),
                default: true,
            }]);
        dlg.open();
        const debugCloseOnTimeout = false;
        if (debugCloseOnTimeout) {
            setTimeout(() => dlg.close(), 3000);
        }
    }
    getMeme() {
        try {
            const path = this.memeFolder;
            if (!path) {
                return [null, new Error(`No path set`)];
            }
            const file = Gio.file_new_for_path(path);
            const fileType = file.query_file_type(Gio.FileQueryInfoFlags.NONE, null);
            console.log(file.get_path());
            if (fileType === Gio.FileType.UNKNOWN) {
                return [null, new Error(`file/directory \`${path}\` does not exist`)];
            }
            if (fileType === Gio.FileType.REGULAR) {
                return [path, null];
            }
            if (fileType !== Gio.FileType.DIRECTORY) {
                return [null, new Error(`Don't know what to do with file type ${fileType}`)];
            }
            const children = file.enumerate_children('', Gio.FileQueryInfoFlags.NONE, null);
            const imgs = [];
            let child = null;
            while ((child = children.next_file(null)) !== null) {
                if (child.get_file_type() !== Gio.FileType.REGULAR) {
                    continue;
                }
                const fname = child.get_name();
                const fExt = fname.split('.').at(-1);
                if (fExt && imgExtensions.has(fExt)) {
                    imgs.push(fname);
                }
            }
            if (!imgs.length) {
                return [null, new Error(`No images found in ${path}`)];
            }
            const rand = Math.floor(Math.random() * imgs.length);
            const fname = imgs[rand];
            return [`${path}/${fname}`, null];
        }
        catch (err) {
            return [null, err instanceof Error ? err : new Error(String(err))];
        }
    }
}
export default class MyExtension extends Extension {
    indicator;
    enable() {
        const settings = this.getSettings();
        this.indicator = new Indicator.GObject(0.5, _('memes'));
        settings.bind('meme-folder', this.indicator, 'memeFolder', Gio.SettingsBindFlags.DEFAULT);
        Main.panel.addToStatusArea(this.uuid, this.indicator);
    }
    disable() {
        this.indicator?.destroy();
        this.indicator = undefined;
    }
}
function logError(msg, err) {
    console.error(msg);
    console.error(err);
    Main.notifyError(msg, String(err));
}
