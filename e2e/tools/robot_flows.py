"""The flow of every Robot test and keyword, for the naming manifest.

A flow is the steps of a body in order: each keyword call (resolved to the module that defines it, the way
Robot resolves names) with the variables its arguments use, and each Set Test/Suite Variable. Control
structures (IF, FOR, TRY, ...) contribute their bodies in order. tools/naming-parity-reporter.ts reads the same
steps from the TypeScript and compares them.

Steps that the port writes as plain TypeScript instead of keyword calls (Set Variable, Evaluate,
Get Variable Value, ...) are not part of the flow; their translation is checked by reading the code.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import robot_parse as rp  # noqa: E402
import robot_to_ts as gen  # noqa: E402

# BuiltIn keywords the port writes as plain TypeScript
NOT_CALLS = {"Set Variable", "Set Variable If", "Get Variable Value", "Evaluate", "Run Only Once", "Set Global Variable"}
SET_VARIABLE = {"Set Test Variable", "Set Suite Variable"}
# Keywords whose arguments are JavaScript code: their identifiers are not Robot variables
JAVASCRIPT_KEYWORDS = {"Browser.Evaluate JavaScript", "Browser.Promise To", "Browser.Wait For Response"}
# Constants that the port writes as literals; test-scope built-ins like ${TEST NAME} stay (robot.TEST_NAME)
BUILTIN_NAMES = {"empty", "space", "true", "false", "none", "null", "curdir", "/", "\\n"}


def normalize_variable(name: str) -> str:
    """Robot ignores case, spaces and underscores in names; the port turns "-" into "_" (${startTime-hours})."""
    return re.sub(r"[\s_\-]", "", name).lower()


# A whole variable name, possibly with spaces or hyphens: ${Expected text}, ${startTime-hours} (not ${x-1})
WHOLE_NAME = re.compile(r"^[A-Za-z_][\w ]*(?:-[A-Za-z][\w ]*)*$")


def variables_in(token: str, objects: bool = False) -> list[str]:
    """Robot variables an argument uses: ${name}, @{name}, &{name}, ${a}[${b}], ${x.attr}, and $name in expressions."""
    names: list[str] = []
    index = 0
    while index < len(token):
        if token[index] in "$@&%" and token.startswith("{", index + 1):
            end = gen.matching_brace(token, index + 1)
            inner = token[index + 2 : end]
            if token[index] != "%" and not inner.startswith("{"):
                # Variables inside, e.g. the index in ${cards[${index}]} or ${${name}}
                names.extend(variables_in(inner, objects))
                outer = re.sub(r"\$\{[^{}]*\}", "", inner).strip()
                if WHOLE_NAME.fullmatch(outer):
                    base = outer
                else:  # extended syntax: ${response.status_code}, ${cards[...]}, ${dayIdx + 2}
                    base = re.split(r"[\[\].(+\-*/%<>=!]", outer, maxsplit=1)[0].strip()
                normalized = normalize_variable(base)
                if base and not re.fullmatch(r"-?\d+(\.\d+)?", base) and normalized not in BUILTIN_NAMES and base != "/":
                    names.append(normalized)
            index = end + 1
            continue
        if objects and token[index] == "$" and re.match(r"[A-Za-z_]", token[index + 1 : index + 2]):
            match = re.match(r"\$([A-Za-z_]\w*)", token[index:])
            assert match
            names.append(normalize_variable(match.group(1)))
            index += len(match.group(0))
            continue
        index += 1
    return names


def target_of(expression: str) -> str:
    """`app_common["Name"]` -> `app_common.Name`, `python_keywords.fn` stays."""
    match = re.fullmatch(r'([\w$]+)\["(.+)"\]', expression)
    if match:
        library = "String" if match.group(1) == "String_" else match.group(1)
        return f"{library}.{match.group(2)}"
    return expression


class FlowBuilder:
    def __init__(self, files: list[rp.RobotFile], suites_root: Path):
        self.generator = gen.Generator(files, suites_root)

    def resolve(self, name: str) -> str:
        _kind, function, _info, _params = self.generator.resolve_keyword(name)
        return target_of(function)

    def call(self, name: str, args: list[str]) -> list[dict]:  # type: ignore[type-arg]
        if name in NOT_CALLS:
            return []
        if name in SET_VARIABLE:
            match = re.fullmatch(r"[$@&]\{([^{}]+)\}", args[0])
            return [{"set": normalize_variable(match.group(1)) if match else "*"}]
        if name == "Run Keywords":
            steps: list[dict] = []  # type: ignore[type-arg]
            group: list[str] = []
            for arg in [*args, "AND"]:
                if arg == "AND":
                    steps += self.call(group[0], group[1:])
                    group = []
                else:
                    group.append(arg)
            return steps
        target = self.resolve(name)
        bare = target.split(".", 1)[-1]
        keyword_positions: list[int] = []
        if target.startswith("BuiltIn.") or target.startswith("Browser."):
            if bare in gen.RUN_KEYWORD_FAMILY:
                keyword_positions = [gen.RUN_KEYWORD_FAMILY[bare]]
        if bare in gen.USER_KEYWORD_ARGS and not target.startswith(("BuiltIn.", "Browser.")):
            keyword_positions = gen.USER_KEYWORD_ARGS[bare]
        inner: list[dict] = []  # type: ignore[type-arg]
        variables: list[str] = []
        javascript = target in JAVASCRIPT_KEYWORDS
        for position, arg in enumerate(args):
            if position in keyword_positions and not re.fullmatch(r"\$\{[^{}]+\}", arg):
                reference = self.resolve(arg)
                inner.append({"call": reference, "vars": []})
                javascript = javascript or reference in JAVASCRIPT_KEYWORDS
                continue
            variables += variables_in(arg, objects=bare == "Should Be True")
        step = {"call": target, "vars": None if javascript else sorted(variables)}
        return [step, *inner]

    def steps(self, body: list[rp.Step]) -> list[dict]:  # type: ignore[type-arg]
        flow: list[dict] = []  # type: ignore[type-arg]
        for step in body:
            if step.kind == "call":
                flow += self.call(step.name, step.args)
            elif step.kind == "var":
                scope = next((arg.split("=", 1)[1] for arg in step.args if arg.startswith("scope=")), "")
                if scope.upper() in ("TEST", "SUITE", "GLOBAL"):
                    flow.append({"set": normalize_variable(step.name[2:-1])})
            for _condition, branch in step.branches:
                flow += self.steps(branch)
            flow += self.steps(step.body)
            for exception in step.excepts:
                flow += self.steps(exception[3])
            flow += self.steps(step.finally_body)
        return flow

    def block(self, robot: rp.RobotFile, block: rp.Keyword) -> list[dict]:  # type: ignore[type-arg]
        self.generator.module = robot.module
        self.generator.scope = gen.Scope()
        return self.steps(block.body)

    def setting_target(self, robot: rp.RobotFile, setting: str) -> str | None:
        value = (robot.setting(setting) or [[]])[0]
        if not value:
            return None
        self.generator.module = robot.module
        steps = self.call(value[0], value[1:])
        return steps[0]["call"] if steps else None
