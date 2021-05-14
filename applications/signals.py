from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import (
    Application,
    ApplicationEvent,
    ApplicationEventStatus,
    ApplicationRound,
    ApplicationRoundStatus,
    ApplicationStatus,
)


@receiver(post_save, sender=Application, dispatch_uid="create_application_status")
def create_application_status(sender, instance, **kwargs):
    if kwargs.get("raw", False):
        return
    if kwargs.get("created", False):
        if not instance.statuses.all().exists():
            ApplicationStatus.objects.create(
                application=instance, status=ApplicationStatus.DRAFT, user=None
            )


@receiver(
    post_save, sender=ApplicationStatus, dispatch_uid="update_latest_application_status"
)
def update_latest_application_status(sender, instance, **kwargs):
    if kwargs.get("raw", False):
        return
    if not kwargs.get("created", False):
        return

    instance.application.cached_latest_status = instance.status
    instance.application.save()


@receiver(
    post_save, sender=ApplicationEvent, dispatch_uid="create_application_event_status"
)
def create_application_event_status(sender, instance, **kwargs):
    if kwargs.get("raw", False):
        return
    if kwargs.get("created", False):
        if not instance.statuses.all().exists():
            ApplicationEventStatus.objects.create(
                application_event=instance,
                status=ApplicationEventStatus.CREATED,
                user=None,
            )


@receiver(
    post_save, sender=ApplicationRound, dispatch_uid="create_application_round_status"
)
def create_application_round_status(sender, instance, **kwargs):
    if kwargs.get("raw", False):
        return
    if kwargs.get("created", False):
        if not instance.statuses.all().exists():
            ApplicationRoundStatus.objects.create(
                application_round=instance,
                status=ApplicationRoundStatus.DRAFT,
                user=None,
            )


@receiver(
    post_save,
    sender=ApplicationStatus,
    dispatch_uid="create_aggregate_data_for_application",
)
def create_aggregate_data_for_application(sender, instance, **kwargs):
    if kwargs.get("created", False):
        if instance.status == ApplicationStatus.IN_REVIEW:
            instance.application.create_aggregate_data()


@receiver(
    post_save,
    sender=ApplicationRoundStatus,
    dispatch_uid="create_aggregate_data_for_application_round",
)
def create_aggregate_data_for_application_round(sender, instance, **kwargs):
    if kwargs.get("created", False):
        if instance.status in (
            ApplicationRoundStatus.IN_REVIEW,
            ApplicationRoundStatus.HANDLED,
        ):
            instance.application_round.create_aggregate_data()
