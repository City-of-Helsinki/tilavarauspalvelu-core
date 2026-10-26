"""Generates the TypeScript port of the Robot suite: one .ts module per resource file and one .spec.ts per suite.

Keyword, test, argument and variable names are kept exactly. Python expressions in Evaluate, IF and
Should Be True are translated by a small converter; the ones it can't handle are listed in
python_expressions.py and translated by hand there. Running this again regenerates the files, so hand edits
belong in the generator inputs (overrides), not in the output.

Usage: python3 tools/robot_to_ts.py <path to tilavarauspalvelu-robot checkout>
"""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import python_expressions as pyx  # noqa: E402
import robot_parse as rp  # noqa: E402

E2E_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_ROOT = E2E_ROOT / "TestSuites"
OVERRIDES_ROOT = E2E_ROOT / "tools" / "overrides"

# Library keywords: Robot name -> (TypeScript module, parameter names for named-argument detection)
LIBRARIES: dict[str, dict[str, list[str]]] = {
    "Browser": {
        "Click": ["selector", "button", "clickCount", "delay", "force", "noWaitAfter", "modifiers"],
        "Close Browser": ["browser"],
        "Evaluate JavaScript": ["selector", "arg", "all_elements"],
        "Fill Text": ["selector", "txt", "force"],
        "Focus": ["selector"],
        "Get Attribute": ["selector", "attribute", "assertion_operator", "assertion_expected", "message"],
        "Get Browser Ids": ["browser"],
        "Get Cookies": ["return_type"],
        "Get Device": ["name"],
        "Get Element": ["selector"],
        "Get Element Count": ["selector", "assertion_operator", "assertion_expected", "message"],
        "Get Elements": ["selector"],
        "Get Page Ids": ["page", "context", "browser"],
        "Get Property": ["selector", "property", "assertion_operator", "assertion_expected", "message"],
        "Get Text": ["selector", "assertion_operator", "assertion_expected", "message"],
        "Get Url": ["assertion_operator", "assertion_expected", "message"],
        "Get Viewport Size": ["key"],
        "Go To": ["url", "timeout"],
        "Keyboard Key": ["action", "key"],
        "New Browser": ["browser", "headless", "devtools", "args", "reuse_existing", "slowMo", "timeout"],
        "New Context": [],
        "New Page": ["url", "wait_until"],
        "Promise To": [],
        "Promise To Wait For Download": ["saveAs", "wait_for_finished"],
        "Reload": [],
        "Scroll To Element": ["selector"],
        "Select Options By": ["selector", "attribute"],
        "Set Browser Timeout": ["timeout", "scope"],
        "Set Strict Mode": ["mode", "scope"],
        "Switch Browser": ["id"],
        "Switch Page": ["id", "context", "browser"],
        "Take Screenshot": ["filename", "selector", "fullPage"],
        "Type Text": ["selector", "txt", "delay", "clear"],
        "Wait For": [],
        "Wait For Elements State": ["selector", "state", "timeout", "message"],
        "Wait For Load State": ["state", "timeout"],
        "Wait For Response": ["matcher", "timeout"],
    },
    "BuiltIn": {
        "Log": ["message", "level", "html", "console", "repr", "formatter"],
        "Sleep": ["time", "reason"],
        "Fail": ["msg"],
        "Skip": ["msg"],
        "Should Be Equal": ["first", "second", "msg", "values", "ignore_case", "formatter", "strip_spaces", "collapse_spaces"],
        "Should Not Be Equal": ["first", "second", "msg", "values", "ignore_case", "strip_spaces", "collapse_spaces"],
        "Should Be Equal As Integers": ["first", "second", "msg", "values", "base"],
        "Should Be Equal As Numbers": ["first", "second", "msg", "values", "precision"],
        "Should Be Equal As Strings": ["first", "second", "msg", "values", "ignore_case", "strip_spaces", "formatter"],
        "Should Not Be Equal As Strings": ["first", "second", "msg", "values", "ignore_case", "strip_spaces"],
        "Should Be True": ["condition", "msg"],
        "Should Contain": ["container", "item", "msg", "values", "ignore_case", "strip_spaces", "collapse_spaces"],
        "Should Not Be Empty": ["item", "msg"],
        "Should Match Regexp": ["string", "pattern", "msg", "values", "flags"],
        "Should Start With": ["str1", "str2", "msg", "values", "ignore_case", "strip_spaces", "collapse_spaces"],
        "Run Keyword": [],
        "Run Keyword And Return Status": [],
        "Run Keyword And Ignore Error": [],
        "Run Keyword If Test Failed": [],
        "Wait Until Keyword Succeeds": [],
        "Set Log Level": ["level"],
        "Catenate": [],
        "Convert To Integer": ["item", "base"],
        "Get Length": ["item"],
        "Get Time": ["format", "time_"],
    },
    "String_": {
        "Replace String": ["string", "search_for", "replace_with", "count"],
        "Replace String Using Regexp": ["string", "pattern", "replace_with", "count", "flags"],
        "Strip String": ["string", "mode", "characters"],
        "Split String": ["string", "separator", "max_split"],
        "Fetch From Left": ["string", "marker"],
        "Get Substring": ["string", "start", "end"],
        "Get Regexp Matches": ["string", "pattern", "flags"],
        "Remove String": ["string"],
        "Convert To Lowercase": ["string"],
        "Generate Random String": ["length", "chars"],
    },
    "Collections": {
        "Append To List": ["list_"],
        "Get From List": ["list_", "index"],
        "Get From Dictionary": ["dictionary", "key", "default"],
        "Get Index From List": ["list_", "value", "start", "end"],
        "List Should Not Contain Value": ["list_", "value", "msg"],
        "Reverse List": ["list_"],
        "Set To Dictionary": ["*"],  # any name=value is a dictionary item
    },
    "DateTime": {
        "Get Current Date": ["time_zone", "increment", "result_format", "exclude_millis"],
        "Convert Date": ["date", "result_format", "exclude_millis", "date_format"],
        "Add Time To Date": ["date", "time", "result_format", "exclude_millis", "date_format"],
        "Add Time To Time": ["time1", "time2", "result_format", "exclude_millis"],
    },
    "OperatingSystem": {
        "Create Directory": ["path"],
        "Directory Should Exist": ["path", "msg"],
        "File Should Exist": ["path", "msg"],
        "Get File": ["path", "encoding"],
        "Append To File": ["path", "content", "encoding"],
        "Join Path": ["base"],
    },
    "PabotLib": {
        "Acquire Lock": ["name"],
        "Release Lock": ["name"],
        "Set Parallel Value For Key": ["key", "value"],
        "Get Parallel Value For Key": ["key"],
        "Acquire Value Set": [],
        "Release Value Set": [],
        "Get Value From Set": ["key"],
    },
    "RequestsLibrary": {
        "Create Session": ["alias", "url", "headers", "cookies", "auth", "timeout", "proxies", "verify"],
        "POST On Session": ["alias", "url", "data", "json", "expected_status", "msg", "headers"],
        "POST": ["url", "data", "json", "expected_status", "msg", "headers"],
    },
}

