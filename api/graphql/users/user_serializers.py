from api.graphql.base_serializers import PrimaryKeyUpdateSerializer
from api.graphql.choice_fields import ChoiceCharField
from api.users_api import UserSerializer
from users.models import ReservationNotification


class UserUpdateSerializer(PrimaryKeyUpdateSerializer):

    reservation_notification = ChoiceCharField(
        default=ReservationNotification.NONE,
        choices=ReservationNotification.choices,
        help_text=(
            "When reservation notification emails are sent. Possible values are: "
            f"{', '.join(value.upper() for value in ReservationNotification)}."
        ),
    )

    class Meta(UserSerializer.Meta):
        fields = ["pk", "reservation_notification"]
