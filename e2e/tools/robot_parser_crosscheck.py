"""Compares tools/robot_parse.py with Robot Framework's own parser on the whole Robot suite.

The naming manifest and the generator both read the .robot files with robot_parse.py, so a parsing mistake would
be on both sides of the parity check and pass. This checks the parser itself: for every test and keyword it
flattens both parse trees in document order into keyword calls (name, arguments, assignment), VAR, IF/ELSE IF/ELSE
and WHILE conditions, FOR headers, EXCEPT patterns, RETURN, BREAK and CONTINUE, and compares them.

Blank `...` continuation lines are empty arguments to Robot and are dropped by robot_parse.py; that difference is
listed but doesn't fail the check (in this suite it only occurs inside Evaluate JavaScript code).

Needs Robot Framework, at the version the Robot suite pins:
  python3 -m venv "$TMPDIR/rfvenv" && "$TMPDIR/rfvenv/bin/pip" install robotframework==7.3.2
Usage: "$TMPDIR/rfvenv/bin/python" tools/robot_parser_crosscheck.py <path to tilavarauspalvelu-robot checkout>
"""

from __future__ import annotations

import sys
from pathlib import Path

from robot.api.parsing import ModelVisitor, get_model, get_resource_model

sys.path.insert(0, str(Path(__file__).parent))

import robot_parse as rp  # noqa: E402

Record = tuple  # type: ignore[type-arg]


def assignment(values: tuple[str, ...] | list[str]) -> tuple[str, ...]:
    """`${x}=` and `${x} =` are the same assignment."""
    return tuple(value.rstrip("= ").strip() for value in values)


class RobotRecords(ModelVisitor):
    """The records of every test and keyword, from Robot Framework's parse tree."""

    def __init__(self) -> None:
        self.blocks: dict[tuple[str, str], list[Record]] = {}
        self.current: list[Record] = []

    def _block(self, node, kind: str) -> None:  # type: ignore[no-untyped-def]
        self.current = self.blocks[(kind, node.name)] = []
        self.generic_visit(node)

    def visit_TestCase(self, node) -> None:  # type: ignore[no-untyped-def]
        self._block(node, "test")

    def visit_Keyword(self, node) -> None:  # type: ignore[no-untyped-def]
        self._block(node, "keyword")

    def visit_KeywordCall(self, node) -> None:  # type: ignore[no-untyped-def]
        self.current.append(("call", node.keyword, tuple(node.args), assignment(node.assign)))

    def visit_Var(self, node) -> None:  # type: ignore[no-untyped-def]
        options = tuple(token.value for token in node.get_tokens("OPTION"))
        self.current.append(("var", node.name, tuple(node.value) + options))

    def visit_IfHeader(self, node) -> None:  # type: ignore[no-untyped-def]
        self.current.append(("if", node.condition))

    visit_InlineIfHeader = visit_IfHeader
    visit_ElseIfHeader = visit_IfHeader

    def visit_ElseHeader(self, node) -> None:  # type: ignore[no-untyped-def]
        self.current.append(("if", None))

    def visit_WhileHeader(self, node) -> None:  # type: ignore[no-untyped-def]
        options = tuple(token.value for token in node.get_tokens("OPTION"))
        self.current.append(("while", node.condition, options))

    def visit_ForHeader(self, node) -> None:  # type: ignore[no-untyped-def]
        self.current.append(("for", tuple(node.assign), node.flavor, tuple(node.values)))

    def visit_ExceptHeader(self, node) -> None:  # type: ignore[no-untyped-def]
        self.current.append(("except", tuple(node.patterns), node.pattern_type, node.assign))

    def visit_ReturnStatement(self, node) -> None:  # type: ignore[no-untyped-def]
        self.current.append(("return", tuple(node.values)))

    def visit_Break(self, node) -> None:  # type: ignore[no-untyped-def]
        self.current.append(("break",))

    def visit_Continue(self, node) -> None:  # type: ignore[no-untyped-def]
        self.current.append(("continue",))


def records(steps: list[rp.Step]) -> list[Record]:
    """The same records from robot_parse.py's tree."""
    out: list[Record] = []
    for step in steps:
        if step.kind == "call":
            out.append(("call", step.name, tuple(step.args), assignment(step.assign)))
        elif step.kind == "var":
            out.append(("var", step.name, tuple(step.args)))
        elif step.kind in ("if", "while"):
            for condition, body in step.branches:
                out.append(("if", condition) if step.kind == "if" else ("while", condition, tuple(step.values)))
                out.extend(records(body))
        elif step.kind == "for":
            out.append(("for", tuple(step.loop_vars), step.flavor, tuple(step.values)))
            out.extend(records(step.body))
        elif step.kind == "try":
            out.extend(records(step.body))
            for patterns, options, as_var, body in step.excepts:
                pattern_type = next((option.split("=", 1)[1] for option in options if option.startswith("type=")), None)
                out.append(("except", tuple(patterns), pattern_type, as_var))
                out.extend(records(body))
            out.extend(records(step.finally_body))
        elif step.kind == "return":
            out.append(("return", tuple(step.args)))
        elif step.kind in ("break", "continue"):
            out.append((step.kind,))
        elif step.kind not in ("comment", "blank"):
            out.append(("unknown step kind", step.kind))
    return out


def without_empty_arguments(record: Record) -> Record:
    return tuple(tuple(part for part in item if part != "") if isinstance(item, tuple) else item for item in record)


def main() -> None:
    suites = Path(sys.argv[1] if len(sys.argv) > 1 else "../../tilavarauspalvelu-robot").resolve() / "TestSuites"
    compared = differences = 0
    notes: list[str] = []
    for path in sorted(suites.rglob("*.robot")):
        relative = path.relative_to(suites)
        model = (
            get_model(path, data_only=True)
            if path.name.startswith("Tests_")
            else get_resource_model(path, data_only=True)
        )
        robot = RobotRecords()
        robot.visit(model)
        parsed = rp.parse_file(path)
        ours = {("test", test.name): records(test.body) for test in parsed.tests}
        ours.update({("keyword", keyword.name): records(keyword.body) for keyword in parsed.keywords})
        for key in sorted(set(robot.blocks) | set(ours)):
            expected, actual = robot.blocks.get(key), ours.get(key)
            if expected is None or actual is None:
                differences += 1
                print(f"{relative} {key[0]} '{key[1]}': only in {'robot_parse.py' if expected is None else 'Robot'}")
                continue
            compared += len(expected)
            for index in range(max(len(expected), len(actual))):
                want = expected[index] if index < len(expected) else None
                got = actual[index] if index < len(actual) else None
                if want == got:
                    continue
                if (
                    want is not None
                    and got is not None
                    and without_empty_arguments(want) == without_empty_arguments(got)
                ):
                    notes.append(f"{relative} {key[0]} '{key[1]}' record {index + 1}: blank continuation lines dropped")
                    continue
                differences += 1
                print(
                    f"{relative} {key[0]} '{key[1]}' record {index + 1}:\n  Robot:          {want}\n  robot_parse.py: {got}"
                )
                break
    for note in notes:
        print(f"Note: {note}")
    print(f"{compared} records compared, {differences} difference(s)")
    sys.exit(1 if differences else 0)


if __name__ == "__main__":
    main()
