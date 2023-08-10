from types import DynamicClassAttribute

from django.utils.translation import pgettext_lazy
from enumfields import Enum


class State(Enum):
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
        OPEN = pgettext_lazy("State", "Open")
        CLOSED = pgettext_lazy("State", "Closed")
        UNDEFINED = pgettext_lazy("State", "Undefined")
        SELF_SERVICE = pgettext_lazy("State", "Self service")
        WITH_KEY = pgettext_lazy("State", "With key")
        WITH_RESERVATION = pgettext_lazy("State", "With reservation")
        OPEN_AND_RESERVABLE = pgettext_lazy("State", "Open and reservable")
        WITH_KEY_AND_RESERVATION = pgettext_lazy("State", "With key and reservation")
        ENTER_ONLY = pgettext_lazy("State", "Enter only")
        EXIT_ONLY = pgettext_lazy("State", "Exit only")
        WEATHER_PERMITTING = pgettext_lazy("State", "Weather permitting")
        NOT_IN_USE = pgettext_lazy("State", "Not in use")
        MAINTENANCE = pgettext_lazy("State", "Maintenance")

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
        """
        States indicating the space can be reserved in some way.
        """
        return [
            cls.OPEN_AND_RESERVABLE,
            cls.WITH_KEY_AND_RESERVATION,
            cls.WITH_RESERVATION,
        ]

    @classmethod
    def closed_states(cls):
        """
        States indicating the space is closed and inaccessible.
        """
        return [
            None,
            cls.CLOSED,
            cls.MAINTENANCE,
            cls.NOT_IN_USE,
            cls.UNDEFINED,
        ]

    @DynamicClassAttribute
    def is_accessible(self) -> bool:
        return self in State.accessible_states()

    @DynamicClassAttribute
    def is_reservable(self) -> bool:
        return self in State.reservable_states()

    @DynamicClassAttribute
    def is_closed(self) -> bool:
        return self in State.closed_states()

    @classmethod
    def get(cls, state):
        try:
            return State(state)
        except ValueError:
            return State.UNDEFINED


class Weekday(Enum):
    MONDAY = 1
    TUESDAY = 2
    WEDNESDAY = 3
    THURSDAY = 4
    FRIDAY = 5
    SATURDAY = 6
    SUNDAY = 7

    class Labels:
        MONDAY = pgettext_lazy("Weekday", "Monday")
        TUESDAY = pgettext_lazy("Weekday", "Tuesday")
        WEDNESDAY = pgettext_lazy("Weekday", "Wednesday")
        THURSDAY = pgettext_lazy("Weekday", "Thursday")
        FRIDAY = pgettext_lazy("Weekday", "Friday")
        SATURDAY = pgettext_lazy("Weekday", "Saturday")
        SUNDAY = pgettext_lazy("Weekday", "Sunday")

    @classmethod
    def business_days(cls):
        return [cls.MONDAY, cls.TUESDAY, cls.WEDNESDAY, cls.THURSDAY, cls.FRIDAY]

    @classmethod
    def weekend(cls):
        return [cls.SATURDAY, cls.SUNDAY]

    @classmethod
    def from_iso_weekday(cls, iso_weekday_num):
        for member in cls.__members__.values():
            if member.value == iso_weekday_num:
                return member


class ResourceType(Enum):
    UNIT = "unit"
    SUBSECTION = "section"
    SPECIAL_GROUP = "special_group"
    CONTACT = "contact"
    ONLINE_SERVICE = "online_service"
    SERVICE = "service"
    SERVICE_CHANNEL = "service_channel"
    SERVICE_AT_UNIT = "service_at_unit"
    RESERVABLE = "reservable"
    BUILDING = "building"
    AREA = "area"
    ENTRANCE = "entrance_or_exit"
