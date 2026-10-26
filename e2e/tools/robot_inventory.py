"""Writes naming-manifest.json: every suite, test, tag, keyword (with argument names) and variable of the Robot suite.

The manifest is the naming contract of the Playwright port. tools/naming-parity-reporter.ts checks the
TypeScript code against it, so a name can't drift while the Robot suite is being ported and retired.

Usage: python3 tools/robot_inventory.py <path to tilavarauspalvelu-robot checkout>
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import robot_parse as rp  # noqa: E402
from robot_flows import FlowBuilder  # noqa: E402

E2E_ROOT = Path(__file__).resolve().parent.parent


def variable_identifier(name: str) -> str:
    """${Expected text} -> Expected_text. Robot treats spaces and underscores in names as the same."""
    return name[2:-1].replace(" ", "_")


def main() -> None:
    robot_repo = Path(sys.argv[1] if len(sys.argv) > 1 else "../../tilavarauspalvelu-robot").resolve()
    suites_root = robot_repo / "TestSuites"
    commit = subprocess.run(
        ["git", "-C", str(robot_repo), "rev-parse", "HEAD"], capture_output=True, text=True, check=False
    ).stdout.strip()

    files = rp.parse_suite(suites_root)
    flows = FlowBuilder(files, suites_root)
    manifest: dict = {
        "source": {"repository": "City-of-Helsinki/tilavarauspalvelu-robot", "commit": commit},
        "suites": [],
        "keywords": [],
        "variables": [],
    }
    for robot in files:
        relative = robot.path.relative_to(suites_root).as_posix()
        if robot.tests:
            first = lambda name: (robot.setting(name) or [[]])[0]  # noqa: E731
            manifest["suites"].append(
                {
                    "file": relative,
                    "name": rp.suite_name(robot.module),
                    "documentation": robot.documentation,
                    "suite_setup": "    ".join(first("Suite Setup")),
                    "test_setup": "    ".join(first("Test Setup")),
                    "test_setup_target": flows.setting_target(robot, "Test Setup"),
                    "test_teardown": "    ".join(first("Test Teardown")),
                    "test_teardown_target": flows.setting_target(robot, "Test Teardown"),
                    "test_tags": first("Test Tags"),
                    "tests": [
                        {
                            "name": test.name,
                            "tags": test.tags,
                            "documentation": test.documentation,
                            "flow": flows.block(robot, test),
                        }
                        for test in robot.tests
                    ],
                }
            )
        for keyword in robot.keywords:
            arguments = []
            for argument in keyword.arguments:
                name, default = rp.argument_spec(argument)
                # The TypeScript parameter: spaces and characters like "-" become "_" (${startTime-hours})
                identifier = re.sub(r"[^\w$]", "_", name[1:].replace(" ", "_"))
                arguments.append({"robot": argument.split("=", 1)[0], "name": identifier, "default": default, "kind": name[0]})
            manifest["keywords"].append(
                {
                    "file": relative,
                    "module": robot.module,
                    "name": keyword.name,
                    "arguments": arguments,
                    "documentation": keyword.documentation,
                    "flow": flows.block(robot, keyword),
                }
            )
        for variable in robot.variables:
            manifest["variables"].append(
                {
                    "file": relative,
                    "module": robot.module,
                    "robot": variable.name,
                    "name": variable_identifier(variable.name),
                    "values": variable.values,
                }
            )

    output = E2E_ROOT / "tools" / "naming-manifest.json"
    output.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    tests = sum(len(suite["tests"]) for suite in manifest["suites"])
    print(
        f"Wrote {output.relative_to(E2E_ROOT)}: {len(manifest['suites'])} suites, {tests} tests, "
        f"{len(manifest['keywords'])} keywords, {len(manifest['variables'])} variables (source {commit[:9]})"
    )


if __name__ == "__main__":
    main()
