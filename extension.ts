import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import St from 'gi://St';
import Gtk from 'gi://Gtk';
import Clutter from 'gi://Clutter';

import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Dialog from 'resource:///org/gnome/shell/ui/dialog.js';
import * as ModalDialog from 'resource:///org/gnome/shell/ui/modalDialog.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

const root = new St.Widget()

// const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
  static GObject = GObject.registerClass(Indicator)
  static testCounter = 0

  private static dlgRoot?: St.Widget
  private dlgRoot?: St.Widget

  _init() {
    super._init(0.5, _('My Shiny Indicator'));

    if (!Indicator.dlgRoot) {
      Indicator.dlgRoot = new St.Widget()
    }
    this.dlgRoot = new St.Widget()

    // this.add_child(new St.Icon({
    //     icon_name: 'face-smile-symbolic',
    //     style_class: 'system-status-icon',
    // }));
    this.add_child(new St.Label({
      text: _('Random meme'),
      yAlign: Clutter.ActorAlign.CENTER
    }))

    this.fillMenu()

    // let item = new PopupMenu.PopupMenuItem(_('Show'));
    // let item = new PopupMenu.PopupImageMenuItem(_('Show'), 'face-smile-symnolic');

    // let testCounter = 0
    // item.connect('activate', () => {
    //   console.log('COUNT: ', testCounter)
    //   // Crashes
    //   // const memeDlg = new Gtk.Window({
    //   //   title: _('Random meme'),
    //   //   // modal: false,
    //   // })
    //   // @ts-ignore
    //   this.menu.addMenuItem(new PopupMenu.PopupMenuItem(`${testCounter}`))
    //   testCounter++
    //   // Prevent automatic menu closing
    //   setTimeout(
    //     () => this.menu.open(false),
    //     0
    //   )
    // });
    // // @ts-ignore
    // this.menu.addMenuItem(item);
  }

  private fillMenu() {
    // const item = new PopupMenu.PopupMenuItem(Math.random().toString());
    const item = new PopupMenu.PopupMenuItem(_('Show'));
    item.connect('activate', () => {
      // this.redrawMenu()
      // setTimeout(
      //   () => this.menu.open(false),
      //   0
      // )
      this.showRandomMeme()
    });
    // @ts-ignore
    // this.menu.removeAll()
    // @ts-ignore
    this.menu.addMenuItem(item);
  }

  private showRandomMeme() {
    const pathToMeme = '~/Pictures/test-memes/photo_2024-06-08_12-59-20.jpg';

    console.log('SHOWSHOWSHOW')
    // const root = new St.Widget()
    // @ts-ignore
    // const dlg = new Dialog.Dialog(this.menu, 'meme-dialog');
    const dlg = new ModalDialog.ModalDialog({
      destroyOnClose: true,
      styleClass: 'meme-dialog',
    });

    const box = new St.BoxLayout({})
    // box.set_content(new Clutter.Image({}))
    box.add_child(new St.Label({text: pathToMeme}))
    dlg.dialogLayout.add_child(box)

    // const meme = new St.Icon({iconName: 'file:///home/dimas/Pictures/test-memes/photo_2024-06-08_12-59-20.jpg'})

    /////////////////////////////////////////////////////////
// const listLayout = new Dialog.ListSection({
//     title: 'Some List. Can we get rid of it?',
// });
// dlg.contentLayout.add_child(listLayout);

// listLayout.list.add_child(new Dialog.ListSectionItem({
//   //@ts-ignore
//   icon_actor: meme,
//   title: 'a'
// }))

// const taskOne = new Dialog.ListSectionItem({
//   // @ts-ignore
//     icon_actor: new St.Icon({icon_name: 'dialog-information-symbolic'}),
//     title: 'Task One',
//     description: 'The first thing I need to do',
// });
// listLayout.list.add_child(taskOne);

// const taskTwo = new Dialog.ListSectionItem({
//   // @ts-ignore
//     icon_actor: new St.Icon({icon_name: 'dialog-information-symbolic'}),
//     title: 'Task Two',
//     description: 'The next thing I need to do',
// });
// listLayout.list.add_child(taskTwo);
    /////////////////////////////////////////////////////////

    // dlg.contentLayout.add_child(new Clutter.Image())

    dlg.setButtons([{
      label: _('Thanks'),
      action: () => dlg.close(),
      // isDefault: true,
    }])

    dlg.open()

    setTimeout(() => {
      if (dlg.state === ModalDialog.State.OPENED) {
        dlg.close()
      }
    }, 5000)
  }
}
// );

// Indicator.GObject = GObject.registerClass(Indicator)

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