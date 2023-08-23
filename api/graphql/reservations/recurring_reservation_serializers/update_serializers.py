from api.graphql.base_serializers import PrimaryKeyUpdateSerializer
from api.graphql.reservations.recurring_reservation_serializers.create_serializers import (
    RecurringReservationCreateSerializer,
)


class RecurringReservationUpdateSerializer(PrimaryKeyUpdateSerializer, RecurringReservationCreateSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields["user"].readonly = True
        self.fields["name"].required = False
        self.fields["description"].required = False
        self.fields["recurrence_in_days"].required = False
        self.fields["begin_time"].required = False
        self.fields["end_time"].required = False
        self.fields["begin_date"].required = False
        self.fields["end_date"].required = False
        self.fields["weekdays"].required = False
        self.fields["ability_group_pk"].required = False
        self.fields["age_group_pk"].required = False
        self.fields.pop("reservation_unit_pk")
