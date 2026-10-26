"""Translates the Python expressions of the Robot suite (IF, WHILE, Evaluate, Should Be True) to TypeScript.

Robot replaces `${var}` in an expression with the variable's text before Python evaluates it, and `$var`
with the object itself. The converter keeps that: a quoted `'${x}'` compares the text (`str(x)`), a bare
`${x}` next to a number is a number, and a bare `${x}` alone is Robot truthiness (`isTruthy(x)`).

The expressions the converter doesn't support are translated by hand in OVERRIDES, keyed by the exact
expression text. A new unsupported expression fails the generation, so nothing is translated silently.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import TYPE_CHECKING, Callable

if TYPE_CHECKING:
    from robot_to_ts import Generator


class ExpressionError(Exception):
    pass


@dataclass
class Node:
    js: str
    kind: str  # str, num, bool, none, robotvar, obj, list, dict, any


def ref(generator: "Generator", name: str) -> str:
    """JS for a Robot variable name used inside a hand translation."""
    return generator.variable_reference(name)


TRIPLE_QUOTE = "'" * 3
STRPTIME_EXPRESSION = (
    f"datetime.datetime.strptime({TRIPLE_QUOTE}${{date_without_weekday}}{TRIPLE_QUOTE}, '%d.%m.%Y').strftime('%Y%m%d')"
)

# Hand translations of expressions that start like this (they are long and full of escapes)
PREFIX_OVERRIDES: dict[str, Callable[["Generator"], str]] = {
    # custom_keywords.Check Text Of Element With Normalization And Logging To File
    '"\\\\n".join([': lambda g: (
        f"{ref(g, 'differences')}.map((diff: RobotValue) => "
        "`Position: ${String(diff.position)} | Elements Text: ${JSON.stringify(diff.elementsText)} | "
        "Expected Text: ${JSON.stringify(diff.expectedText)}`).join(\"\\n\")"
    ),
}

# Hand translations, keyed by the expression exactly as it is in the .robot file
OVERRIDES: dict[str, Callable[["Generator"], str]] = {
    # graphql_commands.robot
    "next((c['value'] for c in ${cookies} if c['name'] == 'csrftoken'), None)": lambda g: (
        f"({ref(g, 'cookies')}.find((cookie: RobotValue) => cookie.name === \"csrftoken\")?.value ?? null)"
    ),
    "next((c['value'] for c in ${cookies} if c['name'] == 'sessionid'), None)": lambda g: (
        f"({ref(g, 'cookies')}.find((cookie: RobotValue) => cookie.name === \"sessionid\")?.value ?? null)"
    ),
    'json.dumps({"query": """${graphql_query}""", "variables": ${variables}})': lambda g: (
        f"JSON.stringify({{ query: {ref(g, 'graphql_query')}, variables: {ref(g, 'variables')} }})"
    ),
    "\"${URL_TEST}\".rstrip('/')": lambda g: f"String({ref(g, 'URL_TEST')}).replace(/\\/+$/, \"\")",
    "$state in $states_list": lambda g: f"{ref(g, 'states_list')}.includes({ref(g, 'state')})",
    '{"input": {"pk": ${pk}, "draft": True}}': lambda g: f"{{ input: {{ pk: {ref(g, 'pk')}, draft: true }} }}",
    '{"input": {"pk": ${pk}}}': lambda g: f"{{ input: {{ pk: {ref(g, 'pk')} }} }}",
    # custom_keywords.robot
    "re.sub(r'[\\xa0\\u200b\\u200c\\u200d\\u202f]', ' ', '''${string}''').strip()": lambda g: (
        f"String({ref(g, 'string')}).replaceAll(/\\u00A0|\\u200B|\\u200C|\\u200D|\\u202F/g, \" \").trim()"
    ),
    "datetime.datetime.now().astimezone().tzname()": lambda _g: (
        "new Intl.DateTimeFormat(\"en-US\", { timeZoneName: \"short\" }).formatToParts(new Date())"
        ".find((part) => part.type === \"timeZoneName\")?.value"
    ),
    # data_modification.robot
    "'${info_card_time_of_reservation}'.strip()": lambda g: f"str({ref(g, 'info_card_time_of_reservation')}).trim()",
    "' '.join('''${RESERVATION_TAG}'''.split())": lambda g: (
        f"str({ref(g, 'RESERVATION_TAG')}).trim().split(/\\s+/).join(\" \")"
    ),
    "'{:02}'.format(int(${date_time.hour}))": lambda g: f"String({ref(g, 'date_time')}.hour).padStart(2, \"0\")",
    "'{:02}'.format(${date_time.minute})": lambda g: f"String({ref(g, 'date_time')}.minute).padStart(2, \"0\")",
    "'{:02}'.format((int(${date_time.hour}) + 1) % 24)": lambda g: (
        f"String(({ref(g, 'date_time')}.hour + 1) % 24).padStart(2, \"0\")"
    ),
    # mybookings.robot: "1.10.2024" -> "20241001"
    STRPTIME_EXPRESSION: lambda g: (
        f"strftime(parseDate(str({ref(g, 'date_without_weekday')}), \"%d.%m.%Y\"), \"%Y%m%d\")"
    ),
    # app_common.robot and quick_reservation.robot: milliseconds since the epoch
    "int(time.time() * 1000)": lambda _g: "Date.now()",
    # app_common.robot and quick_reservation.robot: Browser library response details
    "$response.get('ok')": lambda g: f"{ref(g, 'response')}.ok",
    "'errors' not in ($response.get('body') or {})": lambda g: (
        f"!Object.hasOwn({ref(g, 'response')}.body || {{}}, \"errors\")"
    ),
}

# Python functions that the converter translates directly
PY_FUNCTIONS = {"len", "int", "str", "float", "bool"}


class Parser:
    def __init__(self, text: str, generator: "Generator", base: Node | None = None):
        self.text = text
        self.generator = generator
        self.tokens = list(self.tokenize(text))
        self.position = 0
        self.base = base

    # ---------------------------------------------------------------- tokens

    def tokenize(self, text: str):
        index = 0
        while index < len(text):
            char = text[index]
            if char.isspace():
                index += 1
                continue
            if text.startswith("__BASE__", index):
                yield ("base", "__BASE__")
                index += len("__BASE__")
                continue
            if char == "$" and text.startswith("{", index + 1):
                end = self.matching(text, index + 1)
                item_end = end + 1
                while item_end < len(text) and text[item_end] == "[":
                    close = text.find("]", item_end)
                    item_end = close + 1
                yield ("var", text[index:item_end])
                index = item_end
                continue
            if char == "$" and re.match(r"[A-Za-z_]", text[index + 1 : index + 2]):
                match = re.match(r"\$([A-Za-z_]\w*)", text[index:])
                assert match
                yield ("obj", match.group(1))
                index += len(match.group(0))
                continue
            if char in "\"'" or (char in "fr" and text[index + 1 : index + 2] in "\"'"):
                prefix = ""
                if char in "fr":
                    prefix = char
                    index += 1
                    char = text[index]
                quote = text[index : index + 3] if text[index : index + 3] in ('"""', "'''") else char
                end = text.find(quote, index + len(quote))
                if end == -1:
                    raise ExpressionError(f"Unterminated string in {text}")
                yield ("fstr" if prefix == "f" else "str", text[index + len(quote) : end])
                index = end + len(quote)
                continue
            number = re.match(r"\d+(\.\d+)?", text[index:])
            if number:
                yield ("num", number.group(0))
                index += len(number.group(0))
                continue
            name = re.match(r"[A-Za-z_]\w*", text[index:])
            if name:
                yield ("name", name.group(0))
                index += len(name.group(0))
                continue
            operator = re.match(r"==|!=|<=|>=|//|\*\*|[<>+\-*/%()\[\],.:{}]", text[index:])
            if operator:
                yield ("op", operator.group(0))
                index += len(operator.group(0))
                continue
            raise ExpressionError(f"Unexpected character {char!r} in {text}")

    @staticmethod
    def matching(text: str, start: int) -> int:
        depth = 0
        for index in range(start, len(text)):
            if text[index] == "{":
                depth += 1
            elif text[index] == "}":
                depth -= 1
                if depth == 0:
                    return index
        raise ExpressionError(f"Unbalanced braces in {text}")

    def peek(self, offset: int = 0):
        position = self.position + offset
        return self.tokens[position] if position < len(self.tokens) else ("end", "")

    def take(self, kind: str | None = None, value: str | None = None):
        token = self.peek()
        if (kind and token[0] != kind) or (value and token[1] != value):
            raise ExpressionError(f"Expected {value or kind} in {self.text}, got {token[1]!r}")
        self.position += 1
        return token

    def at(self, value: str, kind: str = "op") -> bool:
        token = self.peek()
        return token[0] == kind and token[1] == value

    # ---------------------------------------------------------------- grammar

    def parse(self) -> Node:
        node = self.or_expression()
        if self.peek()[0] != "end":
            raise ExpressionError(f"Unexpected {self.peek()[1]!r} in {self.text}")
        return node

    def or_expression(self) -> Node:
        node = self.and_expression()
        while self.at("or", "name"):
            self.take()
            right = self.and_expression()
            node = Node(f"{boolean(node)} || {boolean(right)}", "bool")
        return node

    def and_expression(self) -> Node:
        node = self.not_expression()
        while self.at("and", "name"):
            self.take()
            right = self.not_expression()
            node = Node(f"{wrap_or(boolean(node))} && {wrap_or(boolean(right))}", "bool")
        return node

    def not_expression(self) -> Node:
        if self.at("not", "name"):
            self.take()
            operand = self.not_expression()
            return Node(f"!{parenthesize(boolean(operand))}", "bool")
        return self.comparison()

    def comparison(self) -> Node:
        node = self.arithmetic()
        while True:
            token = self.peek()
            if token[0] == "op" and token[1] in ("==", "!=", "<", ">", "<=", ">="):
                self.take()
                right = self.arithmetic()
                node = compare(node, token[1], right)
            elif token == ("name", "in"):
                self.take()
                right = self.arithmetic()
                node = contains(right, node)
            elif token == ("name", "not") and self.peek(1) == ("name", "in"):
                self.take()
                self.take()
                right = self.arithmetic()
                node = Node(f"!{parenthesize(contains(right, node).js)}", "bool")
            elif token == ("name", "is"):
                self.take()
                negate = False
                if self.at("not", "name"):
                    self.take()
                    negate = True
                right = self.arithmetic()
                operator = "!=" if negate else "=="
                node = Node(f"{node.js} {operator} {right.js}" if right.kind == "none" else f"{node.js} {operator}= {right.js}", "bool")
            else:
                return node

    def arithmetic(self) -> Node:
        node = self.term()
        while self.peek()[0] == "op" and self.peek()[1] in ("+", "-"):
            operator = self.take()[1]
            right = self.term()
            if operator == "+" and (node.kind == "str" or right.kind == "str"):
                node = Node(f"{text(node)} + {text(right)}", "str")
            else:
                node = Node(f"{number(node)} {operator} {number(right)}", "num")
        return node

    def term(self) -> Node:
        node = self.unary()
        while self.peek()[0] == "op" and self.peek()[1] in ("*", "/", "%", "//"):
            operator = self.take()[1]
            right = self.unary()
            if operator == "//":
                node = Node(f"Math.floor({number(node)} / {number(right)})", "num")
            else:
                node = Node(f"{number(node)} {operator} {number(right)}", "num")
        return node

    def unary(self) -> Node:
        if self.at("-"):
            self.take()
            operand = self.unary()
            return Node(f"-{number(operand)}", "num")
        return self.postfix()

    def postfix(self) -> Node:
        node = self.atom()
        while True:
            if self.at("."):
                self.take()
                attribute = self.take("name")[1]
                if self.at("("):
                    self.take()
                    arguments = self.arguments(")")
                    node = method_call(node, attribute, arguments, self.text)
                else:
                    node = Node(f"{object_js(node)}.{attribute}", "any")
            elif self.at("["):
                self.take()
                index = self.or_expression()
                self.take("op", "]")
                node = Node(f"{object_js(node)}[{index.js}]", "any")
            elif self.at("(") and node.kind == "callable":
                self.take()
                arguments = self.arguments(")")
                node = function_call(node.js, arguments, self.text)
            else:
                return node

    def arguments(self, closing: str) -> list[Node]:
        values: list[Node] = []
        while not self.at(closing):
            values.append(self.or_expression())
            if self.at(","):
                self.take()
        self.take("op", closing)
        return values

    def atom(self) -> Node:
        kind, value = self.take()
        if kind == "base":
            assert self.base is not None
            return self.base
        if kind == "num":
            return Node(value, "num")
        if kind == "str":
            return self.string(value)
        if kind == "fstr":
            return self.format_string(value)
        if kind == "var":
            return self.robot_variable(value)
        if kind == "obj":
            return Node(self.generator.variable_reference(value), "obj")
        if kind == "name":
            if value == "True":
                return Node("true", "bool")
            if value == "False":
                return Node("false", "bool")
            if value == "None":
                return Node("null", "none")
            if value in PY_FUNCTIONS:
                return Node(value, "callable")
            raise ExpressionError(f"Unsupported name {value!r} in {self.text}")
        if kind == "op" and value == "(":
            node = self.or_expression()
            self.take("op", ")")
            return Node(f"({node.js})", node.kind)
        if kind == "op" and value == "[":
            items = self.arguments("]")
            return Node(f"[{', '.join(item.js for item in items)}]", "list")
        if kind == "op" and value == "{":
            if self.at("}"):
                self.take()
                return Node("{}", "dict")
            raise ExpressionError(f"Dictionary literals need an override: {self.text}")
        raise ExpressionError(f"Unexpected {value!r} in {self.text}")

    def robot_variable(self, token: str) -> Node:
        """A bare ${var}: its text is substituted into the Python code."""
        name_match = re.fullmatch(r"\$\{([^{}]+)\}((?:\[[^\]]*\])*)", token)
        if name_match:
            inner = name_match.group(1).strip()
            normalized = inner.replace(" ", "").replace("_", "").lower()
            if normalized in ("true", "false"):
                return Node(normalized, "bool")
            if normalized == "none":
                return Node("null", "none")
            if re.fullmatch(r"-?\d+(\.\d+)?", inner):
                return Node(inner, "num")
        js = self.generator.value(token)
        return Node(js, "robotvar")

    def string(self, content: str) -> Node:
        if "${" not in content:
            return Node(js_string(unescape(content)), "str")
        whole = re.fullmatch(r"\$\{([^{}]+)\}((?:\[[^\]]*\])*)", content)
        constants = {"empty": "", "none": "None", "true": "True", "false": "False"}
        if whole and not whole.group(2) and whole.group(1).replace(" ", "").replace("_", "").lower() in constants:
            # '${EMPTY}' is the text of a built-in constant
            return Node(js_string(constants[whole.group(1).replace(" ", "").replace("_", "").lower()]), "str")
        if whole:
            self.generator.robot_imports.add("str")
            return Node(f"str({self.generator.value(content)})", "str")
        return Node(self.generator.value(content), "str")

    def format_string(self, content: str) -> Node:
        match = re.fullmatch(r"\{(\$\{[^{}]+\}):\.(\d)f\}", content)
        if match:
            return Node(f"Number({self.generator.value(match.group(1))}).toFixed({match.group(2)})", "str")
        raise ExpressionError(f"Unsupported f-string f\"{content}\"")


