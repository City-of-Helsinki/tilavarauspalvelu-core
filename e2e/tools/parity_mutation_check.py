"""Checks that `pnpm parity` and `pnpm lint` still catch deliberate drifts in the generated code.

Copies e2e/ to a temporary directory and applies one mutation at a time to the generated TestSuites/: swapped,
deleted or retargeted steps, changed or removed defaults, docstrings, hooks, tags and variable values, a dropped
await and a stray return. Each must be reported by the check that covers it. Two known blind spots (a negated
condition and a changed selector) are run for information only. The working tree is not touched.

Run it after changing the generator, tools/flow-scan.ts or tools/naming-parity-reporter.ts.

Usage: python3 tools/parity_mutation_check.py
"""

from __future__ import annotations

import os
import re
import shutil
import subprocess
import sys
import tempfile
from collections.abc import Callable
from dataclasses import dataclass
from itertools import pairwise
from pathlib import Path

E2E_ROOT = Path(__file__).resolve().parent.parent
# Secrets (.env) stay out of the copy
IGNORED = shutil.ignore_patterns(
    "node_modules", "test-results", "playwright-report", "blob-report", ".pabot-shared", ".env", ".env.*"
)
PARITY = ["./node_modules/.bin/playwright", "test", "--list", "--reporter", "./tools/naming-parity-reporter.ts"]
LINT = ["./node_modules/.bin/oxlint", "--type-aware", "--type-check"]
SPEC = "TestSuites/Tests_user_desktop_FI.spec.ts"
# A keyword call on its own line in a test body: `      await app_common["User Logs Out"]();`
CALL_LINE = re.compile(r'\n {6}await \w+\["[^"]+"\]\([^\n]*\);')


@dataclass
class Mutation:
    name: str
    check: str | None  # the check that must report it: "parity", "lint", or None for a known blind spot
    apply: Callable[[Path], str]  # edits the copy and returns the edited file


def modules(root: Path) -> list[Path]:
    """The generated keyword modules (not the specs or the hand-written ports)."""
    hand_written = {"env_loader.ts", "python_keywords.ts", "robot_email_test_tool.ts", "create_data.setup.ts"}
    return sorted(
        path
        for path in (root / "TestSuites").rglob("*.ts")
        if not path.name.endswith(".spec.ts") and path.name not in hand_written
    )


def replace_first(path: Path, pattern: str, replacement: Callable[[re.Match[str]], str], flags: int = 0) -> bool:
    text = path.read_text(encoding="utf-8")
    match = re.search(pattern, text, flags)
    if match is None:
        return False
    path.write_text(text[: match.start()] + replacement(match) + text[match.end() :], encoding="utf-8")
    return True


def in_modules(pattern: str, replacement: Callable[[re.Match[str]], str], flags: int = 0) -> Callable[[Path], str]:
    def apply(root: Path) -> str:
        for path in modules(root):
            if replace_first(path, pattern, replacement, flags):
                return path.relative_to(root).as_posix()
        raise LookupError(f"no match for {pattern!r}")

    return apply


def in_spec(edit: Callable[[str], str]) -> Callable[[Path], str]:
    def apply(root: Path) -> str:
        path = root / SPEC
        text = path.read_text(encoding="utf-8")
        edited = edit(text)
        if edited == text:
            raise LookupError(f"no change in {SPEC}")
        path.write_text(edited, encoding="utf-8")
        return SPEC

    return apply


def first_test_calls(text: str) -> list[re.Match[str]]:
    """The keyword call lines of the spec's tests, after the hooks."""
    start = text.index('\n    test("')
    return [match for match in CALL_LINE.finditer(text) if match.start() > start]


def swap_steps(text: str) -> str:
    calls = first_test_calls(text)
    for first, second in pairwise(calls):
        if first.end() == second.start() and first.group() != second.group():
            return text[: first.start()] + second.group() + first.group() + text[second.end() :]
    return text


def delete_step(text: str) -> str:
    call = first_test_calls(text)[1]
    return text[: call.start()] + text[call.end() :]


def drop_await(text: str) -> str:
    call = first_test_calls(text)[0]
    return text[: call.start()] + call.group().replace("await ", "", 1) + text[call.end() :]


def early_return(text: str) -> str:
    call = first_test_calls(text)[0]
    return text[: call.end()] + "\n      return;" + text[call.end() :]


def change_hook(text: str) -> str:
    teardown = re.search(r'test\.afterEach\(async \(\) => \{\n {6}await (\w+\["[^"]+"\])', text)
    assert teardown is not None
    return re.sub(
        r'(test\.beforeEach\(async \(\) => \{\n {6}await )\w+\["[^"]+"\]',
        lambda match: match.group(1) + teardown.group(1),
        text,
        count=1,
    )


def change_tag(text: str) -> str:
    start = text.index('\n    test("')
    return text[:start] + re.sub(r'"@[^"]+"', '"@changed-tag"', text[start:], count=1)


