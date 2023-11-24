from django.db import models

__all__ = [
    "ApplicationActionsConnector",
    "ApplicationEventActionsConnector",
    "ApplicationEventScheduleActionsConnector",
    "ApplicationRoundActionsConnector",
    "ReservationUnitActionsConnector",
]


def _raise_if_accessed_on_class(instance: models.Model | None) -> None:
    if instance is None:
        raise AttributeError("Cannot access actions from model class.")


# Connectors are descriptors that allow model "actions" (= methods that modify data) to be accessed
# from a model instance without causing import loops between different models needed for those actions.
# This also helps keep the actual model class smaller and thus easier to read.
#
# There is a bit of repetition in the connectors, but it is/seems necessary to for better autocomplete.


class ApplicationActionsConnector:
    def __get__(self, instance, _):
        _raise_if_accessed_on_class(instance)
        from actions.application import ApplicationActions

        return ApplicationActions(instance)


class ApplicationEventActionsConnector:
    def __get__(self, instance, _):
        _raise_if_accessed_on_class(instance)
        from actions.application_event import ApplicationEventActions

        return ApplicationEventActions(instance)


class ApplicationEventScheduleActionsConnector:
    def __get__(self, instance, _):
        _raise_if_accessed_on_class(instance)
        from actions.application_event_schedule import ApplicationEventScheduleActions

        return ApplicationEventScheduleActions(instance)


class ApplicationRoundActionsConnector:
    def __get__(self, instance, _):
        _raise_if_accessed_on_class(instance)
        from actions.application_round import ApplicationRoundActions

        return ApplicationRoundActions(instance)


class ReservationUnitActionsConnector:
    def __get__(self, instance, _):
        _raise_if_accessed_on_class(instance)
        from actions.reservation_unit import ReservationUnitActions

        return ReservationUnitActions(instance)
