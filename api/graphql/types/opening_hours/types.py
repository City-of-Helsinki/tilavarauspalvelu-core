import datetime

import graphene
from django.utils import timezone

from common.typing import GQLInfo
from reservation_units.models import ReservationUnit
from spaces.models import Unit

DEFAULT_TIMEZONE = timezone.get_default_timezone()


class ReservableTimeSpanType(graphene.ObjectType):
    start_datetime = graphene.DateTime()
    end_datetime = graphene.DateTime()

    def resolve_start_datetime(self, info: GQLInfo):
        return self.start_datetime

    def resolve_end_datetime(self, info: GQLInfo):
        return self.end_datetime


class ReservableTimeSpansGraphQLMixin:
    reservable_time_spans = graphene.List(
        ReservableTimeSpanType,
        start_date=graphene.Date(),
        end_date=graphene.Date(),
    )

    def resolve_reservable_time_spans(
        self: ReservationUnit | Unit,
        info,
        start_date: datetime.date | None = None,
        end_date: datetime.date | None = None,
    ) -> list[ReservableTimeSpanType] | None:
        # All parameters are required to get reservable time spans
        if not (start_date and end_date):
            return None

        origin_hauki_resource = self.origin_hauki_resource

        if not origin_hauki_resource:
            return None

        time_span_qs = origin_hauki_resource.reservable_time_spans.filter_period(start=start_date, end=end_date)
        return [
            ReservableTimeSpanType(
                start_datetime=time_span.start_datetime.astimezone(DEFAULT_TIMEZONE),
                end_datetime=time_span.end_datetime.astimezone(DEFAULT_TIMEZONE),
            )
            for time_span in time_span_qs
        ]