def js_string(value: str) -> str:
    import json

    return json.dumps(value, ensure_ascii=False)


def unescape(value: str) -> str:
    return value.replace("\\'", "'").replace('\\"', '"')


def parenthesize(js: str) -> str:
    return js if re.fullmatch(r"[\w.$\[\]\"()!]+", js) and not js.startswith("!") else f"({js})"


def wrap_or(js: str) -> str:
    return f"({js})" if " || " in js else js


def boolean(node: Node) -> str:
    if node.kind == "bool":
        return node.js
    if node.kind == "robotvar":
        return f"isTruthy({node.js})"
    if node.kind == "none":
        return "false"
    return f"pyBool({node.js})"


def number(node: Node) -> str:
    if node.kind == "num":
        return node.js
    return f"Number({node.js})"


def text(node: Node) -> str:
    if node.kind == "str":
        return node.js
    return f"str({node.js})"


def object_js(node: Node) -> str:
    return node.js


def compare(left: Node, operator: str, right: Node) -> Node:
    js_operator = {"==": "===", "!=": "!=="}.get(operator, operator)
    if operator in ("<", ">", "<=", ">="):
        return Node(f"{number(left)} {operator} {number(right)}", "bool")
    if left.kind == "none" or right.kind == "none":
        other = right if left.kind == "none" else left
        return Node(f"{other.js} {'==' if operator == '==' else '!='} null", "bool")
    if left.kind == "num" or right.kind == "num":
        return Node(f"{number(left)} {js_operator} {number(right)}", "bool")
    if left.kind == "bool" or right.kind == "bool":
        other, literal = (right, left) if left.kind == "bool" else (left, right)
        if other.kind == "robotvar":
            return Node(f"str({other.js}) {js_operator} {js_string('True' if literal.js == 'true' else 'False')}", "bool")
        return Node(f"{other.js} {js_operator} {literal.js}", "bool")
    if left.kind == "obj" or right.kind == "obj":
        left_js = left.js if left.kind in ("obj", "str") else text(left)
        right_js = right.js if right.kind in ("obj", "str") else text(right)
        return Node(f"{left_js} {js_operator} {right_js}", "bool")
    return Node(f"{text(left)} {js_operator} {text(right)}", "bool")


