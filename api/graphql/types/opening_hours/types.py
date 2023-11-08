import graphene
from django.conf import settings
from django.utils import timezone

from opening_hours.enums import State as ResourceState
from opening_hours.utils.opening_hours_client import OpeningHoursClient
from reservation_units.models import ReservationUnit
from spaces.models import Unit

DEFAULT_TIMEZONE = timezone.get_default_timezone()


class OpeningTimesType(graphene.ObjectType):
    date = graphene.Date()
    start_time = graphene.DateTime()
    end_time = graphene.DateTime()
    state = graphene.String()
    is_reservable = graphene.Boolean()

    def resolve_date(self, info):
        return self.date

    def resolve_start_time(self, info):
        if not self.start_time:
            return None

        return self.start_time

    def resolve_end_time(self, info):
        if not self.end_time:
            return None

        return self.end_time

    def resolve_is_reservable(self, info, **kwargs):
        return self.is_reservable


class OpeningHoursType(graphene.ObjectType):
    opening_times = graphene.List(OpeningTimesType)


class OpeningHoursMixin:
    hauki_origin_id = settings.HAUKI_ORIGIN_ID

    opening_hours = graphene.Field(
        OpeningHoursType,
        opening_times=graphene.Boolean(),
        start_date=graphene.Date(),
        end_date=graphene.Date(),
    )

    def resolve_opening_hours(self: ReservationUnit | Unit, *_, **kwargs):
        init_times = kwargs.get("opening_times", False)
        start_date = kwargs.get("start_date")
        end_date = kwargs.get("end_date")

        if not (start_date and end_date):
            init_times = False

        opening_hours_client = OpeningHoursClient(
            resources=self.hauki_resource_origin_id,
            start_date=start_date,
            end_date=end_date,
            init_opening_hours=init_times,
            hauki_origin_id=self.hauki_resource_data_source_id,
        )
        return_object = OpeningHoursType()

        if init_times:
            hours = opening_hours_client.get_opening_hours_for_date_range(
                str(self.hauki_resource_origin_id), start_date, end_date
            )
            opening_hours = []
            for date, times in hours.items():
                for time in times:
                    oh = OpeningTimesType(
                        date=date,
                        start_time=time.start_time,
                        end_time=time.end_time,
                        state=time.resource_state,
                        is_reservable=ResourceState(time.resource_state) in ResourceState.reservable_states(),
                    )
                    opening_hours.append(oh)
            return_object.opening_times = opening_hours

        return return_object
