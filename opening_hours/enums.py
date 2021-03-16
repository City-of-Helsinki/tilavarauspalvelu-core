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

    @classmethod
    def open_states(cls):
        return [
            cls.OPEN,
            cls.SELF_SERVICE,
            cls.WITH_KEY,
            cls.WITH_RESERVATION,
            cls.WITH_KEY_AND_RESERVATION,
            cls.ENTER_ONLY,
        ]


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


class RuleContext(Enum):
    PERIOD = "period"
    YEAR = "year"
    MONTH = "month"
    # WEEK = "week"

    class Labels:
        PERIOD = pgettext_lazy("RuleContext", "Period")
        YEAR = pgettext_lazy("RuleContext", "Year")
        MONTH = pgettext_lazy("RuleContext", "Month")
        # WEEK = pgettext_lazy("RuleContext", "Week")


class RuleSubject(Enum):
    DAY = "day"
    WEEK = "week"
    MONTH = "month"
    MONDAY = "mon"
    TUESDAY = "tue"
    WEDNESDAY = "wed"
    THURSDAY = "thu"
    FRIDAY = "fri"
    SATURDAY = "sat"
    SUNDAY = "sun"

    class Labels:
        DAY = pgettext_lazy("RuleSubject", "Day")
        WEEK = pgettext_lazy("RuleSubject", "Week")
        MONTH = pgettext_lazy("RuleSubject", "Month")
        MONDAY = pgettext_lazy("RuleSubject", "Monday")
        TUESDAY = pgettext_lazy("RuleSubject", "Tuesday")
        WEDNESDAY = pgettext_lazy("RuleSubject", "Wednesday")
        THURSDAY = pgettext_lazy("RuleSubject", "Thursday")
        FRIDAY = pgettext_lazy("RuleSubject", "Friday")
        SATURDAY = pgettext_lazy("RuleSubject", "Saturday")
        SUNDAY = pgettext_lazy("RuleSubject", "Sunday")

    def is_singular(self):
        return self in [
            self.DAY,
            self.MONDAY,
            self.TUESDAY,
            self.WEDNESDAY,
            self.THURSDAY,
            self.FRIDAY,
            self.SATURDAY,
            self.SUNDAY,
        ]

    @classmethod
    def weekday_subjects(cls):
        return [
            cls.MONDAY,
            cls.TUESDAY,
            cls.WEDNESDAY,
            cls.THURSDAY,
            cls.FRIDAY,
            cls.SATURDAY,
            cls.SUNDAY,
        ]

    def as_isoweekday(self):
        if self not in self.weekday_subjects():
            return None

        return self.weekday_subjects().index(self) + 1

    def as_weekday(self):
        if self not in self.weekday_subjects():
            return None

        return self.weekday_subjects().index(self)


class FrequencyModifier(Enum):
    EVEN = "even"
    ODD = "odd"

    class Labels:
        EVEN = pgettext_lazy("FrequencyModifier", "Even")
        ODD = pgettext_lazy("FrequencyModifier", "Odd")