def contains(container: Node, item: Node) -> Node:
    item_js = item.js if item.kind in ("str", "num", "obj", "bool") else f"str({item.js})"
    if container.kind == "str":
        return Node(f"{container.js}.includes({item_js})", "bool")
    return Node(f"{container.js}.includes({item_js})", "bool")


def method_call(node: Node, method: str, arguments: list[Node], source: str) -> Node:
    target = text(node) if node.kind in ("robotvar", "str") else node.js
    if method == "upper" and not arguments:
        return Node(f"{target}.toUpperCase()", "str")
    if method == "lower" and not arguments:
        return Node(f"{target}.toLowerCase()", "str")
    if method == "strip" and not arguments:
        return Node(f"{target}.trim()", "str")
    if method == "json" and not arguments:
        return Node(f"{node.js}.json()", "any")
    raise ExpressionError(f"Unsupported method .{method}() in {source}")


def function_call(function: str, arguments: list[Node], source: str) -> Node:
    if function == "len" and len(arguments) == 1:
        return Node(f"{arguments[0].js}.length", "num")
    if function == "int" and len(arguments) == 1:
        return Node(f"Number.parseInt(String({arguments[0].js}), 10)", "num")
    if function == "float" and len(arguments) == 1:
        return Node(f"Number({arguments[0].js})", "num")
    if function == "str" and len(arguments) == 1:
        return Node(text(arguments[0]), "str")
    raise ExpressionError(f"Unsupported call {function}() in {source}")


