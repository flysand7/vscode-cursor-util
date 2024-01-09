import * as vscode from 'vscode';

function number_to_format(n: number, format: string): string {
	switch(format) {
		case 'b': return n.toString(2);
		case 'o': return n.toString(8);
		case 'd': return n.toString(10);
		case 'x': return n.toString(16);
	}
	return n.toString();
}

function parse_range(s: string): [number, number, boolean] {
	const colon_pos = s.indexOf(':');
	const a0 = s.slice(0, colon_pos);
	const a1 = s.slice(colon_pos+1);
	const n0 = Number.parseInt(a0, 10);
	const n1 = Number.parseInt(a1, 10);
	if(isNaN(n0) || isNaN(n1)) {
		return [0, 0, false];
	}
	return [n0, n1, true];
}

async function insert_numbers(): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if(editor === undefined) {
		vscode.window.showInformationMessage('Editor inactive');
		return;
	}
	const res = await vscode.window.showQuickPick(
		[
			{description: "Decimal",     label: "d"},
			{description: "Hexadecimal", label: "x"},
			{description: "Binary",      label: "b"},
			{description: "Octal",       label: "o"},
		],
	);
	let format = res? res.label : 'd';
	const range = await vscode.window.showInputBox(
		{
			prompt: '0:1',
			value: '0:1',
			title: "Enter the range",
		},
	);
	const range_str = range ?? '0:1';
	const [range_start, range_inc, range_ok] = parse_range(range_str);
	if(!range_ok) {
		vscode.window.showErrorMessage("Invalid format for the range string");
		return;
	}
	const selections: vscode.Selection[] = [];
	for(const selection of editor.selections) {
		selections.push(selection);
	}
	selections.sort((a, b: vscode.Selection): number => {
		return a.anchor.compareTo(b.anchor);
	});
	let start = range_start;
	const edit_ok = await editor.edit((builder: vscode.TextEditorEdit) => {
		let selection_idx = 0;
		for(const selection of selections) {
			const selection_range = new vscode.Range(selection.anchor, selection.active);
			const insertion = number_to_format(start, format);
			const position = selection.anchor.with();
			const selection_col = position.character + insertion.length;
			const selection_end = position.with(undefined, selection_col);
			builder.replace(selection_range, insertion);
			const new_selection = new vscode.Selection(position, selection_end);
			selections[selection_idx] = new_selection;
			start += 1;
			selection_idx += range_inc;
		}
	});
	if(edit_ok) {
		editor.selections = selections;
		return;
	};
}

async function find_forwards(): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if(editor === undefined) {
		return;
	}
	const char = await vscode.window.showInputBox(
		{
			prompt: ',',
			value: ',',
			title: "Enter the character",
		},
	);
	if(char === undefined) {
		return;
	}
	const cursors = editor.selections;
	const new_cursors: vscode.Selection[] = [];
	for(const cursor of cursors) {
		let new_position: vscode.Position|undefined = undefined;
		const line_no = cursor.anchor.line;
		const column = cursor.anchor.character;
		const line = editor.document.lineAt(line_no).text;
		for(let pos = column+1; pos < line.length; pos += 1) {
			if(line[pos] === char) {
				new_position = new vscode.Position(line_no, pos);
				break;
			}
		}
		if(new_position !== undefined) {
			const new_cursor = new vscode.Selection(
				new_position,
				new_position.with(undefined, new_position.character+1),
			);
			new_cursors.push(new_cursor);
		}
	}
	editor.selections = new_cursors;
}

async function find_backwards(): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if(editor === undefined) {
		return;
	}
	const char = await vscode.window.showInputBox(
		{
			prompt: ',',
			value: ',',
			title: "Enter the character",
		},
	);
	if(char === undefined) {
		return;
	}
	const cursors = editor.selections;
	const new_cursors: vscode.Selection[] = [];
	for(const cursor of cursors) {
		let new_position: vscode.Position|undefined = undefined;
		const line_no = cursor.anchor.line;
		const column = cursor.anchor.character;
		const line = editor.document.lineAt(line_no).text;
		for(let pos = column-1; pos >= 0; pos -= 1) {
			if(line[pos] === char) {
				new_position = new vscode.Position(line_no, pos);
				break;
			}
		}
		if(new_position !== undefined) {
			const new_cursor = new vscode.Selection(
				new_position,
				new_position.with(undefined, new_position.character+1),
			);
			new_cursors.push(new_cursor);
		}
	}
	editor.selections = new_cursors;
}

