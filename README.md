# My Inbox 📥 📊 🔢

An Obsidian plugin putting my incoming notes one click away: a ribbon icon that opens the base they are listed in, with the number of notes still waiting drawn over it.

> **A personal tool.** This plugin exists to make my day-to-day work easier, and its behaviour is shaped entirely by how I structure my notes. It is not intended to be a general-purpose Obsidian plugin, and there are no plans to submit it to the community catalogue. You are welcome to use it if your notes happen to follow the same conventions, but nothing here is designed with anyone else's workflow in mind.

## ✨ What it does

1. Open **Settings → My Inbox**.
2. Set **Inbox base** to the vault-relative path of a `.base` file. The field suggests every base in the vault.
3. A ribbon icon appears. Click it to open that base.
4. Optionally set **Inbox folder** to get the number of waiting notes drawn over that icon.

The icon is shown only while **Inbox base** has a value — clear the field and it disappears again. No restart is needed either way.

If the base is already open in a tab, clicking the icon reveals that tab instead of opening a second one. `Ctrl`/`Cmd` + click opens it in a new tab. A path that points at nothing says so in a notice rather than failing silently.

Requires Obsidian 1.9.0 or newer, the version bases arrived in.

## 🔢 The count

Obsidian exposes no way to run a base query in the background — the results of one only ever reach a view that is being rendered — so the badge does not count the rows of the base. It counts the Markdown notes of **Inbox folder**, the ones in its subfolders included.

- The count is redone whenever a note is created, deleted, renamed or moved, and the bursts of events a sync brings are waited out rather than acted on one by one.
- An empty folder shows no badge at all, and anything above 99 is drawn as `99+`.
- The number is repeated in the tooltip of the icon, so it is also read out as **Open inbox (12)**.

Point **Inbox folder** at the folder the base filters on and the two agree. If the base filters on something else — a tag, a property — the badge is an approximation of what it lists, not the same number.

## ⚙️ Settings

| Setting | What it does |
| --- | --- |
| **Inbox base** | The base file the ribbon icon opens. While it is empty, there is no ribbon icon. |
| **Inbox folder** | The folder whose notes are counted on that icon, subfolders included. While it is empty, no count is drawn. |

Both fields suggest what the vault has to offer as you type — bases for the first, folders for the second.

## 🔨 Building

Requires Node.js 18 or newer.

```bash
npm install
```

Production build — type-checks and writes `main.js`:

```bash
npm run build
```

Development build with rebuild-on-change:

```bash
npm run dev
```

Lint, the same rule set the community plugin scanner runs:

```bash
npm run lint
```

## 📦 Deploying to a vault

The vault lives in a `.env` file of your own, which is not in the repository. Copy the example and put your path in it:

```bash
cp .env.example .env
```

```ini
OBSIDIAN_VAULT=D:\Me\Vault
```

Then build and copy the plugin into that vault in one step:

```bash
npm run deploy
```

It writes `main.js`, `manifest.json` and `styles.css` to `<vault>/.obsidian/plugins/my-inbox/`, creating the folder if it is not there. A different vault can be given for a single run — as the first argument (`node scripts/deploy.mjs "C:\Path\To\Vault"`) or in an `OBSIDIAN_VAULT` environment variable, both of which win over `.env`. A folder without `.obsidian` inside is refused, nothing is copied when `main.js` has not been built yet, and a missing `.env` is reported rather than guessed around.

In VS Code the same thing runs from the command palette (`Ctrl+Shift+P`) → **Tasks: Run Task**:

- **Deploy plugin to Obsidian vault** — builds, then copies;
- **Copy plugin to Obsidian vault (no build)** — copies whatever `main.js` is there right now, handy next to `npm run dev`.

Both are defined in [.vscode/tasks.json](.vscode/tasks.json) and can be given a keyboard shortcut of their own through **Preferences: Open Keyboard Shortcuts (JSON)**:

```json
{
	"key": "ctrl+alt+d",
	"command": "workbench.action.tasks.runTask",
	"args": "Deploy plugin to Obsidian vault"
}
```

After the first deployment, restart Obsidian (or reload the app) and enable **My Inbox** in **Settings → Community plugins**; after later ones, reloading the plugin is enough.

Alternatively, to develop against a live vault without copying anything, clone this repository straight into `<your vault>/.obsidian/plugins/my-inbox/`, run `npm run dev`, and reload the plugin after each change.

## 🗂️ Project layout

| Path | Purpose |
| --- | --- |
| [src/main.ts](src/main.ts) | The plugin: the ribbon icon, opening the base, counting the folder |
| [src/settings.ts](src/settings.ts) | The stored settings and the settings tab |
| [src/suggest.ts](src/suggest.ts) | Suggesting vault bases and folders while one is typed |
| [styles.css](styles.css) | The count badge drawn over the ribbon icon |
| [scripts/deploy.mjs](scripts/deploy.mjs) | Copying the built plugin into a vault |
| [.env.example](.env.example) | Where the vault path goes, once copied to `.env` |
| [.vscode/tasks.json](.vscode/tasks.json) | VS Code tasks for deploying |

The settings tab is written twice over: `getSettingDefinitions()` for Obsidian 1.13 and newer, which renders the settings itself and puts them into the global search, and `display()` for the versions before it, which ignore the definitions. Both call the same pair of methods, so a field is described in one place and rendered from two.

## 🙏 Credits

Scaffolded and reviewed with the help of the [obsidian-plugin-skill](https://github.com/gapmiss/obsidian-plugin-skill) for Claude.
