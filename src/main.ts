import {
	Keymap,
	Notice,
	Plugin,
	TFile,
	Vault,
	WorkspaceLeaf,
	debounce,
	normalizePath,
} from "obsidian";
import { DEFAULT_SETTINGS, MyInboxSettingTab, type MyInboxSettings } from "./settings";

const RIBBON_ICON = "inbox";
const RIBBON_TITLE = "Open inbox";
const RIBBON_CLASS = "my-inbox-ribbon-icon";
const COUNT_ATTRIBUTE = "data-my-inbox-count";

/** Counts above this are shown as "99+" so the badge stays narrow. */
const COUNT_LIMIT = 99;

/** Vault events arrive in bursts during sync, so recounting waits them out. */
const RECOUNT_DELAY = 300;

export default class MyInboxPlugin extends Plugin {
	settings: MyInboxSettings = { ...DEFAULT_SETTINGS };

	private ribbonIconEl: HTMLElement | null = null;

	private readonly scheduleCountRefresh = debounce(
		() => {
			this.refreshCount();
		},
		RECOUNT_DELAY,
		true,
	);

	async onload(): Promise<void> {
		await this.loadSettings();

		this.addSettingTab(new MyInboxSettingTab(this.app, this));
		this.refreshRibbonIcon();

		// The vault is still filling up during onload, so the first count waits.
		this.app.workspace.onLayoutReady(() => {
			this.refreshCount();
		});

		const recount = () => {
			this.scheduleCountRefresh();
		};

		this.registerEvent(this.app.vault.on("create", recount));
		this.registerEvent(this.app.vault.on("delete", recount));
		this.registerEvent(this.app.vault.on("rename", recount));
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.refreshRibbonIcon();
		this.refreshCount();
	}

	private async loadSettings(): Promise<void> {
		const data: unknown = await this.loadData();
		const stored = (data ?? {}) as Partial<MyInboxSettings>;

		this.settings = Object.assign({}, DEFAULT_SETTINGS, {
			inboxBasePath: readPath(stored.inboxBasePath, DEFAULT_SETTINGS.inboxBasePath),
			inboxFolderPath: readPath(stored.inboxFolderPath, DEFAULT_SETTINGS.inboxFolderPath),
		});
	}

	/** Shows the ribbon icon only while a base file is configured. */
	private refreshRibbonIcon(): void {
		const shouldShow = this.settings.inboxBasePath.length > 0;

		if (shouldShow && this.ribbonIconEl === null) {
			this.ribbonIconEl = this.addRibbonIcon(RIBBON_ICON, RIBBON_TITLE, (evt) => {
				void this.openInboxBase(evt);
			});
			this.ribbonIconEl.addClass(RIBBON_CLASS);
		} else if (!shouldShow && this.ribbonIconEl !== null) {
			this.ribbonIconEl.remove();
			this.ribbonIconEl = null;
		}
	}

	/** Puts the number of notes waiting in the inbox folder onto the ribbon icon. */
	private refreshCount(): void {
		const iconEl = this.ribbonIconEl;

		if (iconEl === null) {
			return;
		}

		const count = this.countInboxNotes();

		if (count === 0) {
			iconEl.removeAttribute(COUNT_ATTRIBUTE);
			iconEl.setAttribute("aria-label", RIBBON_TITLE);
			return;
		}

		const label = count > COUNT_LIMIT ? `${COUNT_LIMIT}+` : String(count);

		iconEl.setAttribute(COUNT_ATTRIBUTE, label);
		iconEl.setAttribute("aria-label", `${RIBBON_TITLE} (${label})`);
	}

	private countInboxNotes(): number {
		if (this.settings.inboxFolderPath.length === 0) {
			return 0;
		}

		const folder = this.app.vault.getFolderByPath(normalizePath(this.settings.inboxFolderPath));

		if (folder === null) {
			return 0;
		}

		let count = 0;

		Vault.recurseChildren(folder, (child) => {
			if (child instanceof TFile && child.extension === "md") {
				count++;
			}
		});

		return count;
	}

	private async openInboxBase(evt: MouseEvent): Promise<void> {
		const path = normalizePath(this.settings.inboxBasePath);
		const file = this.app.vault.getAbstractFileByPath(path);

		if (!(file instanceof TFile)) {
			new Notice(`Inbox base not found: ${path}`);
			return;
		}

		const openLeaf = this.findLeafShowing(file);

		if (openLeaf) {
			await this.app.workspace.revealLeaf(openLeaf);
			return;
		}

		await this.app.workspace.getLeaf(Keymap.isModEvent(evt)).openFile(file);
	}

	private findLeafShowing(file: TFile): WorkspaceLeaf | undefined {
		const matches: WorkspaceLeaf[] = [];

		this.app.workspace.iterateAllLeaves((leaf) => {
			const state = leaf.getViewState().state;

			if (typeof state?.file === "string" && state.file === file.path) {
				matches.push(leaf);
			}
		});

		return matches[0];
	}
}

function readPath(stored: unknown, fallback: string): string {
	return typeof stored === "string" ? stored : fallback;
}
