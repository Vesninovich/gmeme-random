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

class Indicator extends PanelMenu.Button {
  static GObject = GObject.registerClass(Indicator)
  static testCounter = 0

  _init() {
    super._init(0.5, _('My Shiny Indicator'));

    this.add_child(new St.Label({
      text: _('Random meme'),
      yAlign: Clutter.ActorAlign.CENTER
    }))

    this.fillMenu()
  }

  private fillMenu() {
    const item = new PopupMenu.PopupMenuItem(_('Show'));
    item.connect('activate', () => {
      this.showRandomMeme()
    });
    // @ts-ignore
    this.menu.addMenuItem(item);
  }

  // TODO: random
  private showRandomMeme() {
    const pathToMeme = '/home/dimas/Pictures/test-memes/photo_2024-06-08_12-59-20.jpg';

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
}

export default class MyExtension extends Extension {
  private gsettings?: Gio.Settings
  private indicator?: Indicator;

  enable() {
    this.gsettings = this.getSettings();
    // @ts-ignore
    this.indicator = new Indicator.GObject();
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