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

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('cursor-util.insert-numbers', insert_numbers));
}
export function deactivate() {}