async function merge_selections(): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if(editor === undefined) {
		return;
	}
	const cursors = editor.selections;
	if(cursors.length < 1) {
		return;
	}
	let min_pos: vscode.Position|undefined = cursors[0].anchor;
	let max_pos: vscode.Position|undefined = cursors[0].anchor;
	for(const cursor of cursors) {
		const pos_a = cursor.anchor;
		const pos_b = cursor.active;
		if(pos_a.compareTo(min_pos) < 0) {
			min_pos = pos_a;
		}
		if(pos_a.compareTo(max_pos) > 0) {
			max_pos = pos_a;
		}
		if(pos_b.compareTo(min_pos) < 0) {
			min_pos = pos_b;
		}
		if(pos_b.compareTo(max_pos) > 0) {
			max_pos = pos_b;
		}
	}
	editor.selections = [
		new vscode.Selection(min_pos, max_pos),
	];
}

function reverse_chr(chr: string): string {
	switch(chr) {
		case '(': return ')';
		case '[': return ']';
		case '{': return '}';
		case ')': return '(';
		case ']': return '[';
		case '}': return '{';
	}
	return chr;
}

function move_matching(chr_kind: string): (...args: any[])=>any {
	return async function(): Promise<void> {
		const editor = vscode.window.activeTextEditor;
		if(editor === undefined) {
			return;
		}
		let new_cursors: vscode.Selection[] = [];
		for(const cursor of editor.selections) {
			const pos = cursor.anchor;
			const line = editor.document.lineAt(pos).text;
			let find_set: string[] = [chr_kind];
			let find_fwd: boolean = true;
			if(line[pos.character] === chr_kind) {
				find_set = [reverse_chr(chr_kind)];
				find_fwd = false;
			}
			let col = pos.character;
			let found = false;
			let line_no = pos.line;
			if(find_fwd) {
				for(; line_no < editor.document.lineCount; line_no += 1, col = 0) {
					const line = editor.document.lineAt(line_no).text;
					for(; col < line.length; col += 1) {
						if(find_set.includes(line[col])) {
							found = true;
							break;
						}
					}
					if(found) {
						break;
					}
				}
			} else {
				for(; col >= 0; col -= 1) {
					if(find_set.includes(line[col])) {
						found = true;
						break;
					}
				}
				for(; line_no >= 0; line_no -= 1) {
					const line = editor.document.lineAt(line_no).text;
					for(let c1 = line.length-1; c1 >= 0; c1 -= 1) {
						if(find_set.includes(line[c1])) {
							col = c1;
							found = true;
							break;
						}
					}
					if(found) {
						break;
					}
				}
			}
			if(found) {
				const new_pos = new vscode.Position(line_no, col);
				new_cursors.push(new vscode.Selection(new_pos, new_pos));
			} else {
				new_cursors.push(cursor);
			}
		}
		editor.selections = new_cursors;
	};
}

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('cursor-util.insert-numbers', insert_numbers));
	context.subscriptions.push(vscode.commands.registerCommand('cursor-util.find-forwards', find_forwards));
	context.subscriptions.push(vscode.commands.registerCommand('cursor-util.find-backwards', find_backwards));
	context.subscriptions.push(vscode.commands.registerCommand('cursor-util.merge-selections', merge_selections));
	context.subscriptions.push(vscode.commands.registerCommand('cursor-util.move-matching-parens', move_matching(')')));
	context.subscriptions.push(vscode.commands.registerCommand('cursor-util.move-matching-braces', move_matching('}')));
	context.subscriptions.push(vscode.commands.registerCommand('cursor-util.move-matching-brackets', move_matching(']')));
}
export function deactivate() {}
