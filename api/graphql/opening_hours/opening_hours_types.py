import graphene
from django.conf import settings

from opening_hours.utils.opening_hours_client import OpeningHoursClient


class TimeSpanType(graphene.ObjectType):
    start_time = graphene.Time()
    end_time = graphene.Time()
    weekdays = graphene.List(graphene.Int)
    resource_state = graphene.String()
    end_time_on_next_day = graphene.Boolean()
    name_fi = graphene.String()
    name_en = graphene.String()
    name_sv = graphene.String()
    description_fi = graphene.String()
    description_en = graphene.String()
    description_sv = graphene.String()


class PeriodType(graphene.ObjectType):
    period_id = graphene.Int()
    start_date = graphene.Date()
    end_date = graphene.Date()
    resource_state = graphene.String()
    time_spans = graphene.List(TimeSpanType)
    name_fi = graphene.String()
    name_en = graphene.String()
    name_sv = graphene.String()
    description_fi = graphene.String()
    description_en = graphene.String()
    description_sv = graphene.String()


class OpeningTimesType(graphene.ObjectType):
    date = graphene.Date()
    start_time = graphene.Time()
    end_time = graphene.Time()
    state = graphene.String()
    periods = graphene.List(graphene.Int)

    def resolve_date(self, info):
        return self.date

    def resolve_start_time(self, info):
        return self.start_time

    def resolve_end_Time(self, info):
        return self.end_time

    def resolve_periods(self, info, **kwargs):
        return self.periods


class OpeningHoursType(graphene.ObjectType):
    opening_times = graphene.List(OpeningTimesType)
    opening_time_periods = graphene.List(PeriodType)


class OpeningHoursMixin:
    hauki_origin_id = settings.HAUKI_ORIGIN_ID

    opening_hours = graphene.Field(
        OpeningHoursType,
        opening_times=graphene.Boolean(),
        periods=graphene.Boolean(),
        start_date=graphene.Date(),
        end_date=graphene.Date(),
    )

    def resolve_opening_hours(self, info, **kwargs):
        start = kwargs.get("start_date")
        end = kwargs.get("end_date")
        init_periods = kwargs.get("periods", False)
        init_times = kwargs.get("opening_times", False)
        if not (start and end):
            init_times = False

        opening_hours_client = OpeningHoursClient(
            self.hauki_resource_origin_id,
            start,
            end,
            single=True,
            init_periods=init_periods,
            init_opening_hours=init_times,
            hauki_origin_id=self.hauki_resource_data_source_id,
        )
        return_object = OpeningHoursType()

        if init_times:
            hours = opening_hours_client.get_opening_hours_for_date_range(
                str(self.hauki_resource_origin_id), start, end
            )
            opening_hours = []
            for date, times in hours.items():
                for time in times:
                    oh = OpeningTimesType(
                        date=date,
                        start_time=time.start_time.time(),
                        end_time=time.end_time.time(),
                        state=time.resource_state,
                        periods=time.periods,
                    )
                    opening_hours.append(oh)
            return_object.opening_times = opening_hours

        if init_periods:
            periods = []
            for period in opening_hours_client.get_resource_periods(
                str(self.hauki_resource_origin_id)
            ):
                time_spans = []
                for time_span in period.time_spans:
                    time_spans.append(
                        TimeSpanType(
                            start_time=time_span.start_time,
                            end_time=time_span.end_time,
                            resource_state=time_span.resource_state,
                            weekdays=time_span.weekdays,
                            name_fi=time_span.name.get("fi"),
                            name_sv=time_span.name.get("sv"),
                            name_en=time_span.name.get("en"),
                            description_fi=time_span.description.get("fi"),
                            description_sv=time_span.description.get("sv"),
                            description_en=time_span.description.get("en"),
                        )
                    )
                periods.append(
                    PeriodType(
                        period_id=period.id,
                        start_date=period.start_date,
                        end_date=period.end_date,
                        time_spans=time_spans,
                        name_fi=period.name.get("fi"),
                        name_sv=period.name.get("sv"),
                        name_en=period.name.get("en"),
                        description_fi=period.description.get("fi"),
                        description_sv=period.description.get("sv"),
                        description_en=period.description.get("en"),
                    )
                )
            return_object.opening_time_periods = periods

        return return_object