MODULE_CALLS = {
    r"random\.uniform\(\s*([\d.]+)\s*,\s*([\d.]+)\s*\)": lambda a, b: f"{a} + Math.random() * ({b} - {a})",
    r"time\.time\(\)": lambda: "Date.now() / 1000",
}


def module_calls(expression: str, generator: "Generator") -> str | None:
    """random.randint / random.uniform / time.time() based expressions."""
    randint = re.fullmatch(r"random\.randint\(\s*(.+?)\s*,\s*(.+?)\s*\)", expression)
    if randint:
        low = translate_number(randint.group(1), generator)
        high = translate_number(randint.group(2), generator)
        return f"Math.floor(Math.random() * ({high} - {low} + 1)) + {low}"
    uniform = re.fullmatch(r"random\.uniform\(\s*([\d.]+)\s*,\s*([\d.]+)\s*\)", expression)
    if uniform:
        # 1.0 -> 1 (unicorn no-zero-fractions)
        low, high = (re.sub(r"\.0+$", "", value) for value in (uniform.group(1), uniform.group(2)))
        return f"{low} + Math.random() * ({high} - {low})"
    time_expression = re.fullmatch(r"time\.time\(\)(\s*\+\s*(.+))?", expression)
    if time_expression:
        if time_expression.group(2) is None:
            return "Date.now() / 1000"
        return f"Date.now() / 1000 + {translate_number(time_expression.group(2), generator)}"
    return None


