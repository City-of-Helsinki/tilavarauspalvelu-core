from celery import shared_task


@shared_task
def _celery_application_event_schedule_result_aggregate_data_create(
    application_event_id, *args, **kwargs
):
    from applications.models import ApplicationEvent
    from applications.utils.aggregate_data import (
        _ApplicationEventScheduleResultAggregateDataCreator,
    )

    _ApplicationEventScheduleResultAggregateDataCreator(
        event=ApplicationEvent.objects.get(pk=application_event_id)
    ).run()
