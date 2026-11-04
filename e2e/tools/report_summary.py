"""Summarizes a Playwright HTML report as text or Markdown: the run's totals, warnings, and each failed or flaky test
with its error, the keyword path to the failing step, the attachments and the backend errors of each attempt
(lib/backend-errors.ts).

The HTML report keeps its data as a zip of JSON files inside index.html (`<template id="playwrightReportBase64">`).
This reads it with the standard library, so a report downloaded from CI can be read without a browser.

Usage: python3 tools/report_summary.py [playwright-report dir or index.html] [--all] [--markdown] [--extract DIR]
  --all          also list the tests that passed
  --markdown     print Markdown, for the job summary of a GitHub Actions run
  --extract DIR  write the report's JSON files to DIR, for reading further
"""

from __future__ import annotations

import base64
import io
import json
import re
import sys
import zipfile
from collections import Counter
from datetime import datetime, timezone
from html import escape
from pathlib import Path

ANSI = re.compile(r"\x1b\[[0-9;]*m")
# The labels of an assertion's values: "Expected:", "Received:", "Expected pattern:", "Received string:" and so on
ASSERTION_VALUE = re.compile(r"(Expected|Received)( [a-z]+)*:")
BACKEND_ERROR = "backend error"
# Failed tests first, then flaky, skipped and passed ones
ORDER = {"unexpected": 0, "flaky": 1, "skipped": 2, "expected": 3}
ICONS = {"unexpected": "❌", "flaky": "⚠️", "skipped": "⏭️", "expected": "✅"}
HEADINGS = {
    "unexpected": "Failed tests",
    "flaky": "Flaky tests",
    "skipped": "Skipped tests",
    "expected": "Passed tests",
}


def load(report: Path) -> dict[str, dict]:  # type: ignore[type-arg]
    html = (report / "index.html" if report.is_dir() else report).read_text(encoding="utf-8")
    match = re.search(r'id="playwrightReportBase64"[^>]*>\s*data:[^,]*base64,([^<]+)<', html)
    if match is None:
        raise SystemExit(f"No embedded report data in {report}")
    archive = zipfile.ZipFile(io.BytesIO(base64.b64decode(match.group(1))))
    return {name: json.loads(archive.read(name)) for name in archive.namelist()}


def failing_path(steps: list[dict], trail: list[str]) -> list[str]:  # type: ignore[type-arg]
    """The titles from the top step down to the innermost step that has the error."""
    for step in steps or []:
        if step.get("error"):
            return failing_path(step.get("steps", []), [*trail, step["title"]])
    return trail


def first_line(text: str | None) -> str:
    lines = [line for line in ANSI.sub("", text or "").splitlines() if line.strip()]
    return lines[0].strip() if lines else ""


def error_lines(text: str | None) -> list[str]:
    """The first line of an error, and the lines with the values of Playwright's assertions."""
    lines = [line.strip() for line in ANSI.sub("", text or "").splitlines() if line.strip()]
    return lines[:1] + [line for line in lines[1:] if ASSERTION_VALUE.match(line)]


def code(text: str) -> str:
    """Markdown inline code, which shows the text as it is."""
    fence = "`" * (max((len(run) for run in re.findall(r"`+", text)), default=0) + 1)
    pad = " " if text.startswith("`") or text.endswith("`") else ""
    return f"{fence}{pad}{text}{pad}{fence}"


def started(summary: dict) -> str:  # type: ignore[type-arg]
    start = datetime.fromtimestamp(summary.get("startTime", 0) / 1000, tz=timezone.utc)
    return start.astimezone().strftime("%Y-%m-%d %H:%M")


def warnings_of(tests: list[dict]) -> Counter[str]:  # type: ignore[type-arg]
    warnings: Counter[str] = Counter()
    for test in tests:
        for annotation in test.get("annotations", []):
            if annotation.get("type") == "warning":
                warnings[annotation.get("description", "")] += 1
    return warnings


def backend_attempts(tests: list[dict]) -> list[tuple[dict, dict]]:  # type: ignore[type-arg]
    return [
        (test, result)
        for test in tests
        for result in test["results"]
        if any(annotation.get("type") == BACKEND_ERROR for annotation in result.get("annotations", []))
    ]


def listed_tests(tests: list[dict], show_all: bool) -> list[dict]:  # type: ignore[type-arg]
    order = sorted(tests, key=lambda test: (ORDER.get(test["outcome"], 9), test["projectName"], test["title"]))
    return [test for test in order if show_all or test["outcome"] != "expected"]


def attachments(report: Path, result: dict) -> list[tuple[str, str]]:  # type: ignore[type-arg]
    folder = report if report.is_dir() else report.parent
    return [(item["name"], f"{folder}/{item['path']}") for item in result.get("attachments", []) if item.get("path")]


