import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import St from 'gi://St';
import Gtk from 'gi://Gtk';
import Clutter from 'gi://Clutter';
import Gdk from 'gi://Gdk'
import GdkPixbuf from 'gi://GdkPixbuf'
import Cogl from 'gi://Cogl?version=14';

import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Dialog from 'resource:///org/gnome/shell/ui/dialog.js';
import * as ModalDialog from 'resource:///org/gnome/shell/ui/modalDialog.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

type Result<T> = [T | null | undefined, Error | null | undefined]

// TODO: MORE
const imgExtensions = new Set(['png', 'jpg', 'jpeg', 'bmp', 'webp'])

class Indicator extends PanelMenu.Button {
  static GObject = GObject.registerClass(Indicator)

  private settings?: Gio.Settings;

  _init() {
    super._init(0.5, _('My Shiny Indicator'));

    this.add_child(new St.Label({
      text: _('Random meme'),
      yAlign: Clutter.ActorAlign.CENTER
    }))

    this.fillMenu()
  }

  setSettings(settings: Gio.Settings) {
    this.settings = settings
  }

  private fillMenu() {
    const item = new PopupMenu.PopupMenuItem(_('Show'));
    item.connect('activate', () => {
      this.showRandomMeme()
    });
    // @ts-ignore
    this.menu.addMenuItem(item);
  }

  private showRandomMeme() {
    const [pathToMeme, err] = this.getMeme()
    if (!pathToMeme || err) {
      return logError('Failed to get img path', err)
    }

    let pixbuf: GdkPixbuf.Pixbuf;
    try {
      pixbuf = GdkPixbuf.Pixbuf.new_from_file(pathToMeme)
      if (!pixbuf) {
        throw new Error('No error caught but pixbuf is NULL')
      }
    } catch (err) {
      return logError('Failed to load img', err)
    }

    const img = new Clutter.Image()
    try {
      const succ = img.set_bytes(
        pixbuf.get_pixels(),
        pixbuf.hasAlpha ? Cogl.PixelFormat.RGBA_8888 : Cogl.PixelFormat.RGB_888,
        pixbuf.width, pixbuf.height, pixbuf.rowstride
      )
      if (!succ) {
        throw new Error('No error caught but `set_bytes` returned `false`')
      }
    } catch (err) {
      return logError('Failed to set img bytes', err)
    }

    const dlg = new ModalDialog.ModalDialog({
      destroyOnClose: true,
      styleClass: 'meme-dialog',
    });

    const maxW = dlg.dialogLayout.width
    const maxH = dlg.dialogLayout.height - 96

    let imgW = pixbuf.width
    let imgH = pixbuf.height

    const scaleW = maxW / imgW
    const scaleH = maxH / imgH
    const scale = Math.min(scaleW, scaleH)

    if (scale < 1) {
      imgW = Math.floor(imgW * scale)
      imgH = Math.floor(imgH * scale)
    }

    const box = new St.BoxLayout({
      width: imgW,
      height: imgH,
    })
    box.set_content(img)

    dlg.dialogLayout.add_child(box)

    dlg.setButtons([{
      label: _('Thanks'),
      action: () => dlg.close(),
      default: true,
    }])

    dlg.open()

    const debugCloseOnTimeout = false
    if (debugCloseOnTimeout) {
      setTimeout(() => dlg.close(), 3000)
    }
  }

  private getMeme(): Result<string> {
    try {
      const path = this.settings?.get_string('meme-folder')
      if (!path) {
        return [null, new Error(`No path found in settings`)]
      }
      const file = Gio.file_new_for_path(path)
      const fileType = file.query_file_type(Gio.FileQueryInfoFlags.NONE, null)
      if (fileType === Gio.FileType.UNKNOWN) {
        return [null, new Error(`file/directory \`${path}\` does not exist`)]
      }
      if (fileType === Gio.FileType.REGULAR) {
        return [path, null]
      }
      if (fileType !== Gio.FileType.DIRECTORY) {
        return [null, new Error(`Don't know what to do with file type ${fileType}`)]
      }
      const children = file.enumerate_children('', Gio.FileQueryInfoFlags.NONE, null)
      const imgs = []
      let child: Gio.FileInfo | null = null
      while ((child = children.next_file(null)) !== null) {
        if (child.get_file_type() !== Gio.FileType.REGULAR) {
          continue;
        }
        const fname = child.get_name()
        const fExt = fname.split('.').at(-1)
        if (fExt && imgExtensions.has(fExt)) {
          imgs.push(fname)
        }
      }
      if (!imgs.length) {
        return [null, new Error(`No images found in ${path}`)]
      }
      const rand = Math.floor(Math.random() * imgs.length)
      const fname = imgs[rand]
      return [`${path}/${fname}`, null]
    } catch (err) {
      return [null, err instanceof Error ? err : new Error(String(err))]
    }
  }
}

export default class MyExtension extends Extension {
  private gsettings?: Gio.Settings
  private indicator?: Indicator;

  enable() {
    this.gsettings = this.getSettings();
    // @ts-ignore
    this.indicator = new Indicator.GObject();
    this.indicator.setSettings(this.gsettings)
    Main.panel.addToStatusArea(this.uuid, this.indicator);
  }

  disable() {
    this.gsettings = undefined;
    this.indicator?.destroy();
    this.indicator = undefined;
  }
}

function logError(msg: string, err: unknown) {
  console.error(msg)
  console.error(err)
  Main.notifyError(msg, String(err))
}