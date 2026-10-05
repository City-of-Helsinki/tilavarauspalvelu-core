# Backend code style

> Also read the [backend architecture](./backend-architecture.md).

## General

- Use functions designed for formatting strings instead of hand-rolling them, e.g. `urllib.parse.urlencode` to build query strings.
- Accept what the formatter and linter want. If a formatter rewrites imports or other code, keep the rewrite. Do not revert an autofix for any reason.

## Readability

- Use unabbreviated names for classes, functions, and variables.
- Name a thing for the work it does, so a reader who knows the module can guess the body from the name.
- Check the names already in the module before adding one. Make sure the reader can tell two similar names apart.
- Assign class instances and function return values to variables before passing them as arguments or using them in comparisons.
- Write code that a reader can follow top to bottom without jumping to another function.
  Repeat similar code in each place, rather than moving the shared shape into a helper.
- Extract a helper only for one self-contained job that a reader understands from its name alone
- Never pass callbacks or mode flags into a helper so that it can serve several callers.
  The reader must then trace every caller to know what the helper does.
- Write out each keyword argument by name at every call site, including class constructors, even when the lines repeat.
  Never build a dict with string keys and splat it with `**` to fill the arguments.
  The type checker cannot check splatted keys or values, and the list of key names must be kept in sync by hand.
- Read and write each attribute by its name, even when the lines repeat.
  Never build an attribute name from a string and pass it to `getattr` or `setattr`.
  The type checker cannot check the name or the type of the value, and a rename breaks only at runtime.
  If you truly need to make an exception, stop and ask the user first before implementing it.
- Split long method chains (4+ steps) into multiple lines with intermediate variables or create a helper function.
- Split long comprehensions into multiple lines. Use generator expressions for intermediate results.
- Always wrap implicitly concatenated strings and method chains that span multiple lines in their own parentheses
- Add blank lines between logical blocks of code. Rule of thumb: one blank line after indentation is reduced, no matter by how much.

## Code comments

These rules are strict. They cover every comment you write, including comments in migrations and in tests.

- Never comment what the code clearly says. If a reader gets it from the code in a few seconds, delete the comment.
- Only add one when the code is complex or surprising without context. Say why, not what.
- Comment on the current state of the code, and only on facts you can point at.
- Never write about how the code used to work or what it replaced.
- Never write about what the code might become, unless that really matters, like future proofing work that is going to happen.
- Never claim that something will never happen or never change.
- Never praise or defend the code. Do not explain that a choice is clever, careful, or better than another one.
- Keep a comment to one or two plain sentences. If it needs a paragraph, change the code instead.
- State a thing once. Two copies of one note drift apart, and then one of them is a lie.
- A comment that implies something the code no longer does is worse than no comment at all.
- Never add module docstrings.

Before you call the work done, read every comment you added again and delete the ones these rules do not allow.

## Function structure

- Make all function arguments keyword-only when there are more than 3 of them (excluding self in methods),
  or when any two arguments share the same type. See `Framework exceptions`.
- Do not return tuples. Either split into separate functions called by the parent,
  or return a structured object like a dataclass, NamedTuple or TypedDict.

## Class structure

See `Framework exceptions`. Integration clients and services are classes on purpose.
See `Integrations layer` in the [backend architecture](./backend-architecture.md).

- Prefer functions over classes.
- Prefer dataclasses over plain classes.
- Use composition and dependency injection instead of inheritance and mixins.

## Module structure

- Inside a module, put the module interface (public names) at the top and the private helpers at the bottom.
- Mark where the helpers begin with an `# Internals` banner comment.
- Prefer deep modules: small interface, deep implementation. A few methods with simple params hiding complex logic behind them.
  This is about the public surface of a module. It is not a reason to merge sibling functions into one shared helper.
- Avoid shallow modules: large interface with many methods that just pass through to thin implementation.
  When designing, ask: Can I reduce the number of methods? Can I simplify the parameters? Can I hide more complexity inside?

## Error handling

- Never raise built-in or third-party exceptions manually. Always create a custom exception instead.
  See `Framework exceptions`.
- Never put a caught built-in or third-party exception's message into a custom exception or HTTP response that reaches the client.
  It may expose internal implementation details. Log the full exception server-side then raise or return a fixed, safe message instead.

## Framework exceptions

Django, DRF, and graphene make us deviate from some rules. Deviate only in these cases:

- Subclass a framework class when the framework requires it.
  Examples: models, admins, serializers, nodes, filtersets, permissions, and choice enums.
  These classes do not need to be functions or dataclasses.
- Keep the framework's signature when you override a framework method, e.g. `ModelAdmin.save_model`.
  The framework calls these methods with positional arguments.
- Raise the framework's own exception where the framework expects one.
  Examples: DRF `ValidationError` in serializers and Django `ValidationError` in model or form validation.
