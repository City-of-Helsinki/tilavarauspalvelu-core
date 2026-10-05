# Backend testing

## General rules

Tests verify behavior through public interfaces, not implementation details.
A good test survives when the code underneath changes and breaks when the user behavior changes.

Prefer integration-style tests that exercise real code paths through _public interfaces only_.
A test describes _what_ the system does, not _how_ it does it. If you cannot test an internal detail
through the public interface, simplify instead of testing internals.

Never widen a module's public interface to make it testable.
Do not drop the leading underscore from a name and do not add a new entry point, just so a test can reach it.
Reach the behavior through the public interface that already exists, or change the design until the behavior has one.

## Assertions

Don't assert with a partial substring check when the value's structure or order matters.
A substring match still passes if parts are reordered, duplicated, or a neighboring field is broken.

Prefer exact equality. When part of the value is non-deterministic,
assert the deterministic parts exactly and use an anchored regex
(`re.fullmatch`) for the whole string, with a narrow wildcard only
where the value is genuinely unpredictable.

Note: `pytest.raises(..., match=...)` does an unanchored regex *search*,
so it silently accepts a partial match of the raised exception message.
Use `tests/helpers.py::exact()` to pin the full message. Only fall back
to a partial or unescaped regex when the message genuinely contains a
non-deterministic part.

## Structure

Follow [backend code style](./backend-code-style.md).

Use a `# ── Section name ──` comment to group related tests, and one for
the helpers block at the top of the file. Group new tests with the
existing tests that exercise the same behavior, don't just append at the
end of the file.

The section comment and the test name carry the description.
Rename the test if it does not say what it checks.
Do not add comments inside a test body, unless the code is complex enough to need one.
The comment rules in [backend code style](./backend-code-style.md) apply to tests too.

Before adding a test, check whether an existing test already covers the
same behavior. Remove or merge true duplicates.

## Settings

Use the `settings` fixture to override settings for a test.

## Database

Store tests run against a real Postgres. Assume the database is running first,
and only start it with `just services` if you get database connection related
errors during testing.

Read a row back before asserting on it. A factory keeps the values it was seeded with,
so it cannot show what the code under test changed.

## Mocking

Mock at system boundaries only: external APIs, time, randomness, file system or databases
when a real instance isn't practical. Never mock internal implementation details.
If something is hard to test without mocking internals, redesign the interface.
