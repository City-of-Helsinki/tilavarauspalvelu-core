from datetime import datetime

from django.db.models import Q
from django.utils.timezone import get_default_timezone
from elasticsearch_django.models import SearchResultsQuerySet

DEFAULT_TIMEZONE = get_default_timezone()


class ReservationUnitQuerySet(SearchResultsQuerySet):
    def scheduled_for_publishing(self):
        now = datetime.now(tz=DEFAULT_TIMEZONE)
        return self.filter(
            Q(is_archived=False, is_draft=False)
            & (
                Q(publish_begins__isnull=False, publish_begins__gt=now)
                | Q(publish_ends__isnull=False, publish_ends__lte=now)
            )
        )
