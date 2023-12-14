import math
from datetime import date, timedelta

from django.db.models import DurationField, F, OuterRef
from django.db.models.functions import Coalesce

from common.db import SubquerySum
from opening_hours.models import OriginHaukiResource, ReservableTimeSpan


def get_resources_total_hours_per_resource(
    hauki_resource_ids: list[int],
    period_start_date: date,
    period_end_date: date,
) -> dict[str, int]:
    origin_hauki_resources = OriginHaukiResource.objects.filter(id__in=hauki_resource_ids).annotate(
        duration=Coalesce(
            SubquerySum(
                ReservableTimeSpan.objects.filter(resource_id=OuterRef("id"))
                .truncated_start_and_end_datetimes_for_period(start=period_start_date, end=period_end_date)
                .annotate(duration=F("truncated_end_datetime") - F("truncated_start_datetime"))
                .values("duration"),
                sum_field="duration",
                output_field=DurationField(),
            ),
            timedelta(),
        ),
    )

    return {resource.id: math.floor(resource.duration.total_seconds() / 3600) for resource in origin_hauki_resources}
