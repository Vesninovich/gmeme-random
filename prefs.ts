import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const FolderPickRow = GObject.registerClass({
  Signals: {
    ['folder-select']: {
      param_types: [GObject.TYPE_STRING]
    }
  },
  Properties: {
    selected: GObject.ParamSpec.string(
      'selected',
      'selected',
      'selected',
      GObject.ParamFlags.READWRITE,
      'none'
    )
  }
},
  class FolderPickRow extends Adw.ActionRow {
    private selected?: string

    _init(...args: any[]): void {
      super._init(...args)

      const pathLabel = new Gtk.Label({ label: this.selected })
      this.bind_property('selected', pathLabel, 'label', GObject.BindingFlags.DEFAULT)
      this.add_prefix(pathLabel)
      this.add_prefix(new Gtk.Label({ label: _('Current: ') }))

      const btn = new Gtk.Button({ label: _('Choose folder') })
      btn.set_valign(Gtk.Align.CENTER)
      btn.set_can_focus(false)
      this.set_activatable(true)
      this.add_suffix(btn)
      this.set_activatable_widget(btn)

      btn.connect('clicked', () => this.openFolderChoiceDlg())
    }

    private openFolderChoiceDlg() {
      const dlg = new Gtk.FileDialog({
        title: _('Pick folder with memes'),
        modal: true,
      })
      dlg.select_folder(
        this.get_root(),
        null,
        // @ts-ignore: see https://docs.gtk.org/gtk4/method.FileDialog.select_folder.html
        (_, res) => this.finishFolderChoiceDlg(dlg, res)
      )
    }

    private finishFolderChoiceDlg(dlg: Gtk.FileDialog, res: Gio.AsyncResult) {
      try {
        const file = dlg.select_folder_finish(res)
        if (!file) {
          return
        }
        const folder = file.get_path()
        this.emit('folder-select', folder)
      } catch (err) {
        console.error('Error, probably no file selected')
        console.error(err)
      }
    }
  }
)

export default class GnomeRectanglePreferences extends ExtensionPreferences {
  fillPreferencesWindow(window: Adw.PreferencesWindow) {
    const settings = this.getSettings();

    const page = new Adw.PreferencesPage({
      title: _('General'),
      iconName: 'dialog-information-symbolic',
    });

    const testGroup = new Adw.PreferencesGroup({
      title: _('Where to get memes')
    });
    page.add(testGroup);

    const testRow = new FolderPickRow({
      // @ts-ignore: need custom constructor typing
      selected: settings.get_string('meme-folder')
    })
    testGroup.add(testRow)
    testRow.connect('folder-select', (_, folder) => {
      console.log('Setting meme folder to', folder)
      settings.set_string('meme-folder', folder)
      testRow.set_property('selected', folder)
    })

    window.add(page)
  }
}