# Python libraries keep their Python function names
PYTHON_LIBRARIES = {
    "python_keywords": {
        "Convert Booking Time To Ics": ("convert_booking_time_to_ics", ["time_string"]),
        "Log Differences": ("log_differences", ["elementsText", "expectedText", "verbose", "name1", "name2"]),
        "Get Finnish Day": ("get_finnish_day", ["date_time"]),
        "Validate Timeformat": ("validate_timeformat", ["original_time"]),
    },
    "robot_email_test_tool": {
        "Verify Reservation Email": (
            "verify_reservation_email",
            ["reservation_number", "expected_terms", "expect_attachment", "api_endpoint", "robot_email"],
        ),
    },
}

# Python library functions that are synchronous in the TypeScript port (the others log, so they are async)
SYNC_PYTHON_FUNCTIONS = {"convert_booking_time_to_ics", "get_finnish_day", "validate_timeformat"}

LIBRARY_MODULE_FILES = {
    "Browser": "Browser",
    "BuiltIn": "BuiltIn",
    "String_": "String",
    "Collections": "Collections",
    "DateTime": "DateTime",
    "OperatingSystem": "OperatingSystem",
    "PabotLib": "PabotLib",
    "RequestsLibrary": "RequestsLibrary",
}

# Keywords whose arguments are keywords (keyword name, then its arguments)
RUN_KEYWORD_FAMILY = {
    "Run Keyword": 0,
    "Run Keyword And Return Status": 0,
    "Run Keyword And Ignore Error": 0,
    "Run Keyword If Test Failed": 0,
    "Wait Until Keyword Succeeds": 2,
    "Promise To": 0,
}
# User keywords that take keyword names: name -> indexes of the keyword arguments
USER_KEYWORD_ARGS = {"Retry With Recovery": [0, 1]}

JS_RESERVED = set(
    "break case catch class const continue debugger default delete do else enum export extends false finally for "
    "function if import in instanceof new null return super switch this throw true try typeof var void while with "
    "yield let static implements interface package private protected public await arguments eval".split()
)

BUILTIN_VARIABLES = {
    "empty": '""',
    "space": '" "',
    "true": "true",
    "false": "false",
    "none": "null",
    "null": "null",
    "curdir": "import.meta.dirname",
    "/": '"/"',
    "\\n": '"\\n"',
    "testname": "robot.TEST_NAME",
    "suitename": "robot.SUITE_NAME",
    "testtags": "robot.TEST_TAGS",
    "pabotexecutionpoolid": "robot.PABOTEXECUTIONPOOLID",
}


class TranslationError(Exception):
    pass


@dataclass
class KeywordInfo:
    module: str
    name: str
    params: list[str]  # identifiers
    robot_params: list[str]  # ${name}, @{name}
    defaults: list[str | None]


@dataclass
class Scope:
    """Variables of one keyword or test body."""

    locals: dict[str, str] = field(default_factory=dict)  # normalized -> identifier
    reads: set[str] = field(default_factory=set)
    params: list[str] = field(default_factory=list)


