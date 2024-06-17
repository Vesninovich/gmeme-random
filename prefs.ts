import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
// import { ExtensionMetadata } from '@girs/gnome-shell/extensions/extension';

const FolderPickRow = GObject.registerClass({
  Signals: {
    ['meme_folder_select']: {
      param_types: [GObject.TYPE_STRING]
    }
  },
  // Properties: {
  //   // @ts-ignore
  //   selectedFolder: new GObject.ParamSpec.string(
  //     'selected',
  //     'selected',
  //     'selected',
  //     GObject.ParamFlags.WRITABLE,
  //     'none'
  //   )
  //   onFolderSelect: {
  //     name: 'onFolderSelect',
  //     flags: GObject.ParamFlags.CONSTRUCT_ONLY,
  //     value_type: GObject.TYPE_POINTER,

  //   }
  // }
},
  class FolderPickRow extends Adw.ActionRow {
    private btn?: Gtk.Button;
    // private pathLabel?: Gtk.Label;
    private folderDlg?: Gtk.FileDialog;

    // private selectedPath = 'none';

    // constructor(props: any, ...args: any[]) {
    //   super(props, ...args)


    // }

    _init(...args: any[]): void {
      super._init(...args)

      // this.pathLabel = new Gtk.Label({
      //   // @ts-ignore
      //   label: _('Current: ') + this.get_property('selected-folder', 'asd')
      // })
      // this.pathLabel = new Gtk.Label({label: this.selectedPath || 'none'})
      // this.bind_property('selected', this.pathLabel, 'label', GObject.BindingFlags.DEFAULT)
      // this.add_suffix(this.pathLabel)


      this.btn = new Gtk.Button({ label: _('Choose folder') })
      this.btn.set_valign(Gtk.Align.CENTER)
      this.btn.set_can_focus(false)
      this.set_activatable(true)
      this.add_suffix(this.btn)
      this.set_activatable_widget(this.btn)

      // TODO: which one is needed?
      this.btn.connect('clicked', () => this.openFolderChoice())
      // this.connect('activated', () => this.openFolderChoice())
    }

    // updSelected(selected: string) {
    //   console.log('SELECTED: ', selected)
    //   console.log('LABEL IS ', this.pathLabel)
    //   this.selectedPath = selected
    //   this.pathLabel?.set_label(this.selectedPath)
    // }

    private openFolderChoice() {
      this.folderDlg = new Gtk.FileDialog({
        title: _('Pick folder with memes'),
        modal: true,
      })
      // typing is incorrect, see https://docs.gtk.org/gtk4/method.FileDialog.select_folder.html
      // @ts-ignore
      this.folderDlg.select_folder(this.get_root(), null, (_, res) => this.finishFolderChoice(res))
    }

    private finishFolderChoice(res: Gio.AsyncResult) {
      try {
        const file = this.folderDlg?.select_folder_finish(res)
        if (!file) {
          return
        }
        const folder = file.get_path()
        console.log('selected folder:', folder)
        this.emit('meme_folder_select', folder)
      } catch (err) {
        console.log('Error, probably no file selected')
        console.error(err)
      }
    }
  }
)

export default class GnomeRectanglePreferences extends ExtensionPreferences {
  _settings?: Gio.Settings

  // constructor(metadata: ExtensionMetadata) {
  //   super(metadata)
  //   this._
  // }

  fillPreferencesWindow(window: Adw.PreferencesWindow) {
    this._settings = this.getSettings();

    const page = new Adw.PreferencesPage({
      title: _('General'),
      iconName: 'dialog-information-symbolic',
    });

    const testGroup = new Adw.PreferencesGroup({
      title: _('Where to get memes')
    });
    page.add(testGroup);

    const testRow = new FolderPickRow({
      title: _('Folder'),
    })
    // testRow.updSelected(this._settings.get_string('meme-folder'))
    // testRow.set_property('selected', this._settings.get_string('meme-folder'))
    testGroup.add(testRow)
    testRow.connect('meme_folder_select', (_, folder) => {
      console.log('Setting meme folder to', folder)
      this._settings!.set_string('meme-folder', folder)
      // testRow.updSelected(folder)
      // testRow.set_property('selected-folder', folder)
    })

    // const animationGroup = new Adw.PreferencesGroup({
    //   title: _('Animation'),
    //   description: _('Configure move/resize animation'),
    // });
    // page.add(animationGroup);

    // const animationEnabled = new Adw.SwitchRow({
    //   title: _('Enabled'),
    //   subtitle: _('Wether to animate windows'),
    // });
    // animationGroup.add(animationEnabled);

    // const paddingGroup = new Adw.PreferencesGroup({
    //   title: _('Paddings'),
    //   description: _('Configure the padding between windows'),
    // });
    // page.add(paddingGroup);

    // const paddingInner = new Adw.SpinRow({
    //   title: _('Inner'),
    //   subtitle: _('Padding between windows'),
    //   adjustment: new Gtk.Adjustment({
    //     lower: 0,
    //     upper: 1000,
    //     stepIncrement: 1
    //   })
    // });
    // paddingGroup.add(paddingInner);

    window.add(page)

    // this._settings!.bind('meme-folder', testRow, 'meme_folder_select', Gio.SettingsBindFlags.DEFAULT);

    // this._settings!.bind('animate', animationEnabled, 'active', Gio.SettingsBindFlags.DEFAULT);
    // this._settings!.bind('padding-inner', paddingInner, 'value', Gio.SettingsBindFlags.DEFAULT);
  }
}
