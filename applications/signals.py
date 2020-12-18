from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Application, ApplicationStatus


@receiver(post_save, sender=Application, dispatch_uid="create_status")
def create_status(sender, instance, **kwargs):
    if kwargs.get("created", False):
        if not instance.statuses.all().exists():
            ApplicationStatus.objects.create(
                application=instance, status=ApplicationStatus.DRAFT, user=None
            )
