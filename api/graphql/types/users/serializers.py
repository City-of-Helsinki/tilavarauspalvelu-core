from api.graphql.extensions.legacy_helpers import OldChoiceCharField, OldPrimaryKeyUpdateSerializer
from users.models import ReservationNotification, User


class UserUpdateSerializer(OldPrimaryKeyUpdateSerializer):
    reservation_notification = OldChoiceCharField(
        default=ReservationNotification.NONE,
        choices=ReservationNotification.choices,
        help_text=(
            "When reservation notification emails are sent. Possible values are: "
            f"{', '.join(value.upper() for value in ReservationNotification)}."
        ),
    )

    class Meta:
        model = User
        fields = ["pk", "reservation_notification"]
