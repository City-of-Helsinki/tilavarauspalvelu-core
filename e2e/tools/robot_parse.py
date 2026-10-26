"""Parser for the subset of Robot Framework syntax used by the Varaamo Robot suite.

Shared by robot_inventory.py (naming manifest) and robot_to_ts.py (TypeScript generator).
Uses only the standard library, so it runs without Robot Framework installed.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path

SEPARATOR = re.compile(r" {2,}|\t+")
CONTROL_WORDS = {"IF", "ELSE IF", "ELSE", "END", "FOR", "WHILE", "TRY", "EXCEPT", "FINALLY", "BREAK", "CONTINUE", "RETURN", "VAR"}
ASSIGN = re.compile(r"^[$@&]\{[^}]+\}\s*=?$")


@dataclass
class Row:
    """One logical row: tokens after joining `...` continuation lines."""

    indent: bool
    tokens: list[str]
    comment: str | None
    line: int
    # Comment at the end of a physical line, by the index of that line's last token
    token_comments: dict[int, str] = field(default_factory=dict)


@dataclass
class Step:
    kind: str  # call, if, for, while, try, break, continue, return, var, comment, blank
    line: int
    assign: list[str] = field(default_factory=list)
    name: str = ""
    args: list[str] = field(default_factory=list)
    comment: str | None = None
    # Comments of continuation lines, by argument index
    arg_comments: dict[int, str] = field(default_factory=dict)
    # if: branches = [(condition or None, body)]
    branches: list[tuple[str | None, list["Step"]]] = field(default_factory=list)
    # for: loop variables, flavor ("IN" / "IN RANGE"), values, body
    loop_vars: list[str] = field(default_factory=list)
    flavor: str = ""
    values: list[str] = field(default_factory=list)
    body: list["Step"] = field(default_factory=list)
    # try: excepts = [(patterns, options, as_var, body)], finally body
    excepts: list[tuple[list[str], list[str], str | None, list["Step"]]] = field(default_factory=list)
    finally_body: list["Step"] = field(default_factory=list)


@dataclass
class Keyword:
    name: str
    line: int
    documentation: str = ""
    arguments: list[str] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)
    timeout: str | None = None
    body: list[Step] = field(default_factory=list)
    leading_comments: list[str] = field(default_factory=list)


@dataclass
class Variable:
    name: str  # as written, e.g. ${URL_TEST} or @{LIST}
    values: list[str]
    line: int
    comment: str | None = None


@dataclass
class RobotFile:
    path: Path
    module: str
    settings: list[Row] = field(default_factory=list)
    variables: list[Variable] = field(default_factory=list)
    keywords: list[Keyword] = field(default_factory=list)
    tests: list[Keyword] = field(default_factory=list)

    def setting(self, name: str) -> list[list[str]]:
        return [row.tokens[1:] for row in self.settings if row.tokens and row.tokens[0].lower() == name.lower()]

    @property
    def documentation(self) -> str:
        docs = self.setting("Documentation")
        return join_documentation(docs[0]) if docs else ""

    @property
    def resources(self) -> list[str]:
        return [tokens[0] for tokens in self.setting("Resource")]

    @property
    def libraries(self) -> list[str]:
        return [tokens[0] for tokens in self.setting("Library")]

    @property
    def variable_files(self) -> list[str]:
        return [tokens[0] for tokens in self.setting("Variables")]


def split_tokens(text: str) -> tuple[list[str], str | None]:
    """Splits a data line into tokens and a trailing comment."""
    tokens = [token for token in SEPARATOR.split(text.strip()) if token != ""]
    comment = None
    for index, token in enumerate(tokens):
        if token.startswith("#"):
            comment = "  ".join(tokens[index:])
            tokens = tokens[:index]
            break
    return tokens, comment


def read_rows(lines: list[tuple[int, str]]) -> list[Row]:
    """Joins `...` continuation lines into logical rows. Comment-only lines become rows without tokens."""
    rows: list[Row] = []
    for number, raw in lines:
        if not raw.strip():
            rows.append(Row(indent=False, tokens=[], comment=None, line=number))
            continue
        indent = raw[0] in " \t"
        tokens, comment = split_tokens(raw)
        if tokens and tokens[0] == "...":
            # Continuation of the previous data row (skipping blank and comment-only rows)
            for previous in reversed(rows):
                if previous.tokens:
                    previous.tokens.extend(tokens[1:])
                    if comment:
                        previous.comment = f"{previous.comment}  {comment}" if previous.comment else comment
                        if len(tokens) > 1:
                            previous.token_comments[len(previous.tokens) - 1] = comment
                    break
            continue
        row = Row(indent=indent, tokens=tokens, comment=comment, line=number)
        if comment and tokens:
            row.token_comments[len(tokens) - 1] = comment
        rows.append(row)
    return rows


def join_documentation(parts: list[str]) -> str:
    """Joins documentation tokens the way Robot does: continuation rows become new lines."""
    return "\n".join(parts).replace("\\n", "\n")


def parse_file(path: Path) -> RobotFile:
    module = path.stem
    robot = RobotFile(path=path, module=module)
    sections: dict[str, list[tuple[int, str]]] = {}
    current = None
    for number, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if raw.startswith("***"):
            current = raw.strip("* \n").lower()
            sections.setdefault(current, [])
            continue
        if current is not None:
            sections[current].append((number, raw))
    robot.settings = [row for row in read_rows(sections.get("settings", [])) if row.tokens]
    for row in read_rows(sections.get("variables", [])):
        if row.tokens:
            robot.variables.append(Variable(name=row.tokens[0], values=row.tokens[1:], line=row.line, comment=row.comment))
    robot.keywords = parse_blocks(read_rows(sections.get("keywords", [])))
    robot.tests = parse_blocks(read_rows(sections.get("test cases", [])))
    return robot


def parse_blocks(rows: list[Row]) -> list[Keyword]:
    blocks: list[Keyword] = []
    pending_comments: list[str] = []
    body_rows: list[Row] = []
    for row in rows:
        if not row.indent and row.tokens:
            if blocks:
                blocks[-1].body = parse_body(body_rows)
            blocks.append(Keyword(name=row.tokens[0], line=row.line, leading_comments=pending_comments))
            pending_comments = []
            body_rows = []
            if len(row.tokens) > 1:
                body_rows.append(Row(indent=True, tokens=row.tokens[1:], comment=row.comment, line=row.line))
            continue
        if not blocks:
            if row.comment:
                pending_comments.append(row.comment)
            continue
        current = blocks[-1]
        if row.tokens and row.tokens[0].startswith("[") and row.tokens[0].endswith("]"):
            setting = row.tokens[0][1:-1].lower()
            values = row.tokens[1:]
            if setting == "documentation":
                current.documentation = join_documentation(values)
            elif setting == "arguments":
                current.arguments = values
            elif setting == "tags":
                current.tags = values
            elif setting == "timeout":
                current.timeout = values[0] if values else None
            else:
                raise ValueError(f"Unsupported setting [{setting}] at line {row.line}")
            continue
        body_rows.append(row)
    if blocks:
        blocks[-1].body = parse_body(body_rows)
    for block in blocks:
        trim_blank_edges(block.body)
    return blocks


def trim_blank_edges(body: list[Step]) -> None:
    while body and body[0].kind == "blank":
        body.pop(0)
    while body and body[-1].kind == "blank":
        body.pop()


def parse_body(rows: list[Row]) -> list[Step]:
    steps, index = _parse_until(rows, 0, set())
    if index != len(rows):
        raise ValueError(f"Unexpected {rows[index].tokens} at line {rows[index].line}")
    return steps


def _parse_until(rows: list[Row], index: int, stop: set[str]) -> tuple[list[Step], int]:
    steps: list[Step] = []
    while index < len(rows):
        row = rows[index]
        tokens = row.tokens
        if not tokens:
            if row.comment:
                steps.append(Step(kind="comment", line=row.line, comment=row.comment))
            else:
                steps.append(Step(kind="blank", line=row.line))
            index += 1
            continue
        head = tokens[0]
        if head in stop:
            return steps, index
        if head == "IF" and len(tokens) > 2:
            steps.append(parse_inline_if(row))
            index += 1
        elif head == "IF":
            step, index = parse_if(rows, index)
            steps.append(step)
        elif head == "FOR":
            step, index = parse_for(rows, index)
            steps.append(step)
        elif head == "WHILE":
            body, end = _parse_until(rows, index + 1, {"END"})
            steps.append(Step(kind="while", line=row.line, branches=[(tokens[1], body)], values=tokens[2:], comment=row.comment))
            index = end + 1
        elif head == "TRY":
            step, index = parse_try(rows, index)
            steps.append(step)
        elif head in ("BREAK", "CONTINUE"):
            steps.append(Step(kind=head.lower(), line=row.line, comment=row.comment))
            index += 1
        elif head == "RETURN":
            steps.append(Step(kind="return", line=row.line, args=tokens[1:], comment=row.comment))
            index += 1
        elif head == "VAR":
            arg_comments = {index - 2: text for index, text in row.token_comments.items() if index >= 2}
            steps.append(
                Step(kind="var", line=row.line, name=tokens[1], args=tokens[2:], comment=row.comment, arg_comments=arg_comments)
            )
            index += 1
        else:
            steps.append(parse_call(row))
            index += 1
    return steps, index


def parse_call(row: Row) -> Step:
    tokens = list(row.tokens)
    assign: list[str] = []
    while tokens and ASSIGN.match(tokens[0]):
        assign.append(tokens.pop(0).rstrip("=").strip())
    if not tokens:
        raise ValueError(f"Assignment without keyword at line {row.line}")
    return Step(kind="call", line=row.line, assign=assign, name=tokens[0], args=tokens[1:], comment=row.comment)


def parse_inline_if(row: Row) -> Step:
    """IF    condition    Keyword    args    [ELSE IF    cond    Keyword ...]    [ELSE    Keyword ...]"""
    tokens = row.tokens[1:]
    branches: list[tuple[str | None, list[Step]]] = []
    condition: str | None = tokens.pop(0)
    current: list[str] = []

    def branch_step(branch_tokens: list[str]) -> Step:
        head = branch_tokens[0]
        if head in ("BREAK", "CONTINUE"):
            return Step(kind=head.lower(), line=row.line)
        if head == "RETURN":
            return Step(kind="return", line=row.line, args=branch_tokens[1:])
        return parse_call(Row(True, branch_tokens, None, row.line))

    while tokens:
        token = tokens.pop(0)
        if token in ("ELSE IF", "ELSE"):
            branches.append((condition, [branch_step(current)]))
            current = []
            condition = tokens.pop(0) if token == "ELSE IF" else None
            continue
        current.append(token)
    branches.append((condition, [branch_step(current)]))
    return Step(kind="if", line=row.line, branches=branches, comment=row.comment)


def parse_if(rows: list[Row], index: int) -> tuple[Step, int]:
    row = rows[index]
    branches: list[tuple[str | None, list[Step]]] = []
    condition: str | None = row.tokens[1]
    index += 1
    while True:
        body, index = _parse_until(rows, index, {"ELSE IF", "ELSE", "END"})
        branches.append((condition, body))
        head = rows[index].tokens[0]
        if head == "END":
            return Step(kind="if", line=row.line, branches=branches, comment=row.comment), index + 1
        condition = rows[index].tokens[1] if head == "ELSE IF" else None
        index += 1


def parse_for(rows: list[Row], index: int) -> tuple[Step, int]:
    row = rows[index]
    tokens = row.tokens[1:]
    loop_vars: list[str] = []
    while tokens and not tokens[0].startswith("IN"):
        loop_vars.append(tokens.pop(0))
    flavor = tokens.pop(0)
    body, end = _parse_until(rows, index + 1, {"END"})
    return Step(kind="for", line=row.line, loop_vars=loop_vars, flavor=flavor, values=tokens, body=body, comment=row.comment), end + 1


def parse_try(rows: list[Row], index: int) -> tuple[Step, int]:
    row = rows[index]
    step = Step(kind="try", line=row.line, comment=row.comment)
    body, index = _parse_until(rows, index + 1, {"EXCEPT", "FINALLY", "END"})
    step.body = body
    while rows[index].tokens[0] == "EXCEPT":
        tokens = rows[index].tokens[1:]
        as_var = None
        patterns: list[str] = []
        options: list[str] = []
        while tokens:
            token = tokens.pop(0)
            if token == "AS":
                as_var = tokens.pop(0)
            elif "=" in token and token.split("=", 1)[0] == "type":
                options.append(token)
            else:
                patterns.append(token)
        except_body, index = _parse_until(rows, index + 1, {"EXCEPT", "FINALLY", "END"})
        step.excepts.append((patterns, options, as_var, except_body))
    if rows[index].tokens[0] == "FINALLY":
        step.finally_body, index = _parse_until(rows, index + 1, {"END"})
    if rows[index].tokens[0] != "END":
        raise ValueError(f"TRY without END at line {row.line}")
    return step, index + 1


def parse_suite(root: Path) -> list[RobotFile]:
    return [parse_file(path) for path in sorted(root.rglob("*.robot"))]


def normalize(name: str) -> str:
    """Robot's name matching: case, space and underscore insensitive."""
    return re.sub(r"[\s_]", "", name).lower()


def suite_name(module: str) -> str:
    """The suite name Robot derives from a file name: underscores to spaces, capitalized only if all lowercase."""
    name = module.replace("_", " ").strip()
    return name.title() if name.islower() else name[0].upper() + name[1:]


def argument_spec(argument: str) -> tuple[str, str | None]:
    """Splits `${name}=default` into the identifier and the default value (None when there is none)."""
    match = re.match(r"^([$@&])\{([^}]+)\}(?:=(.*))?$", argument)
    if not match:
        raise ValueError(f"Bad argument {argument}")
    return match.group(1) + match.group(2), match.group(3)
