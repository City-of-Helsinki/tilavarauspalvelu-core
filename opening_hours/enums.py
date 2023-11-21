from types import DynamicClassAttribute

from django.utils.translation import pgettext_lazy
from enumfields import Enum


class HaukiResourceState(Enum):
    OPEN = "open"
    CLOSED = "closed"
    UNDEFINED = "undefined"
    SELF_SERVICE = "self_service"
    WITH_KEY = "with_key"
    WITH_RESERVATION = "with_reservation"
    OPEN_AND_RESERVABLE = "open_and_reservable"
    WITH_KEY_AND_RESERVATION = "with_key_and_reservation"
    ENTER_ONLY = "enter_only"
    EXIT_ONLY = "exit_only"
    WEATHER_PERMITTING = "weather_permitting"
    NOT_IN_USE = "not_in_use"
    MAINTENANCE = "maintenance"

    class Labels:
        OPEN = pgettext_lazy("HaukiResourceState", "Open")
        CLOSED = pgettext_lazy("HaukiResourceState", "Closed")
        UNDEFINED = pgettext_lazy("HaukiResourceState", "Undefined")
        SELF_SERVICE = pgettext_lazy("HaukiResourceState", "Self service")
        WITH_KEY = pgettext_lazy("HaukiResourceState", "With key")
        WITH_RESERVATION = pgettext_lazy("HaukiResourceState", "With reservation")
        OPEN_AND_RESERVABLE = pgettext_lazy("HaukiResourceState", "Open and reservable")
        WITH_KEY_AND_RESERVATION = pgettext_lazy("HaukiResourceState", "With key and reservation")
        ENTER_ONLY = pgettext_lazy("HaukiResourceState", "Enter only")
        EXIT_ONLY = pgettext_lazy("HaukiResourceState", "Exit only")
        WEATHER_PERMITTING = pgettext_lazy("HaukiResourceState", "Weather permitting")
        NOT_IN_USE = pgettext_lazy("HaukiResourceState", "Not in use")
        MAINTENANCE = pgettext_lazy("HaukiResourceState", "Maintenance")

    @classmethod
    def accessible_states(cls):
        """
        States indicating the space can be accessed in some way,
        whether the access is restricted (e.g. via key or reservation)
        or not.
        """
        return [
            cls.ENTER_ONLY,
            cls.OPEN,
            cls.OPEN_AND_RESERVABLE,
            cls.SELF_SERVICE,
            cls.WITH_KEY,
            cls.WITH_KEY_AND_RESERVATION,
            cls.WITH_RESERVATION,
        ]

    @classmethod
    def reservable_states(cls):
        """States indicating the space can be reserved in some way."""
        return [
            cls.OPEN_AND_RESERVABLE,
            cls.WITH_KEY_AND_RESERVATION,
            cls.WITH_RESERVATION,
        ]

    @classmethod
    def closed_states(cls):
        """States indicating the space is closed and inaccessible."""
        return [
            None,
            cls.CLOSED,
            cls.MAINTENANCE,
            cls.NOT_IN_USE,
            cls.UNDEFINED,
        ]

    @DynamicClassAttribute
    def is_accessible(self) -> bool:
        return self in HaukiResourceState.accessible_states()

    @DynamicClassAttribute
    def is_reservable(self) -> bool:
        return self in HaukiResourceState.reservable_states()

    @DynamicClassAttribute
    def is_closed(self) -> bool:
        return self in HaukiResourceState.closed_states()

    @classmethod
    def get(cls, state):
        try:
            return HaukiResourceState(state)
        except ValueError:
            return HaukiResourceState.UNDEFINED