def wrong_variable(root: Path) -> str:
    names = re.findall(
        r"^ {2}(\w+): ", (root / "TestSuites/Resources/variables.ts").read_text(encoding="utf-8"), re.MULTILINE
    )

    def other(match: re.Match[str]) -> str:
        replacement = next(name for name in names if name.lower() != match.group(2).lower())
        return f"{match.group(1)}V.{replacement}"

    return in_modules(r'(await \w+\["[^"]+"\]\([^\n]*?)V\.(\w+)', other)(root)


def change_value(root: Path) -> str:
    file = "TestSuites/Resources/variables.ts"
    if not replace_first(
        root / file, r'^( {2}\w+: )"([^"$\\]+)"', lambda match: f'{match[1]}"{match[2]}x"', re.MULTILINE
    ):
        raise LookupError(f"no literal value in {file}")
    return file


MUTATIONS = [
    Mutation("swap two steps", "parity", in_spec(swap_steps)),
    Mutation("delete a step", "parity", in_spec(delete_step)),
    Mutation("pass a different variable", "parity", wrong_variable),
    Mutation("change a default", "parity", in_modules(r'(\w+: RobotValue = )"([^"]*)"', lambda m: f'{m[1]}"{m[2]}x"')),
    Mutation("remove a default", "parity", in_modules(r'(\w+: RobotValue) = "[^"]*"', lambda m: m[1])),
    Mutation(
        "change a docstring", "parity", in_modules(r"^( {3}\* )(\S)", lambda m: f"{m[1]}NOT {m[2]}", re.MULTILINE)
    ),
    Mutation("change the Test Setup", "parity", in_spec(change_hook)),
    Mutation("change a tag", "parity", in_spec(change_tag)),
    Mutation("change a variable value", "parity", change_value),
    Mutation("drop an await", "lint", in_spec(drop_await)),
    Mutation("insert a stray return", "lint", in_spec(early_return)),
    Mutation("negate a condition", None, in_modules(r"if \(isTruthy\(", lambda _: "if (!isTruthy(")),
    Mutation("change a selector", None, in_modules(r'(Browser\["Click"\]\(")', lambda m: f"{m[1]}x")),
]


def run(command: list[str], cwd: Path) -> tuple[bool, str]:
    """Runs a check; returns whether it passed and the first problem it reported."""
    result = subprocess.run(command, cwd=cwd, capture_output=True, text=True, check=False)
    lines = (result.stdout + result.stderr).splitlines()
    # Parity lists problems and intentional differences as "  - ..."; oxlint prints "file:line:col: error ..."
    problems = [line[4:] for line in lines if line.startswith("  - ")]
    problems = [line for line in problems if not line.startswith(("Hand-written override", "${"))]
    problems += [line.strip() for line in lines if " error " in line]
    return result.returncode == 0, problems[0] if problems else ""


def main() -> None:
    with tempfile.TemporaryDirectory(prefix="parity-mutations-") as temp:
        copy = Path(temp) / "core" / "e2e"
        shutil.copytree(E2E_ROOT, copy, ignore=IGNORED)
        os.symlink(E2E_ROOT / "node_modules", copy / "node_modules")
        frontend = E2E_ROOT.parent / "frontend" / ".oxlintrc.json"
        (copy.parent / "frontend").mkdir()
        shutil.copy(frontend, copy.parent / "frontend" / ".oxlintrc.json")
        pristine = Path(temp) / "TestSuites"
        shutil.copytree(copy / "TestSuites", pristine)

        ok, summary = run(PARITY, copy)
        print(f"Baseline parity: {'OK' if ok else 'FAILED: ' + summary}")
        if not ok:
            sys.exit(1)
        missed = 0
        for mutation in MUTATIONS:
            shutil.rmtree(copy / "TestSuites")
            shutil.copytree(pristine, copy / "TestSuites")
            try:
                file = mutation.apply(copy)
            except LookupError as error:
                print(f"  NO TARGET  {mutation.name}: {error}")
                missed += 1
                continue
            checks = [mutation.check] if mutation.check else ["parity", "lint"]
            results = {check: run(PARITY if check == "parity" else LINT, copy) for check in checks}
            caught = {check: not ok for check, (ok, _) in results.items()}
            if mutation.check is None:
                state = "blind" if not any(caught.values()) else "now seen"
                print(f"  {state:9}  {mutation.name} ({file}): known blind spot, read by hand")
            elif caught[mutation.check]:
                print(f"  caught     {mutation.name} ({file}) by {mutation.check}: {results[mutation.check][1][:160]}")
            else:
                print(f"  MISSED     {mutation.name} ({file}): {mutation.check} passed")
                missed += 1
        print(f"{len(MUTATIONS) - missed} of {len(MUTATIONS)} mutations behaved as expected")
        sys.exit(1 if missed else 0)


if __name__ == "__main__":
    main()
