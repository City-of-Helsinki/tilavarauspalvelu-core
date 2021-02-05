from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import (
    Application,
    ApplicationEvent,
    ApplicationEventStatus,
    ApplicationStatus,
)


@receiver(post_save, sender=Application, dispatch_uid="create_application_status")
def create_application_status(sender, instance, **kwargs):
    if kwargs.get("created", False):
        if not instance.statuses.all().exists():
            ApplicationStatus.objects.create(
                application=instance, status=ApplicationStatus.DRAFT, user=None
            )


@receiver(
    post_save, sender=ApplicationEvent, dispatch_uid="create_application_event_status"
)
def create_application_event_status(sender, instance, **kwargs):
    if kwargs.get("created", False):
        if not instance.statuses.all().exists():
            ApplicationEventStatus.objects.create(
                application_event=instance,
                status=ApplicationEventStatus.CREATED,
                user=None,
            )
