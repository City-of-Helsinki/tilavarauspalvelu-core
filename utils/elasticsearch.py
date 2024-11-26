from __future__ import annotations

__all__ = [
    "build_elastic_query_str",
    "parse_search_words",
]


def _clean_split(text: str, delimiter: str) -> list[str]:
    """Split text by delimiter and remove empty strings."""
    return [w.strip() for w in text.split(delimiter) if w.strip()]


def build_elastic_query_str(search_words: str) -> str:
    """Search parameters are split with comma and should be treated as separate searches => OR."""
    comma_split_values = _clean_split(search_words, ",")

    all_or_query_strings: list[str] = []
    for term in comma_split_values:
        words = _clean_split(term, " ")
        query_str = parse_search_words(words)
        all_or_query_strings.append(query_str)

    return " OR ".join(all_or_query_strings)


def parse_search_words(words: list[str]) -> str:
    """
    Search words are split with spaces and should be treated as the same search => AND.

    The first word should begin with asterisk, and the last word should end with asterisk.
    If there are multiple words, they should all be wrapped in parentheses.

    Examples:
        >>> parse_search_words(["Word"])
        >>> "(*Word*)"

        >>> parse_search_words(["First", "Last"])
        >>> "((*First) AND (Last*))"

        >>> parse_search_words(["First", "Middle", "Last"])
        >>> "((*First) AND (Middle) AND (Last*))"
    """
    if len(words) == 1:
        return f"(*{words[0]}*)"

    all_and_query_strings: list[str] = []
    for i, word in enumerate(words):
        if i == 0:
            # Add asterisk to the first word
            all_and_query_strings.append(f"(*{word})")
        elif i == len(words) - 1:
            # Add asterisk to the last word
            all_and_query_strings.append(f"({word}*)")
        else:
            all_and_query_strings.append(f"({word})")

    query_str = " AND ".join(all_and_query_strings)
    return f"({query_str})"
