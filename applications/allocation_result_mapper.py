import logging

from allocation.allocation_solver import AllocatedEvent
from applications.models import (
    ApplicationEventSchedule,
    ApplicationEventScheduleResult,
    ApplicationEventStatus,
    ApplicationRound,
)

logger = logging.getLogger(__name__)


class AllocationResultMapper(object):
    def __init__(
        self, allocated_events: [AllocatedEvent], application_round: ApplicationRound
    ):
        self.allocated_events = allocated_events
        self.application_round = application_round

    def to_events(self):
        ApplicationEventScheduleResult.objects.filter(
            accepted=False,
            application_event_schedule__application_event__application__application_round=self.application_round,
            # noqa: E501
        ).delete()
        for allocated_event in self.allocated_events:
            try:
                application_event_schedule = ApplicationEventSchedule.objects.get(
                    pk=allocated_event.occurrence_id
                )

                ApplicationEventScheduleResult.objects.create(
                    application_event_schedule=application_event_schedule,
                    accepted=False,
                    allocated_reservation_unit_id=allocated_event.space_id,
                    allocated_duration=allocated_event.duration,
                    allocated_begin=allocated_event.begin,
                    allocated_end=allocated_event.end,
                    allocated_day=application_event_schedule.day,
                    basket_id=allocated_event.basket_id,
                )

                ApplicationEventStatus.objects.create(
                    status=ApplicationEventStatus.ALLOCATED,
                    application_event=application_event_schedule.application_event,
                )
            except Exception:
                logger.exception(
                    "AllocationResultMapper: error occurred while creating event schedule results."
                )
                raise
