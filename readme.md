
# Better insert numbers

VSCode extension for inserting numbers to a multicursor. There is a couple alternatives
available in terms of providing similar functionality, which I have tried to correct
in this implementation:

- The numbers are inserted in source-line order.
- After insertion a selection is created over the inserted numbers, so it's easy to remove them.
- Supports binary, hexadecimal, octal, decimal.

## How to use:

1. Put cursors or selections in places where you want to insert/replace the numbers.
2. Activate the extension via `ctrl+p` -> search for `Insert Numbers`.
3. Select the radix to use.
4. The format string in the form `<start>:<increment>`, where both are specified in an integer format understood by javascript's `Number.parseInt()` function.

## TODO

- Printf-like format specifiers for better alignment.


