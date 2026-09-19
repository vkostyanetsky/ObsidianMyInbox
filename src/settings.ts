import { App, PluginSettingTab, Setting } from "obsidian";
import { BaseFileSuggest, FolderSuggest } from "./suggest";
import type MyInboxPlugin from "./main";

export interface MyInboxSettings {
	/** Vault-relative path of the base file that lists incoming notes. */
	inboxBasePath: string;
	/** Vault-relative path of the folder whose notes are counted on the ribbon icon. */
	inboxFolderPath: string;
}

export const DEFAULT_SETTINGS: MyInboxSettings = {
	inboxBasePath: "",
	inboxFolderPath: "",
};

const BASE_PATH_NAME = "Inbox base";
const BASE_PATH_DESC =
	"Path to the base file that lists your incoming notes. While it is empty, the ribbon icon stays hidden.";

const FOLDER_PATH_NAME = "Inbox folder";
const FOLDER_PATH_DESC =
	"Path to the folder that holds your incoming notes. Its notes, including the ones in subfolders, are counted on the ribbon icon. While it is empty, no count is shown.";

export class MyInboxSettingTab extends PluginSettingTab {
	private readonly plugin: MyInboxPlugin;

	constructor(app: App, plugin: MyInboxPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/** Obsidian 1.13+ renders from these definitions and skips display(). */
	getSettingDefinitions() {
		return [
			{
				name: BASE_PATH_NAME,
				desc: BASE_PATH_DESC,
				aliases: ["ribbon", "base", "inbox"],
				render: (setting: Setting) => {
					this.renderBasePath(setting);
				},
			},
			{
				name: FOLDER_PATH_NAME,
				desc: FOLDER_PATH_DESC,
				aliases: ["ribbon", "badge", "count", "folder", "inbox"],
				render: (setting: Setting) => {
					this.renderFolderPath(setting);
				},
			},
		];
	}

	/** Fallback for Obsidian below 1.13, where setting definitions are ignored. */
	display(): void {
		this.containerEl.empty();

		this.renderBasePath(
			new Setting(this.containerEl).setName(BASE_PATH_NAME).setDesc(BASE_PATH_DESC),
		);
		this.renderFolderPath(
			new Setting(this.containerEl).setName(FOLDER_PATH_NAME).setDesc(FOLDER_PATH_DESC),
		);
	}

	private renderBasePath(setting: Setting): void {
		setting.addSearch((search) => {
			search
				.setPlaceholder("Inbox.base")
				.setValue(this.plugin.settings.inboxBasePath)
				.onChange((value) => {
					void this.saveBasePath(value);
				});

			search.inputEl.setAttribute("aria-label", BASE_PATH_NAME);

			new BaseFileSuggest(this.app, search.inputEl, (path) => {
				void this.saveBasePath(path);
			});
		});
	}

	private renderFolderPath(setting: Setting): void {
		setting.addSearch((search) => {
			search
				.setPlaceholder("Inbox")
				.setValue(this.plugin.settings.inboxFolderPath)
				.onChange((value) => {
					void this.saveFolderPath(value);
				});

			search.inputEl.setAttribute("aria-label", FOLDER_PATH_NAME);

			new FolderSuggest(this.app, search.inputEl, (path) => {
				void this.saveFolderPath(path);
			});
		});
	}

	private async saveBasePath(value: string): Promise<void> {
		this.plugin.settings.inboxBasePath = value.trim();
		await this.plugin.saveSettings();
	}

	private async saveFolderPath(value: string): Promise<void> {
		this.plugin.settings.inboxFolderPath = value.trim();
		await this.plugin.saveSettings();
	}
}
