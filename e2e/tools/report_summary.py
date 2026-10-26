"""Summarizes a Playwright HTML report as text: the run's totals, warnings, and each failed or flaky test with
its error, the keyword path to the failing step and the attachments.

The HTML report keeps its data as a zip of JSON files inside index.html (`<template id="playwrightReportBase64">`).
This reads it with the standard library, so a report downloaded from CI can be read without a browser.

Usage: python3 tools/report_summary.py [playwright-report dir or index.html] [--all] [--extract DIR]
  --all          also list the tests that passed
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
from pathlib import Path

ANSI = re.compile(r"\x1b\[[0-9;]*m")


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


def main() -> None:
    args = sys.argv[1:]
    show_all = "--all" in args
    extract = args[args.index("--extract") + 1] if "--extract" in args else None
    positional = [arg for index, arg in enumerate(args) if not arg.startswith("--") and args[index - 1] != "--extract"]
    report = Path(positional[0] if positional else "playwright-report")
    files = load(report)
    if extract:
        target = Path(extract)
        target.mkdir(parents=True, exist_ok=True)
        for name, content in files.items():
            (target / name).write_text(json.dumps(content, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"Wrote {len(files)} JSON files to {target}")

    summary = files["report.json"]
    stats = summary["stats"]
    started = (
        datetime.fromtimestamp(summary.get("startTime", 0) / 1000, tz=timezone.utc)
        .astimezone()
        .strftime("%Y-%m-%d %H:%M")
    )
    print(
        f"Run {started}, {summary.get('duration', 0) / 60_000:.0f} min: {stats['total']} tests, {stats['expected']} passed, "
        f"{stats['unexpected']} failed, {stats['flaky']} flaky, {stats['skipped']} skipped"
    )
    for error in summary.get("errors", []):
        print(f"Run error: {first_line(error.get('message'))}")

    warnings: Counter[str] = Counter()
    tests = [test for name, content in files.items() if name != "report.json" for test in content["tests"]]
    for test in tests:
        for annotation in test.get("annotations", []):
            if annotation.get("type") == "warning":
                warnings[annotation.get("description", "")] += 1
    for text, count in warnings.most_common():
        print(f"Warning ({count}x): {text}")

    order = {"unexpected": 0, "flaky": 1, "skipped": 2, "expected": 3}
    for test in sorted(tests, key=lambda test: (order.get(test["outcome"], 9), test["projectName"], test["title"])):
        if test["outcome"] == "expected" and not show_all:
            continue
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
            for attachment in result.get("attachments", []):
                if attachment.get("path"):
                    print(
                        f"    {attachment['name']}: {report if report.is_dir() else report.parent}/{attachment['path']}"
                    )


if __name__ == "__main__":
    main()
