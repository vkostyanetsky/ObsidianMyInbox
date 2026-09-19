import { AbstractInputSuggest, App, TAbstractFile, TFile, TFolder } from "obsidian";

const BASE_EXTENSION = "base";

/** Suggests vault paths of one kind while the user types into a setting. */
abstract class PathSuggest<T extends TAbstractFile> extends AbstractInputSuggest<T> {
	private readonly onPathSelected: (path: string) => void;

	constructor(app: App, inputEl: HTMLInputElement, onPathSelected: (path: string) => void) {
		super(app, inputEl);
		this.onPathSelected = onPathSelected;
	}

	/** Everything the input may resolve to, before the query narrows it down. */
	protected abstract candidates(): T[];

	protected getSuggestions(query: string): T[] {
		const needle = query.toLowerCase();

		return this.candidates()
			.filter((candidate) => candidate.path.toLowerCase().includes(needle))
			.sort((a, b) => a.path.localeCompare(b.path));
	}

	renderSuggestion(candidate: T, el: HTMLElement): void {
		el.setText(candidate.path);
	}

	selectSuggestion(candidate: T): void {
		this.setValue(candidate.path);
		this.onPathSelected(candidate.path);
		this.close();
	}
}

export class BaseFileSuggest extends PathSuggest<TFile> {
	protected candidates(): TFile[] {
		return this.app.vault.getFiles().filter((file) => file.extension === BASE_EXTENSION);
	}
}

export class FolderSuggest extends PathSuggest<TFolder> {
	protected candidates(): TFolder[] {
		return this.app.vault.getAllFolders(false);
	}
}
