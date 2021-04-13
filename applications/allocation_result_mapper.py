import logging

from allocation.allocation_solver import AllocatedEvent
from applications.models import ApplicationEventSchedule, ApplicationEventScheduleResult

logger = logging.getLogger(__name__)


class AllocationResultMapper(object):
    def __init__(self, allocated_events: [AllocatedEvent]):
        self.allocated_events = allocated_events

    def to_events(self):
        for allocated_event in self.allocated_events:
            try:
                application_event_schedule = ApplicationEventSchedule.objects.get(
                    pk=allocated_event.occurrence_id
                )
                ApplicationEventScheduleResult.objects.update_or_create(
                    application_event_schedule=application_event_schedule,
                    defaults={
                        "allocated_reservation_unit_id": allocated_event.space_id,
                        "allocated_day": application_event_schedule.day,
                        "allocated_duration": allocated_event.duration,
                        "allocated_begin": allocated_event.begin,
                        "allocated_end": allocated_event.end,
                        "basket": allocated_event.basket_id,
                    },
                )
            except ApplicationEventScheduleResult.DoesNotExist:
                logger.exception(
                    "AllocationResultMapper: error occurred while creating event schedule results."
                )
