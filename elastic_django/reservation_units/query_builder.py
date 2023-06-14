class ReservationUnitQueryBuilderMixin:
    """Contains method for building an elasticsearch query for reservation_units index."""

    @classmethod
    def build_elastic_query_str(cls, search_words):
        """Search parameters are split with comma and should be treated as separate searches => OR."""

        values = [w.strip() for w in search_words.split(",")]

        words = values[0].split(" ")
        query_str = cls.parse_search_words(words)

        for term in values[1:]:
            query_str += " OR "
            words = term.strip().split(" ")
            query_str += cls.parse_search_words(words)

        return query_str.strip()

    @classmethod
    def parse_search_words(cls, words):
        if len(words) == 1:
            q_str = f"(*{words[0].strip()}*)"

            return q_str

        q_str = f"((*{words[0].strip()}) "

        for w in words[1 : len(words) - 1]:  # noqa: E203
            w.strip()
            q_str += f"AND ({w}) "

        q_str += f"AND ({words[len(words) - 1].strip()}*))"

        return q_str