class Generator:
    def __init__(self, files: list[rp.RobotFile], suites_root: Path):
        self.files = files
        self.suites_root = suites_root
        self.by_module = {robot.module: robot for robot in files}
        self.keywords: dict[str, dict[str, KeywordInfo]] = {}  # module -> normalized name -> info
        self.global_variables: dict[str, str] = {}  # normalized -> canonical identifier
        # While a variable table is translated: its earlier variables (normalized -> identifier)
        self.table_variables: dict[str, str] | None = None
        self.table_reference_used = False
        self.problems: list[str] = []
        for robot in files:
            infos: dict[str, KeywordInfo] = {}
            for keyword in robot.keywords:
                params, robot_params, defaults = [], [], []
                for argument in keyword.arguments:
                    name, default = rp.argument_spec(argument)
                    params.append(identifier(name[1:]))
                    robot_params.append(name)
                    defaults.append(default)
                infos[rp.normalize(keyword.name)] = KeywordInfo(robot.module, keyword.name, params, robot_params, defaults)
            self.keywords[robot.module] = infos
            for variable in robot.variables:
                self.add_global(variable.name[2:-1])
        # env_loader.py's variables, and the optional --variable TOKEN / ENDPOINT overrides of create_data.robot
        for name in ("WAF_BYPASS_SECRET", "ROBOT_API_TOKEN", "DJANGO_ADMIN_PASSWORD", "ROBOT_API_ENDPOINT", "TOKEN", "ENDPOINT"):
            self.add_global(name)
        self.collect_runtime_globals()
        # current file state
        self.module = ""
        self.imports: set[str] = set()
        self.lib_imports: set[str] = set()
        self.robot_imports: set[str] = set()
        self.scope = Scope()
        self.needs_await = False
        self.uses_types: set[str] = set()
        self.datetime_helpers: list[str] = []

    # ---------------------------------------------------------------- names

    def add_global(self, name: str) -> None:
        self.global_variables.setdefault(rp.normalize(name), name.replace(" ", "_"))

    def collect_runtime_globals(self) -> None:
        """Variables set with Set Test/Suite Variable anywhere become known globals."""

        def walk(steps: list[rp.Step]) -> None:
            for step in steps:
                if step.kind == "call" and step.name in ("Set Test Variable", "Set Suite Variable", "Set Global Variable"):
                    target = step.args[0]
                    match = re.match(r"^[$@&]\{([^{}]+)\}$", target)
                    if match:
                        self.add_global(match.group(1))
                for _, body in step.branches:
                    walk(body)
                walk(step.body)
                walk(step.finally_body)
                for exception in step.excepts:
                    walk(exception[3])

        for robot in self.files:
            for block in robot.keywords + robot.tests:
                walk(block.body)

    def resource_closure(self, module: str, seen: set[str] | None = None) -> list[str]:
        """Resource files available in a file, in Robot's import order (transitive)."""
        seen = seen if seen is not None else set()
        order: list[str] = []
        for resource in self.by_module[module].resources:
            name = Path(resource.replace("${CURDIR}/", "")).stem
            if name not in seen:
                seen.add(name)
                order.append(name)
                order.extend(self.resource_closure(name, seen))
        return order

    def libraries_of(self, module: str) -> set[str]:
        names: set[str] = {"BuiltIn"}
        for candidate in [module, *self.resource_closure(module)]:
            for library in self.by_module[candidate].libraries:
                names.add(Path(library).stem.replace("pabot.PabotLib", "PabotLib"))
        return names

    def resolve_keyword(self, name: str) -> tuple[str, str, KeywordInfo | None, list[str] | None]:
        """Returns (kind, expression, user keyword info, library parameters) for a keyword name."""
        module_prefix = None
        keyword_name = name
        if "." in name:
            prefix, rest = name.split(".", 1)
            if prefix in self.by_module or prefix in LIBRARIES or prefix in PYTHON_LIBRARIES or prefix == "String":
                module_prefix, keyword_name = prefix, rest
        normalized = rp.normalize(keyword_name)
        # User keywords: same file first, then imported resources
        if module_prefix is None or module_prefix in self.by_module:
            candidates = [module_prefix] if module_prefix else [self.module, *self.resource_closure(self.module)]
            for candidate in candidates:
                info = self.keywords.get(candidate, {}).get(normalized)
                if info is not None:
                    if candidate != self.module:
                        self.imports.add(candidate)
                    return "user", f"{candidate}[{js_string(info.name)}]", info, None
        # Python libraries
        for library, functions in PYTHON_LIBRARIES.items():
            if module_prefix in (None, library):
                for robot_name, (function, params) in functions.items():
                    if rp.normalize(robot_name) == normalized:
                        self.imports.add(library)
                        return "python", f"{library}.{function}", None, params
        # Robot libraries
        library_order = ["Browser", "BuiltIn", "String_", "Collections", "DateTime", "OperatingSystem", "PabotLib", "RequestsLibrary"]
        if module_prefix == "String":
            module_prefix = "String_"
        for library in library_order:
            if module_prefix not in (None, library):
                continue
            for robot_name, params in LIBRARIES[library].items():
                if rp.normalize(robot_name) == normalized:
                    self.lib_imports.add(library)
                    return "library", f"{library}[{js_string(robot_name)}]", None, params
        raise TranslationError(f"Unknown keyword '{name}' in {self.module}")

    def local(self, robot_name: str, declare: bool = False) -> str:
        """The identifier of a local variable; declares it when assigned."""
        normalized = rp.normalize(robot_name)
        if normalized in self.scope.locals:
            return self.scope.locals[normalized]
        if not declare:
            raise KeyError(robot_name)
        ident = identifier(robot_name)
        taken = set(self.scope.locals.values()) | self.imports | self.lib_imports | {"V", "robot", "test", "named", "str", "chain"}
        # Only modules imported by name can collide: a variables-only module is imported for its side effect
        named_modules = {module for module, infos in self.keywords.items() if infos} | set(PYTHON_LIBRARIES)
        while ident in taken or ident in JS_RESERVED or ident in named_modules or ident in LIBRARIES:
            ident = f"{ident}_"
        self.scope.locals[normalized] = ident
        return ident

    def variable(self, robot_name: str) -> str:
        """JS expression for ${name} (without item access or extended syntax)."""
        normalized = rp.normalize(robot_name)
        if normalized in self.scope.locals:
            self.scope.reads.add(self.scope.locals[normalized])
            return self.scope.locals[normalized]
        if self.table_variables is not None and normalized in self.table_variables:
            # An earlier variable of the same table, which isn't in V until the table is registered
            self.table_reference_used = True
            return f"this.{self.table_variables[normalized]}"
        if normalized in BUILTIN_VARIABLES:
            expression = BUILTIN_VARIABLES[normalized]
            if expression.startswith("robot."):
                self.robot_imports.add("robot")
            return expression
        if re.fullmatch(r"-?\d+(\.\d+)?", robot_name.strip()):
            return robot_name.strip()
        canonical = self.global_variables.get(normalized)
        if canonical is None:
            self.problems.append(f"{self.module}: unknown variable ${{{robot_name}}}, using V.{identifier(robot_name)}")
            canonical = identifier(robot_name)
            self.global_variables[normalized] = canonical
        self.robot_imports.add("V")
        return f"V.{canonical}" if re.fullmatch(r"[A-Za-z_$][\w$]*", canonical) else f"V[{js_string(canonical)}]"

    # ---------------------------------------------------------------- values

    def variable_reference(self, inner: str) -> str:
        """`${...}` contents: a name, item access inside braces, extended syntax or inline Python."""
        if inner.startswith("{") and inner.endswith("}"):
            return pyx.translate_inline(inner[1:-1], self)
        normalized = rp.normalize(inner)
        # An exact name wins over extended syntax, like in Robot: ${startTime-hours} is an argument name
        if normalized in BUILTIN_VARIABLES or normalized in self.scope.locals or normalized in self.global_variables:
            return self.variable(inner)
        nested = re.fullmatch(r"\$\{([^{}]+)\}", inner)
        if nested:  # ${${name}} - a variable whose name is in another variable
            self.robot_imports.add("V")
            return f"V[{self.variable(nested.group(1))}]"
        match = re.match(r"^([^\[\]().+\-*/%<>=!]+?)\s*((?:[\[.(+\-*/].*)?)$", inner)
        if not match:
            raise TranslationError(f"Can't parse variable ${{{inner}}} in {self.module}")
        base, rest = match.group(1), match.group(2)
        expression = self.variable(base)
        if not rest:
            return expression
        return pyx.translate_extended(expression, rest, self)

    def value(self, token: str) -> str:
        """JS expression for one Robot argument value."""
        token = token.replace("\\ ", " ")
        whole = re.fullmatch(r"([$@&])\{((?:[^{}]|\{[^{}]*\})+)\}((?:\[[^\]]*\])*)", token)
        if whole:
            expression = self.variable_reference(whole.group(2))
            return expression + self.item_access(whole.group(3))
        parts: list[str] = []
        literal = ""
        index = 0
        while index < len(token):
            char = token[index]
            if char == "\\" and index + 1 < len(token):
                following = token[index + 1]
                literal += {"n": "\n", "t": "\t", "r": "\r"}.get(following, following)
                index += 2
                continue
            if char in "$@&%" and token.startswith("{", index + 1):
                end = matching_brace(token, index + 1)
                if char == "%":  # %{ENV} environment variable
                    if literal:
                        parts.append(("lit", literal))  # type: ignore[arg-type]
                        literal = ""
                    parts.append(("expr", f"(process.env[{js_string(token[index + 2:end])}] ?? \"\")"))  # type: ignore[arg-type]
                    index = end + 1
                    continue
                item_end = end + 1
                while item_end < len(token) and token[item_end] == "[":
                    close = token.find("]", item_end)
                    if close == -1:
                        break
                    item_end = close + 1
                if literal:
                    parts.append(("lit", literal))  # type: ignore[arg-type]
                    literal = ""
                expression = self.variable_reference(token[index + 2 : end]) + self.item_access(token[end + 1 : item_end])
                parts.append(("expr", expression))  # type: ignore[arg-type]
                index = item_end
                continue
            literal += char
            index += 1
        if literal:
            parts.append(("lit", literal))  # type: ignore[arg-type]
        if all(kind == "lit" for kind, _ in parts):  # type: ignore[misc]
            return js_string("".join(text for _, text in parts))  # type: ignore[misc]
        if len(parts) == 1:  # one variable whose braces nest, e.g. ${{{}}}
            return parts[0][1]  # type: ignore[index]
        # `${element} >> child`: the element may be a Locator from Get Element(s), so chain it
        if len(parts) >= 2 and parts[0][0] == "expr" and parts[1][0] == "lit" and parts[1][1].startswith(" >> "):  # type: ignore[index]
            rest = [("lit", parts[1][1][len(" >> ") :]), *parts[2:]]  # type: ignore[index]
            return f"chain({parts[0][1]}, {self.template(rest)})"  # type: ignore[index]
        return self.template(parts)

    def template(self, parts: list) -> str:  # type: ignore[type-arg]
        parts = [(kind, text) for kind, text in parts if not (kind == "lit" and text == "")]
        if all(kind == "lit" for kind, _ in parts):
            return js_string("".join(text for _, text in parts))
        if len(parts) == 1:
            return parts[0][1]
        body = ""
        for kind, text in parts:
            if kind == "lit":
                body += text.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")
            else:
                body += "${str(" + text + ")}"
        return f"`{body}`"

    def item_access(self, items: str) -> str:
        result = ""
        for item in re.findall(r"\[([^\]]*)\]", items):
            if re.fullmatch(r"-?\d+", item):
                result += f"[{item}]" if not item.startswith("-") else f".at({item})"
            elif re.fullmatch(r"\$\{[^{}]+\}", item):
                result += f"[{self.value(item)}]"
            else:
                result += f"[{js_string(item)}]"
        return result

    def arguments(self, args: list[str], params: list[str] | None, user: KeywordInfo | None) -> list[str]:
        """Positional, named (`name=value`), `@{list}` and `&{dict}` arguments of a call."""
        if user is not None:
            return self.user_arguments(args, user)
        positional: list[str] = []
        named: list[tuple[str, str]] = []
        accepts_any_name = params is not None and "*" in params
        for arg in args:
            match = re.match(r"^([A-Za-z_][\w]*)=(.*)$", arg, re.DOTALL)
            if match and params is not None and (match.group(1) in params or accepts_any_name):
                named.append((match.group(1), self.value(match.group(2))))
            elif re.fullmatch(r"@\{[^{}]+\}", arg):
                inner = arg[2:-1]
                positional.append("..." + ("[]" if rp.normalize(inner) == "empty" else self.variable_reference(inner)))
            elif re.fullmatch(r"&\{[^{}]+\}", arg):
                self.robot_imports.add("named")
                positional.append(f"named({self.variable_reference(arg[2:-1])})")
            else:
                positional.append(self.value(arg))
        if named:
            self.robot_imports.add("named")
            items = ", ".join(f"{key}: {value}" for key, value in named)
            positional.append(f"named({{ {items} }})")
        return positional

    def user_arguments(self, args: list[str], info: KeywordInfo) -> list[str]:
        """User keywords take positional parameters; `name=value` calls map onto them by name."""
        values: dict[int, str] = {}
        rest: list[str] = []
        position = 0
        varargs = next((index for index, param in enumerate(info.robot_params) if param.startswith("@")), None)
        for arg in args:
            match = re.match(r"^([A-Za-z_][\w ]*)=(.*)$", arg, re.DOTALL)
            if match and identifier(match.group(1)) in info.params:
                values[info.params.index(identifier(match.group(1)))] = f"/* {match.group(1)}= */ {self.value(match.group(2))}"
                continue
            if varargs is not None and position >= varargs:
                rest.append(self.value(arg))
                continue
            values[position] = self.value(arg)
            position += 1
        if not values and not rest:
            return []
        if varargs is not None:
            fixed = [values.get(index, "undefined") for index in range(varargs)]
            trailing = [(info.params[index], values[index].split("*/ ", 1)[-1]) for index in sorted(values) if index > varargs]
            if trailing:
                self.robot_imports.add("named")
                rest.append(f"named({{ {', '.join(f'{name}: {value}' for name, value in trailing)} }})")
            return [*fixed, *rest]
        last = max(values)
        return [values.get(index, "undefined") for index in range(last + 1)]

    # ---------------------------------------------------------------- statements

    def call(self, step: rp.Step) -> list[str]:
        name = step.name
        args = list(step.args)
        # Special BuiltIn keywords that become plain TypeScript
        special = self.special_call(step)
        if special is not None:
            return special
        if name == "Run Keywords":
            groups: list[list[str]] = [[]]
            for arg in args:
                if arg == "AND":
                    groups.append([])
                else:
                    groups[-1].append(arg)
            lines: list[str] = []
            for group in groups:
                lines += self.call(rp.Step(kind="call", line=step.line, name=group[0], args=group[1:]))
            return lines
        kind, function, info, params = self.resolve_keyword(name)
        library_name = function.split("[", 1)[0]
        robot_name = info.name if info else name.split(".", 1)[-1] if "." in name else name
        if kind == "library" and robot_name in RUN_KEYWORD_FAMILY:
            keyword_index = RUN_KEYWORD_FAMILY[robot_name]
            head = [self.value(arg) for arg in args[:keyword_index]]
            keyword_function, inner_args = self.keyword_reference(args[keyword_index], args[keyword_index + 1 :])
            call_args = [*head, keyword_function, *inner_args]
        elif kind == "user" and info is not None and info.name in USER_KEYWORD_ARGS:
            call_args = []
            keyword_positions = USER_KEYWORD_ARGS[info.name]
            for index, arg in enumerate(args):
                if index in keyword_positions:
                    reference, _ = self.keyword_reference(arg, [])
                    call_args.append(reference)
                else:
                    call_args.append(self.value(arg))
        elif kind == "library" and robot_name == "Evaluate JavaScript":
            selector = self.value(args[0]) if args[0] not in ("${None}", "${NONE}") else "null"
            code = "\n".join(arg for arg in args[1:] if not arg.startswith("arg="))
            call_args = [selector, javascript(code)]
            call_args += [self.value(arg[len("arg=") :]) for arg in args[1:] if arg.startswith("arg=")]
        else:
            call_args = self.arguments(args, params, info)
        if kind == "python" and function.rsplit(".", 1)[-1] in SYNC_PYTHON_FUNCTIONS:
            expression = f"{function}({', '.join(call_args)})"
        else:
            self.needs_await = True
            expression = f"await {function}({', '.join(call_args)})"
        del library_name
        return [self.assign(step.assign, expression)]

    def keyword_reference(self, name: str, args: list[str]) -> tuple[str, list[str]]:
        if re.fullmatch(r"\$\{[^{}]+\}", name):
            return self.value(name), [self.value(arg) if not re.fullmatch(r"@\{[^{}]+\}", arg) else "..." + self.variable_reference(arg[2:-1]) for arg in args]
        if name == "Wait For Response":
            return "Browser[\"Wait For Response\"]", self.wait_for_response_arguments(args)
        kind, function, info, params = self.resolve_keyword(name)
        if kind == "python":
            return f"(...args: RobotValue[]) => {function}(...args)", self.arguments(args, params, None)
        return function, self.arguments(args, params, info)

    def wait_for_response_arguments(self, args: list[str]) -> list[str]:
        """matcher= is JavaScript with Robot variables in it: emit it as code."""
        items = []
        for arg in args:
            key, _, value = arg.partition("=")
            if key == "matcher":
                code = re.sub(r"\$\{([^{}]+)\}", lambda match: self.variable_reference(match.group(1)), value)
                items.append(f"matcher: {javascript(code)}")
            else:
                items.append(f"{key}: {self.value(value)}")
        self.robot_imports.add("named")
        return [f"named({{ {', '.join(items)} }})"]

    def assign(self, targets: list[str], expression: str) -> str:
        if not targets:
            return f"{expression};"
        names = []
        for target in targets:
            names.append(self.local(target[2:-1], declare=True))
        if len(names) == 1:
            return f"{names[0]} = {expression};"
        return f"[{', '.join(names)}] = {expression};"

    def special_call(self, step: rp.Step) -> list[str] | None:
        name = step.name
        args = step.args
        if name in ("Set Test Variable", "Set Suite Variable", "Set Global Variable"):
            target = args[0]
            values = args[1:]
            value = self.value(values[0]) if len(values) == 1 else (f"[{', '.join(self.value(v) for v in values)}]" if values else self.value(target))
            nested = re.fullmatch(r"[$@&]\{\$\{([^{}]+)\}\}", target)
            self.robot_imports.add("V")
            if nested:
                return [f"V[{self.variable(nested.group(1))}] = {value};"]
            robot_name = target[2:-1]
            canonical = self.global_variables[rp.normalize(robot_name)]
            lines = [f"V.{canonical} = {value};"]
            if rp.normalize(robot_name) in self.scope.locals:
                lines.append(f"{self.scope.locals[rp.normalize(robot_name)]} = V.{canonical};")
            return lines
        if name == "Set Variable":
            if len(args) == 1:
                value = self.value(args[0])
            elif args:
                value = f"[{', '.join(self.value(arg) for arg in args)}]"
            else:
                value = '""'
            if not step.assign:
                return [f"// Set Variable    {'    '.join(args)}"]
            if len(step.assign) > 1:
                return [self.assign(step.assign, f"[{', '.join(self.value(arg) for arg in args)}]")]
            return [self.assign(step.assign, value)]
        if name == "Set Variable If":
            condition = pyx.translate_condition(args[0], self)
            when_true = self.value(args[1])
            when_false = self.value(args[2]) if len(args) > 2 else "null"
            return [self.assign(step.assign, f"({condition}) ? {when_true} : {when_false}")]
        if name == "Get Variable Value":
            target = args[0]
            fallback = self.value(args[1]) if len(args) > 1 else "null"
            match = re.fullmatch(r"\$\{?([^{}]+?)\}?", target.lstrip("$"))
            inner = target[2:-1] if target.startswith("${") else target[1:]
            if re.fullmatch(r"\$\{\$\{([^{}]+)\}\}", target):
                self.robot_imports.add("V")
                expression = f"V[{self.variable(target[4:-2])}]"
            elif rp.normalize(inner) in BUILTIN_VARIABLES:
                expression = self.variable(inner)
            else:
                expression = self.variable(inner)
            del match
            return [self.assign(step.assign, f"{expression} ?? {fallback}")]
        if name == "Evaluate":
            expression = pyx.translate_evaluate(args[0], self)
            return [self.assign(step.assign, expression)]
        if name in ("Should Be True",):
            condition = pyx.translate_condition(args[0], self)
            rest = self.arguments(args[1:], ["msg"], None)
            self.lib_imports.add("BuiltIn")
            self.needs_await = True
            return [self.assign(step.assign, f"await BuiltIn[\"Should Be True\"]({', '.join([condition, *rest])})")]
        if name == "Run Only Once":
            # The suite setup: handled by the create_data setup project
            return [f"// Run Only Once    {'    '.join(args)}"]
        return None

    def statements(self, steps: list[rp.Step], indent: int) -> list[str]:
        pad = "  " * indent
        lines: list[str] = []
        for step in steps:
            if step.kind == "blank":
                if lines and lines[-1] != "":
                    lines.append("")
                continue
            if step.kind == "comment":
                lines.append(f"{pad}// {strip_comment(step.comment)}")
                continue
            trailing = f" // {strip_comment(step.comment)}" if step.comment else ""
            if step.kind == "call":
                translated = self.call(step)
                for index, line in enumerate(translated):
                    lines.append(f"{pad}{line}{trailing if index == len(translated) - 1 else ''}")
            elif step.kind == "if":
                branches = merge_lonely_if(step.branches)
                all_return = True
                for index, (condition, body) in enumerate(branches):
                    if condition is None and all_return:
                        # No else after a branch that returns (eslint no-else-return)
                        lines.append(f"{pad}}}")
                        lines += self.statements(body, indent)
                        break
                    if condition is None:
                        head = "} else {"
                    else:
                        translated_condition = " && ".join(
                            wrap_or(pyx.translate_condition(part, self)) for part in condition.split(MERGED_CONDITION)
                        )
                        head = f"if ({translated_condition}) {{" if index == 0 else f"}} else if ({translated_condition}) {{"
                    lines.append(f"{pad}{head}{trailing if index == 0 else ''}")
                    lines += self.statements(body, indent + 1)
                    all_return = all_return and ends_with_return(body)
                else:
                    lines.append(f"{pad}}}")
            elif step.kind == "for":
                variables = [self.local(var[2:-1], declare=True) for var in step.loop_vars]
                if step.flavor == "IN RANGE":
                    bounds = [pyx.translate_number(value, self) for value in step.values]
                    start, end = ("0", bounds[0]) if len(bounds) == 1 else (bounds[0], bounds[1])
                    variable = variables[0]
                    self.scope.reads.add(variable)
                    lines.append(f"{pad}for ({variable} = {start}; {variable} < {end}; {variable}++) {{{trailing}")
                elif step.flavor == "IN":
                    if len(step.values) == 1 and step.values[0].startswith("@{"):
                        iterable = self.variable_reference(step.values[0][2:-1])
                    else:
                        iterable = f"[{', '.join(self.value(value) for value in step.values)}]"
                    if len(variables) != 1:
                        raise TranslationError(f"FOR with several variables in {self.module}")
                    lines.append(f"{pad}for ({variables[0]} of {iterable}) {{{trailing}")
                else:
                    raise TranslationError(f"Unsupported FOR flavor {step.flavor}")
                lines += self.statements(step.body, indent + 1)
                lines.append(f"{pad}}}")
            elif step.kind == "while":
                condition, body = step.branches[0]
                lines.append(f"{pad}while ({pyx.translate_condition(condition or 'True', self)}) {{{trailing}")
                lines += self.statements(body, indent + 1)
                lines.append(f"{pad}}}")
            elif step.kind == "try":
                lines.append(f"{pad}try {{{trailing}")
                lines += self.statements(step.body, indent + 1)
                if step.excepts:
                    self.robot_imports.add("errorMessage")
                    lines.append(f"{pad}}} catch (err) {{")
                    lines.append(f"{pad}  rethrowSkip(err);")
                    self.robot_imports.add("rethrowSkip")
                    single_pattern = len(step.excepts) == 1 and bool(step.excepts[0][0])
                    for index, (patterns, options, as_var, body) in enumerate(step.excepts):
                        inner_pad = pad + "  "
                        body_lines: list[str] = []
                        if as_var is not None:
                            body_lines.append(f"{inner_pad}{self.local(as_var[2:-1], declare=True)} = errorMessage(err);")
                        body_lines += self.statements(body, indent + 1)
                        if single_pattern:
                            # EXCEPT    pattern: other errors are not caught
                            glob = any(option == "type=glob" for option in options)
                            checks = " || ".join(
                                f"exceptionMatches(err, {self.value(pattern)}, {js_string('glob' if glob else 'literal')})"
                                for pattern in patterns
                            )
                            lines.append(f"{inner_pad}if (!({checks})) {{")
                            lines.append(f"{inner_pad}  throw err;")
                            lines.append(f"{inner_pad}}}")
                            lines += body_lines
                        elif patterns:
                            glob = any(option == "type=glob" for option in options)
                            checks = " || ".join(
                                f"exceptionMatches(err, {self.value(pattern)}, {js_string('glob' if glob else 'literal')})"
                                for pattern in patterns
                            )
                            self.robot_imports.add("exceptionMatches")
                            keyword = "if" if index == 0 else "} else if"
                            lines.append(f"{inner_pad}{keyword} ({checks}) {{")
                            lines += ["  " + line if line else line for line in body_lines]
                        else:
                            if index > 0:
                                lines.append(f"{inner_pad}}} else {{")
                                lines += ["  " + line if line else line for line in body_lines]
                            else:
                                lines += body_lines
                    if step.excepts[0][0] and not single_pattern:
                        if step.excepts[-1][0]:
                            lines.append(f"{pad}  }} else {{")
                            lines.append(f"{pad}    throw err;")
                        lines.append(f"{pad}  }}")
                if step.finally_body or not step.excepts:
                    lines.append(f"{pad}}} finally {{")
                    lines += self.statements(step.finally_body, indent + 1)
                lines.append(f"{pad}}}")
            elif step.kind == "break":
                lines.append(f"{pad}break;{trailing}")
            elif step.kind == "continue":
                lines.append(f"{pad}continue;{trailing}")
            elif step.kind == "return":
                if not step.args:
                    lines.append(f"{pad}return;{trailing}")
                elif len(step.args) == 1:
                    lines.append(f"{pad}return {self.value(step.args[0])};{trailing}")
                else:
                    lines.append(f"{pad}return [{', '.join(self.value(arg) for arg in step.args)}];{trailing}")
            elif step.kind == "var":
                translated_var = self.var(step)
                lines.append(f"{pad}{translated_var}{trailing if step.comment else ''}")
            else:
                raise TranslationError(f"Unknown step {step.kind}")
        while lines and lines[-1] == "":
            lines.pop()
        return lines

    def var(self, step: rp.Step) -> str:
        target = step.name
        values = [value for value in step.args if not value.startswith("scope=")]
        scope = next((value.split("=", 1)[1] for value in step.args if value.startswith("scope=")), None)
        if target.startswith("@"):
            items: list[str] = []
            for value in values:
                if re.fullmatch(r"@\{[^{}]+\}", value):
                    inner = value[2:-1]
                    items.append("..." + ("[]" if rp.normalize(inner) == "empty" else self.variable_reference(inner)))
                else:
                    items.append(self.value(value))
            if step.arg_comments and len(step.arg_comments) > 1:
                # One item per line, each with the comment it had in the .robot file
                pad = " " * 6
                rendered = []
                for index, item in enumerate(items):
                    comment = step.arg_comments.get(index)
                    rendered.append(f"{pad}{item},{f' // {strip_comment(comment)}' if comment else ''}")
                step.comment = None
                return f"{self.local(target[2:-1], declare=True)} = [\n" + "\n".join(rendered) + "\n    ];"
            items = [item for item in items if item != "...[]"]
            expression = f"[{', '.join(items)}]"
        elif target.startswith("&"):
            pairs = []
            for value in values:
                key, item = value.split("=", 1)
                key_expression = self.value(key)
                pairs.append(f"[{key_expression}]: {self.value(item)}" if key_expression.startswith(("V.", "`")) or not key_expression.startswith('"') else f"{key_expression}: {self.value(item)}")
            expression = f"{{ {', '.join(pairs)} }}" if pairs else "{}"
        else:
            expression = self.value(values[0]) if len(values) == 1 else js_string(" ".join(values))
        if scope is not None and scope.upper() in ("TEST", "SUITE", "GLOBAL"):
            self.robot_imports.add("V")
            return f"V.{self.global_variables[rp.normalize(target[2:-1])]} = {expression};"
        return f"{self.local(target[2:-1], declare=True)} = {expression};"

    # ---------------------------------------------------------------- blocks

    def keyword_function(self, keyword: rp.Keyword, info: KeywordInfo) -> list[str]:
        self.scope = Scope()
        for param in info.robot_params:
            self.local(param[1:], declare=True)
        self.scope.params = [self.scope.locals[rp.normalize(param[1:])] for param in info.robot_params]
        self.needs_await = False
        body = self.statements(keyword.body, 2)
        varargs = next((index for index, param in enumerate(info.robot_params) if param.startswith("@")), None)
        # Arguments after @{varargs} are named-only in Robot; they come in a trailing named() in the rest
        named_only = [] if varargs is None else list(zip(self.scope.params[varargs + 1 :], info.defaults[varargs + 1 :]))
        ts_params = self.scope.params if varargs is None else self.scope.params[: varargs + 1]
        declared = [ident for ident in self.scope.locals.values() if ident not in ts_params]
        params = []
        for param, robot_param, default in zip(ts_params, info.robot_params, info.defaults):
            if robot_param.startswith("@"):
                params.append(f"...{param}: RobotValue[]")
            elif default is None:
                params.append(f"{param}: RobotValue")
            else:
                params.append(f"{param}: RobotValue = {self.value(default)}")
        if named_only:
            self.robot_imports.add("namedOnly")
            defaults_js = ", ".join(f"{name}: {self.value(default) if default is not None else 'undefined'}" for name, default in named_only)
            names_js = ", ".join(name for name, _ in named_only)
            rest = self.scope.params[varargs]  # type: ignore[index]
            body.insert(0, f"    [{rest}, {{ {names_js} }}] = namedOnly({rest}, {{ {defaults_js} }});")
            self.scope.reads.update(name for name, _ in named_only)
        lines: list[str] = []
        for comment in keyword.leading_comments:
            lines.append(f"  // {strip_comment(comment)}")
        doc = jsdoc(keyword.documentation, "  ")
        lines += doc
        unused = [param for param in ts_params if param not in self.scope.reads]
        if unused:
            lines.append("  // oxlint-disable-next-line eslint/no-unused-vars -- Robot argument kept for name parity")
        prefix = "async " if self.needs_await else ""
        lines.append(f"  {js_string(info.name)}: {prefix}({', '.join(params)}) => {{")
        lines += declarations(declared, self.scope.reads, "    ")
        if keyword.timeout:
            lines.append(f"    // [Timeout]    {keyword.timeout}")
        lines += body
        lines.append("  },")
        return lines

    def generate_resource(self, robot: rp.RobotFile) -> str:
        self.module = robot.module
        self.imports = set()
        self.lib_imports = set()
        self.robot_imports = {"keywords"} if robot.keywords else set()
        body: list[str] = []
        variables = self.variables_block(robot)
        if robot.keywords:
            body.append(f"export const {robot.module} = keywords({js_string(robot.module)}, {{")
            for index, keyword in enumerate(robot.keywords):
                info = self.keywords[robot.module][rp.normalize(keyword.name)]
                override = OVERRIDES_ROOT / robot.module / f"{keyword.name}.ts-fragment"
                if override.exists():
                    body += override.read_text(encoding="utf-8").rstrip("\n").split("\n")
                    for module in re.findall(r"// imports: (.+)", override.read_text(encoding="utf-8")):
                        for name in module.split(","):
                            name = name.strip()
                            (self.lib_imports if name in LIBRARIES else self.imports).add(name)
                    if index < len(robot.keywords) - 1:
                        body.append("")
                    continue
                try:
                    body += self.keyword_function(keyword, info)
                except (TranslationError, pyx.ExpressionError) as error:
                    self.problems.append(f"{robot.module}.{keyword.name}: {error}")
                    body += [f"  {js_string(keyword.name)}: () => {{", f"    throw new Error({js_string('Not translated: ' + str(error))});", "  },"]
                if index < len(robot.keywords) - 1:
                    body.append("")
            body.append("});")
        self.scan_imports("\n".join([*variables, *body]))
        header = self.header(robot, robot.documentation)
        return "\n".join([*header, *variables, *body]) + "\n"

    def variables_block(self, robot: rp.RobotFile) -> list[str]:
        if not robot.variables:
            return []
        self.robot_imports.add("registerVariables")
        lines = [f"export const {robot.module}_variables = {{"]
        self.scope = Scope()
        self.table_variables = {}
        explained = False
        for variable in robot.variables:
            if variable.comment:
                lines.append(f"  // {strip_comment(variable.comment)}")
            name = variable.name[2:-1].replace(" ", "_")
            self.table_reference_used = False
            if variable.name.startswith("@"):
                value = f"[{', '.join(self.value(v) for v in variable.values)}]"
            elif variable.name.startswith("&"):
                value = "{ " + ", ".join(f"{js_string(v.split('=', 1)[0])}: {self.value(v.split('=', 1)[1])}" for v in variable.values) + " }"
            elif not variable.values:
                value = '""'
            elif len(variable.values) == 1:
                value = self.value(variable.values[0])
            else:
                value = js_string(" ".join(variable.values))
            if self.table_reference_used:
                # Robot resolves a value with the variables above it; registerVariables reads the getter in order
                if not explained:
                    lines.append("  // A getter reads the variables above it in this table, like Robot resolves them")
                    explained = True
                lines += [f"  get {name}() {{", f"    return {value};", "  },"]
            else:
                lines.append(f"  {name}: {value},")
            self.table_variables[rp.normalize(variable.name[2:-1])] = name
        self.table_variables = None
        lines.append("};")
        lines.append(f"registerVariables({robot.module}_variables);")
        lines.append("")
        return lines

    def header(self, robot: rp.RobotFile, documentation: str) -> list[str]:
        relative_dir = robot.path.parent.relative_to(self.suites_root)
        depth = len(relative_dir.parts)
        to_root = "../" * (depth + 1)
        to_suites = "../" * depth if depth else "./"
        lines: list[str] = []
        lines += jsdoc(documentation or f"Port of {robot.path.relative_to(self.suites_root).as_posix()}", "")
        robot_names = sorted(self.robot_imports - {"RobotValue"})
        value_types = "RobotValue" if "RobotValue" in self.uses_types else ""
        for library in sorted(self.lib_imports):
            names = [library]
            if library == "DateTime":
                names += self.datetime_helpers
            lines.append(f'import {{ {", ".join(names)} }} from "{to_root}lib/{LIBRARY_MODULE_FILES[library]}";')
        if self.datetime_helpers and "DateTime" not in self.lib_imports:
            lines.append(f'import {{ {", ".join(self.datetime_helpers)} }} from "{to_root}lib/DateTime";')
        if robot_names:
            lines.append(f'import {{ {", ".join(robot_names)} }} from "{to_root}lib/robot";')
        if value_types:
            lines.append(f'import type {{ RobotValue }} from "{to_root}lib/robot";')
        for module in sorted(self.imports):
            lines.append(f'import {{ {module} }} from "{self.module_path(robot, module, to_suites)}";')
        for module in self.variable_imports(robot):
            lines.append(f'import "{self.module_path(robot, module, to_suites)}";')
        lines.append("")
        return lines

    def scan_imports(self, text: str) -> None:
        """The lib/robot helpers the generated code uses."""
        self.robot_imports = set()
        helpers = ["keywords", "registerVariables", "named", "namedOnly", "str", "chain", "isTruthy", "pyBool",
                   "errorMessage", "rethrowSkip", "exceptionMatches", "testInfo"]
        if self.by_module[self.module].tests:
            helpers.append("test")
        for helper in helpers:
            if re.search(rf"(?<![\w.$]){helper}\(", text) or (helper == "test" and re.search(r"(?<![\w.])test\.", text)):
                self.robot_imports.add(helper)
        if re.search(r"(?<![\w.$])V[.\[]", text):
            self.robot_imports.add("V")
        if re.search(r"(?<![\w.$])robot\.", text):
            self.robot_imports.add("robot")
        self.uses_types = {"RobotValue"} if re.search(r"\bRobotValue\b", text) else set()
        self.datetime_helpers = sorted(
            helper for helper in ("parseDate", "strftime") if re.search(rf"(?<![\w.$]){helper}\(", text)
        )

    def variable_imports(self, robot: rp.RobotFile) -> list[str]:
        """Resource and variable files whose variables this file uses, imported for their side effect."""
        modules = []
        for name in self.resource_closure(robot.module):
            if self.by_module[name].variables and name not in self.imports and name != robot.module:
                modules.append(name)
        for variables_file in robot.variable_files:
            modules.append(Path(variables_file.replace("${CURDIR}/", "")).stem)
        return modules

    def module_path(self, robot: rp.RobotFile, module: str, to_suites: str) -> str:
        if module in PYTHON_LIBRARIES or module == "env_loader":
            target = Path("Resources") / module
        else:
            target = self.by_module[module].path.relative_to(self.suites_root).with_suffix("")
        here = robot.path.parent.relative_to(self.suites_root)
        relative = Path(*([".."] * len(here.parts)), target) if here.parts else target
        text = relative.as_posix()
        return text if text.startswith(".") else f"./{text}"

    def generate_suite(self, robot: rp.RobotFile) -> str:
        self.module = robot.module
        self.imports = set()
        self.lib_imports = set()
        self.robot_imports = {"test"}
        suite = rp.suite_name(robot.module)
        tags = [f"@{tag}" for tag in (robot.setting("Test Tags") or [[]])[0]]
        annotations = []
        if robot.documentation:
            annotations.append(f"{{ type: \"Documentation\", description: {js_string(robot.documentation)} }}")
        suite_setup = (robot.setting("Suite Setup") or [[]])[0]
        if suite_setup:
            annotations.append(
                f"{{ type: \"Suite Setup\", description: {js_string('    '.join(suite_setup) + ' (the create_data setup project)')} }}"
            )
        details = []
        if tags:
            details.append(f"tag: [{', '.join(js_string(tag) for tag in tags)}]")
        if annotations:
            details.append(f"annotation: [{', '.join(annotations)}]")
        body: list[str] = []
        body.append(f"test.describe({js_string(suite)}, {{ {', '.join(details)} }}, () => {{")
        for setting, hook in (("Test Setup", "beforeEach"), ("Test Teardown", "afterEach")):
            value = (robot.setting(setting) or [[]])[0]
            if value:
                self.scope = Scope()
                self.needs_await = False
                lines = self.call(rp.Step(kind="call", line=0, name=value[0], args=value[1:]))
                body.append(f"  test.{hook}(async () => {{")
                body += [f"    {line}" for line in lines]
                body.append("  });")
                body.append("")
        for index, test in enumerate(robot.tests):
            self.scope = Scope()
            self.needs_await = False
            try:
                statements = self.statements(test.body, 2)
            except (TranslationError, pyx.ExpressionError) as error:
                self.problems.append(f"{robot.module} test '{test.name}': {error}")
                statements = [f"    throw new Error({js_string('Not translated: ' + str(error))});"]
            test_details = []
            if test.tags:
                test_details.append(f"tag: [{', '.join(js_string('@' + tag) for tag in test.tags)}]")
            if test.documentation:
                test_details.append(f"annotation: {{ type: \"Documentation\", description: {js_string(test.documentation)} }}")
            details_text = f"{{ {', '.join(test_details)} }}, " if test_details else ""
            body.append(f"  test({js_string(test.name)}, {details_text}async () => {{")
            body += declarations(list(self.scope.locals.values()), self.scope.reads, "    ")
            body += statements
            body.append("  });")
            if index < len(robot.tests) - 1:
                body.append("")
        body.append("});")
        self.scan_imports("\n".join(body))
        header = self.header(robot, robot.documentation or "")
        return "\n".join([*header, *body]) + "\n"

    def run(self) -> None:
        written = 0
        for robot in self.files:
            relative = robot.path.relative_to(self.suites_root)
            if robot.tests:
                content = self.generate_suite(robot)
                target = OUTPUT_ROOT / relative.with_suffix(".spec.ts")
            else:
                content = self.generate_resource(robot)
                target = OUTPUT_ROOT / relative.with_suffix(".ts")
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content, encoding="utf-8")
            written += 1
        report = E2E_ROOT / "tools" / "translation-report.json"
        report.write_text(json.dumps(sorted(set(self.problems)), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Wrote {written} files, {len(set(self.problems))} problems (tools/translation-report.json)")


def declarations(declared: list[str], reads: set[str], pad: str) -> list[str]:
    """Hoisted `let` declarations, like Robot's keyword-scoped variables. A variable the Robot code assigns
    but never reads gets its own line with a lint exception, so its name stays as it was."""
    lines: list[str] = []
    used = [name for name in declared if name in reads]
    unused = [name for name in declared if name not in reads]
    if used:
        lines.append(f"{pad}let {', '.join(f'{name}: RobotValue' for name in used)};")
    for name in unused:
        lines.append(f"{pad}// oxlint-disable-next-line eslint/no-unused-vars -- assigned but not read in the Robot keyword")
        lines.append(f"{pad}let {name}: RobotValue;")
    return lines


MERGED_CONDITION = "\u0000AND\u0000"


def merge_lonely_if(branches: list) -> list:  # type: ignore[type-arg]
    """IF a / IF b / END / END becomes IF a and b (unicorn no-lonely-if). Comments block the merge."""
    if len(branches) != 1 or branches[0][0] is None:
        return branches
    condition, body = branches[0]
    statements = [step for step in body if step.kind != "blank"]
    if len(statements) == 1 and statements[0].kind == "if" and len(statements[0].branches) == 1:
        inner_condition, inner_body = statements[0].branches[0]
        if inner_condition is not None and not statements[0].comment:
            return merge_lonely_if([(f"{condition}{MERGED_CONDITION}{inner_condition}", inner_body)])
    return branches


def ends_with_return(body: list) -> bool:  # type: ignore[type-arg]
    """True when the body always returns: a RETURN last, or an IF/ELSE whose every branch returns."""
    statements = [step for step in body if step.kind not in ("blank", "comment")]
    if not statements:
        return False
    last = statements[-1]
    if last.kind == "return":
        return True
    if last.kind == "if":
        return last.branches[-1][0] is None and all(ends_with_return(branch) for _, branch in last.branches)
    return False


def wrap_or(condition: str) -> str:
    return f"({condition})" if " || " in condition else condition


def javascript(code: str) -> str:
    """JavaScript passed to the Browser library, as TypeScript: untyped arrow parameters get RobotValue."""
    # Long numbers with separators (unicorn numeric-separators-style)
    code = re.sub(r"(?<![\w.])(\d{1,3})(\d{3})(?![\d.\w])", r"\1_\2", code)
    # The page functions run in the browser, where a timer promise is the only way to wait
    code = "\n".join(
        f"// oxlint-disable-next-line promise/avoid-new, promise/param-names -- runs in the browser\n{line}"
        if "new Promise(" in line
        else line
        for line in code.split("\n")
    )
    code = re.sub(r"\bfunction\s*\((\w+)\)\s*\{", r"(\1: RobotValue) => {", code)
    code = re.sub(r"(?<![\w$])\((\w+)\)\s*=>", r"(\1: RobotValue) =>", code)
    code = re.sub(r"(?<![\w$(.])(\b[a-z]\w*)\s*=>", r"(\1: RobotValue) =>", code)
    return code


def identifier(robot_name: str) -> str:
    name = robot_name.replace(" ", "_")
    name = re.sub(r"[^\w$]", "_", name)
    if re.match(r"^\d", name):
        name = f"_{name}"
    return name


def js_string(text: str) -> str:
    return json.dumps(text, ensure_ascii=False)


def strip_comment(comment: str | None) -> str:
    return (comment or "").lstrip("#").strip()


def jsdoc(text: str, pad: str) -> list[str]:
    if not text:
        return []
    lines = text.replace("*/", "*\\/").split("\n")
    if len(lines) == 1:
        return [f"{pad}/** {lines[0].strip()} */"]
    return [f"{pad}/**", *[f"{pad} * {line.rstrip()}".rstrip() for line in lines], f"{pad} */"]


def matching_brace(text: str, start: int) -> int:
    depth = 0
    for index in range(start, len(text)):
        if text[index] == "{":
            depth += 1
        elif text[index] == "}":
            depth -= 1
            if depth == 0:
                return index
    raise TranslationError(f"Unbalanced braces in {text}")


def main() -> None:
    robot_repo = Path(sys.argv[1] if len(sys.argv) > 1 else "../../tilavarauspalvelu-robot").resolve()
    suites_root = robot_repo / "TestSuites"
    generator = Generator(rp.parse_suite(suites_root), suites_root)
    generator.run()


if __name__ == "__main__":
    main()
