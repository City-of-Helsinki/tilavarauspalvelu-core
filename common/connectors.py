from django.db import models

__all__ = [
    "ApplicationActionsConnector",
    "ApplicationSectionActionsConnector",
    "ApplicationRoundActionsConnector",
    "ReservationUnitActionsConnector",
    "ReservationActionsConnector",
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


class ApplicationSectionActionsConnector:
    def __get__(self, instance, _):
        _raise_if_accessed_on_class(instance)
        from actions.application_section import ApplicationSectionActions

        return ApplicationSectionActions(instance)


class SuitableTimeRangeActionsConnector:
    def __get__(self, instance, _):
        _raise_if_accessed_on_class(instance)
        from actions.suitable_time_range import SuitableTimeRangeActions

        return SuitableTimeRangeActions(instance)


class AllocatedTimeSlotActionsConnector:
    def __get__(self, instance, _):
        _raise_if_accessed_on_class(instance)
        from actions.allocated_time_slot import AllocatedTimeSlotActions

        return AllocatedTimeSlotActions(instance)


class ApplicationRoundActionsConnector:
    def __get__(self, instance, _):
        _raise_if_accessed_on_class(instance)
        from actions.application_round import ApplicationRoundActions

        return ApplicationRoundActions(instance)


class ReservationUnitOptionActionsConnector:
    def __get__(self, instance, _):
        _raise_if_accessed_on_class(instance)
        from actions.reservation_unit_option import ReservationUnitOptionActions

        return ReservationUnitOptionActions(instance)


class ReservationUnitActionsConnector:
    def __get__(self, instance, _):
        _raise_if_accessed_on_class(instance)
        from actions.reservation_unit import ReservationUnitActions

        return ReservationUnitActions(instance)


class ReservationActionsConnector:
    def __get__(self, instance, _):
        _raise_if_accessed_on_class(instance)
        from actions.reservation import ReservationActions

        return ReservationActions(instance)
