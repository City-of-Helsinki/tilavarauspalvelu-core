import base64
import datetime
import json
from inspect import cleandoc
from typing import Any, Required, TypedDict

from graphql import GraphQLArgument, GraphQLArgumentMap, GraphQLInt, GraphQLString
from undine import GQLInfo, QueryType
from undine.converters import convert_to_graphql_argument_map, convert_to_graphql_type
from undine.relay import Connection, PaginationHandler
from undine.utils.graphql.utils import get_arguments

from tilavarauspalvelu.models import User
from tilavarauspalvelu.models.reservation_unit.queryset import ReservationUnitQuerySet
from tilavarauspalvelu.services.first_reservable_time.first_reservable_time_helper import FirstReservableTimeHelper

__all__ = [
    "ReservationConnection",
]


class ReservationUnitFilterData(TypedDict, total=False):
    """Filter arguments for calculating first reservable time for reservation units."""

    reservable_date_start: datetime.date
    reservable_date_end: datetime.date
    reservable_time_start: datetime.time
    reservable_time_end: datetime.time
    reservable_minimum_duration_minutes: int
    show_only_reservable: Required[bool]


class ReservationConnection(Connection):
    """
    Connection for reservation units that adds first reservable time calculation to the queryset.
    Only usable for Entrypoints.
    """

    def __init__(self, query_type: type[QueryType]) -> None:
        super().__init__(query_type, pagination_handler=ReservationUnitPagination)


class ReservationUnitPagination(PaginationHandler):
    """
    Special handler for calculating first reservable time for reservation units.
    Only usable for Entrypoints Connections.
    """

    def paginate_queryset(
        self,
        queryset: ReservationUnitQuerySet,
        info: GQLInfo[User],
    ) -> ReservationUnitQuerySet:
        self.calculate_pagination_arguments(queryset, info)

        args = get_arguments(info)

        frt_data: ReservationUnitFilterData | None = args.get("first_reservable_time")
        if frt_data is not None:
            cache_key = self.calculate_cache_key(args)
            queryset = self.calculate_first_reservable_time(queryset, frt_data, cache_key=cache_key)

        return self.apply_pagination(queryset, info)  # type: ignore[return-value]

    def calculate_cache_key(self, data: dict[str, Any]) -> str:
        # Pagination does not affect the calculated results.
        unaffecting = {"first", "last", "offset", "after", "before"}
        args = sorted(
            f"{key}={json.dumps(value, sort_keys=True, default=str)}"
            for key, value in data.items()
            if key not in unaffecting
        )
        return base64.b64encode(",".join(args).encode()).decode()

    def calculate_first_reservable_time(
        self,
        queryset: ReservationUnitQuerySet,
        data: ReservationUnitFilterData,
        *,
        cache_key: str,
    ) -> ReservationUnitQuerySet:
        show_only_reservable = data.get("show_only_reservable", False)

        helper = FirstReservableTimeHelper(
            reservation_unit_queryset=queryset,
            filter_date_start=data.get("reservable_date_start"),
            filter_date_end=data.get("reservable_date_end"),
            filter_time_start=data.get("reservable_time_start"),
            filter_time_end=data.get("reservable_time_end"),
            minimum_duration_minutes=data.get("reservable_minimum_duration_minutes"),
            show_only_reservable=show_only_reservable,
            start=self.start,
            stop=self.stop,
            cache_key=cache_key,
        )
        helper.calculate_all_first_reservable_times()
        queryset = helper.get_annotated_queryset()

        if not show_only_reservable:
            return queryset

        return queryset.exclude(first_reservable_datetime=None)


@convert_to_graphql_argument_map.register
def _(ref: ReservationConnection, **kwargs: Any) -> GraphQLArgumentMap:
    kwargs["many"] = True
    arguments = convert_to_graphql_argument_map(ref.query_type, **kwargs)

    frt_input_type = convert_to_graphql_type(ReservationUnitFilterData, is_input=True)

    return {
        "after": GraphQLArgument(
            GraphQLString,
            description="Only return items in the connection that come after this cursor.",
            out_name="after",
        ),
        "before": GraphQLArgument(
            GraphQLString,
            description="Only return items in the connection that come before this cursor.",
            out_name="before",
        ),
        "first": GraphQLArgument(
            GraphQLInt,
            description="Number of items to return from the start.",
            out_name="first",
        ),
        "last": GraphQLArgument(
            GraphQLInt,
            description="Number of items to return from the end (after evaluating first).",
            out_name="last",
        ),
        "offset": GraphQLArgument(
            GraphQLInt,
            description="Number of items to skip from the start.",
            out_name="offset",
        ),
        "firstReservableTime": GraphQLArgument(
            frt_input_type,
            description=cleandoc(
                """
                Filter reservation units by their reservability.

                If 'showOnlyReservable' is True, then only reservation units,
                which are reservable with the given filters are returned.
                Otherwise, all reservation units are returned.
                """
            ),
            out_name="first_reservable_time",
        ),
        **arguments,
    }