def print_text(report: Path, summary: dict, tests: list[dict], show_all: bool) -> None:  # type: ignore[type-arg]
    stats = summary["stats"]
    print(
        f"Run {started(summary)}, {summary.get('duration', 0) / 60_000:.0f} min: {stats['total']} tests, "
        f"{stats['expected']} passed, {stats['unexpected']} failed, {stats['flaky']} flaky, {stats['skipped']} skipped"
    )
    # The run's errors are texts, unlike the errors of a test's results
    for error in summary.get("errors", []):
        print(f"Run error: {first_line(error)}")
    for text, count in warnings_of(tests).most_common():
        print(f"Warning ({count}x): {text}")
    backend = backend_attempts(tests)
    if backend:
        in_passed = sum(1 for test, _ in backend if test["outcome"] == "expected")
        print(
            f"Backend errors in {len(backend)} attempts, listed under each test"
            + (f" ({in_passed} in tests that passed: --all lists them)" if in_passed and not show_all else "")
        )

    for test in listed_tests(tests, show_all):
        location = test.get("location", {})
        file = location.get("file", "").split("/e2e/")[-1]
        print(f"\n[{test['projectName']}] {test['title']}: {test['outcome']} ({file}:{location.get('line')})")
        for result in test["results"]:
            print(f"  attempt {result.get('retry', 0) + 1}: {result['status']}, {result['duration'] / 1000:.0f} s")
            for error in result.get("errors", []):
                print(f"    error: {first_line(error.get('message'))}")
                where = error.get("location")
                if where:
                    print(f"    at: {where.get('file', '').split('/e2e/')[-1]}:{where.get('line')}")
            path = failing_path(result.get("steps", []), [])
            if path:
                print("    failing step: " + "\n      > ".join(path))
            for name, path in attachments(report, result):
                print(f"    {name}: {path}")
            for annotation in result.get("annotations", []):
                if annotation.get("type") == BACKEND_ERROR:
                    print(f"    backend: {annotation.get('description', '')}")


def print_markdown(report: Path, summary: dict, tests: list[dict], show_all: bool) -> None:  # type: ignore[type-arg]
    stats = summary["stats"]
    # A skipped test fails the run too (lib/skips-fail-run-reporter.ts)
    passed = stats["unexpected"] == 0 and stats["skipped"] == 0 and not summary.get("errors")
    print(f"### {'✅' if passed else '❌'} Run {started(summary)}, {summary.get('duration', 0) / 60_000:.0f} min\n")
    print("| Project | ✅ Passed | ❌ Failed | ⚠️ Flaky | ⏭️ Skipped |")
    print("| --- | ---: | ---: | ---: | ---: |")
    projects: dict[str, Counter[str]] = {}
    for test in tests:
        projects.setdefault(test["projectName"], Counter())[test["outcome"]] += 1
    rows = sorted(projects.items(), key=lambda item: item[0].lower())
    if len(rows) > 1:
        totals = Counter({outcome: stats[outcome] for outcome in ("expected", "unexpected", "flaky", "skipped")})
        rows.append(("**Total**", totals))
    for name, counts in rows:
        print(f"| {name} | {counts['expected']} | {counts['unexpected']} | {counts['flaky']} | {counts['skipped']} |")
    for error in summary.get("errors", []):
        print(f"\n**Run error:** {code(first_line(error))}")
    warnings = warnings_of(tests)
    if warnings:
        print("\n**Warnings**\n")
        for text, count in warnings.most_common():
            print(f"- {count}× {code(text)}")
    backend = backend_attempts(tests)
    if backend:
        in_passed = sum(1 for test, _ in backend if test["outcome"] == "expected")
        print(
            f"\nBackend errors in {len(backend)} attempt{'' if len(backend) == 1 else 's'}"
            + (
                f" ({in_passed} in tests that passed, which the HTML report shows)"
                if in_passed and not show_all
                else ""
            )
        )

    outcome = None
    for test in listed_tests(tests, show_all):
        if test["outcome"] != outcome:
            outcome = test["outcome"]
            print(f"\n#### {HEADINGS.get(outcome, outcome)}")
        print_test_markdown(report, test)
    # Another report's summary may follow
    print()


def print_test_markdown(report: Path, test: dict) -> None:  # type: ignore[type-arg]
    """A test as a collapsed block, with its first error in the line that is shown."""
    location = test.get("location", {})
    errors = [error for result in test["results"] for error in result.get("errors", [])]
    title = f"{ICONS.get(test['outcome'], '')} <b>[{escape(test['projectName'])}]</b> {escape(test['title'])}"
    if errors:
        title += f": {escape(first_line(errors[0].get('message')))}"
    print(f"\n<details><summary>{title}</summary>\n")
    print(code(f"{location.get('file', '').split('/e2e/')[-1]}:{location.get('line')}"))
    for result in test["results"]:
        attempt = f"Attempt {result.get('retry', 0) + 1}: {result['status']}, {result['duration'] / 1000:.0f} s"
        print(f"\n**{attempt}**\n")
        for error in result.get("errors", []):
            print("- " + " · ".join(code(line) for line in error_lines(error.get("message"))))
        path = failing_path(result.get("steps", []), [])
        if path:
            print("- Failing step:")
            for depth, step_title in enumerate(path, start=1):
                print("  " * depth + "- " + code(step_title))
        files = attachments(report, result)
        if files:
            print("- " + " · ".join(f"{name} {code(path)}" for name, path in files))
        for annotation in result.get("annotations", []):
            if annotation.get("type") == BACKEND_ERROR:
                print(f"- Backend: {code(annotation.get('description', ''))}")
    print("\n</details>")


def main() -> None:
    args = sys.argv[1:]
    show_all = "--all" in args
    markdown = "--markdown" in args
    extract = args[args.index("--extract") + 1] if "--extract" in args else None
    positional = [arg for index, arg in enumerate(args) if not arg.startswith("--") and args[index - 1] != "--extract"]
    report = Path(positional[0] if positional else "playwright-report")
    files = load(report)
    if extract:
        target = Path(extract)
        target.mkdir(parents=True, exist_ok=True)
        for name, content in files.items():
            (target / name).write_text(json.dumps(content, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"Wrote {len(files)} JSON files to {target}", file=sys.stderr)

    summary = files["report.json"]
    tests = [test for name, content in files.items() if name != "report.json" for test in content["tests"]]
    (print_markdown if markdown else print_text)(report, summary, tests, show_all)


if __name__ == "__main__":
    main()