def translate_evaluate(expression: str, generator: "Generator") -> str:
    expression = expression.strip()
    if expression in OVERRIDES:
        return OVERRIDES[expression](generator)
    for prefix, override in PREFIX_OVERRIDES.items():
        if expression.startswith(prefix):
            return override(generator)
    special = module_calls(expression, generator)
    if special is not None:
        return special
    return Parser(expression, generator).parse().js


def translate_condition(expression: str, generator: "Generator") -> str:
    expression = expression.strip()
    if expression in OVERRIDES:
        return OVERRIDES[expression](generator)
    node = Parser(expression, generator).parse()
    generator.robot_imports.update({"isTruthy"} if "isTruthy(" in boolean(node) else set())
    generator.robot_imports.update({"pyBool"} if "pyBool(" in boolean(node) else set())
    result = boolean(node)
    for helper in ("isTruthy", "pyBool", "str"):
        if f"{helper}(" in result:
            generator.robot_imports.add(helper)
    return result


def translate_number(expression: str, generator: "Generator") -> str:
    node = Parser(expression.strip(), generator).parse()
    result = number(node)
    if "str(" in result:
        generator.robot_imports.add("str")
    return result


def translate_inline(expression: str, generator: "Generator") -> str:
    """${{ python }} inline evaluation."""
    return translate_evaluate(expression, generator)


def translate_extended(base_js: str, rest: str, generator: "Generator") -> str:
    """Extended variable syntax: ${response.status_code}, ${cards[${index}]}, ${dayIdx + 2}."""
    node = Parser("__BASE__" + rest, generator, base=Node(base_js, "obj")).parse()
    return node.js if node.kind != "num" or not re.search(r"[+\-*/%]", rest) else f"({node.js})"
