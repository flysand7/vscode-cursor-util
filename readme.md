
# Bumbread's Cursor Util extension

This extension adds new ways to (ab)use multicursors in vscode. It includes some
known commands of this nature like inserting consecutive numbers at multicursor,
as well as some vim commands like matching the next character or moving to matching
paren/brace/bracket.

Below I will try to demonstrate how this works using simple text files and known
usecases. The `█` (unicode block symbol) will represent the cursors in this case.

One of the common pattern this package utilizes is "transform into selection".
From a selection it's easy to go forward or backwards to the start or the end
of the selection.

## cursor-util.insert-numbers

This command inserts numbers into each of the multicursor. Some of its features:

- The numbers are inserted in source-line order.
- After insertion a selection is created over the inserted numbers, so it's easy to remove them.
- Supports binary, hexadecimal, octal, decimal.

Example of usage:

```
enum Entity_Kind {
    Procedure = █,
    Function = █,
    Variable = █,
    Constant = █,
    Package = █,
}
```

After executing this command and executing this command (selecting all the default
options) will yield the following:

```
enum Entity_Kind {
    Procedure = 0,
    Function = 1,
    Variable = 2,
    Constant = 3,
    Package = 4,
}
```

And each cursor will change to a selection of the inserted number.

### How to use:

1. Put cursors or selections in places where you want to insert/replace the numbers.
2. Activate the extension via `ctrl+p` -> search for `Insert Numbers`.
3. Select the radix to use.
4. The format string in the form `<start>:<increment>`, where both are specified in an integer format understood by javascript's `Number.parseInt()` function.


## cursor-util.merge-selections

Will merge multiple cursor into one big selection. Useful for exiting the
multicursor mode with the easy ability to proceed to the position of the first
or the last cursor.

## cursor-util.find-forwards, cursor-util.find-backwards

Finds the next specified instance of a character on the current line for each cursor
and moves the cursor to that position.

```
TB_API TB_JIT* █tb_jit_begin(TB_Module* m, size_t jit_heap_capacity);
TB_API void* █tb_jit_place_function(TB_JIT* jit, TB_Function* f);
TB_API void* █tb_jit_place_global(TB_JIT* jit, TB_Global* g);
TB_API void █tb_jit_end(TB_JIT* jit);
```

Executing find-forwards and selecting the capital "J" character will move every
multicursor to the beginning of the word `JIT`. That means that the first of the
cursors will be destroyed, the other three will reach that word. Here's a usage
example:

```
TB_API TB_JIT* tb_jit_begin(TB_Module* m, size_t jit_heap_capacity);
TB_API void* tb_jit_place_function(TB_█IT* jit, TB_Function* f);
TB_API void* tb_jit_place_global(TB_█IT* jit, TB_Global* g);
TB_API void tb_jit_end(TB_█IT* jit);
```

We can add `const` to each of these values by pressing `ctrl+right` and then
adding it:

```
TB_API TB_JIT* tb_jit_begin(TB_Module* m, size_t jit_heap_capacity);
TB_API void* tb_jit_place_function(TB_JIT const█* jit, TB_Function* f);
TB_API void* tb_jit_place_global(TB_JIT const█* jit, TB_Global* g);
TB_API void tb_jit_end(TB_JIT const█* jit);
```

## cursor-util.move-matching-braces/brackets/parens

Moves each cursor between the matching "[]", "{}" or "()" characters. If the character
at the position of the cursor is not either of those characters, moves to the
closing brace/bracket/paren.

## TODO

- Printf-like format specifiers for better alignment.


