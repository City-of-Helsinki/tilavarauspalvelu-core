# ruff: noqa: S311

from datetime import datetime, timedelta

from django.utils.timezone import localtime
from django_celery_beat.models import CrontabSchedule, PeriodicTask

from common.enums import BannerNotificationLevel, BannerNotificationTarget
from common.models import BannerNotification
from opening_hours.models import DEFAULT_TIMEZONE
from reservations.tasks import prune_reservations_task, update_expired_orders_task

from .utils import faker_en, faker_fi, faker_sv, with_logs


@with_logs()
def _create_banner_notifications():
    today: datetime = localtime()
    with_link_created: bool = False
    with_bold_created: bool = False
    banner_notifications: list[BannerNotification] = []
    for target in BannerNotificationTarget.values:
        for level in BannerNotificationLevel.values:
            draft_message_fi = faker_fi.sentence()
            active_message_fi = faker_fi.sentence()
            scheduled_message_fi = faker_fi.sentence()
            past_message_fi = faker_fi.sentence()

            if not with_link_created:
                draft_message_fi += f" {faker_fi.url()}"
                active_message_fi += f" {faker_fi.url()}"
                scheduled_message_fi += f" {faker_fi.url()}"
                past_message_fi += f" {faker_fi.url()}"
                with_link_created = True

            elif not with_bold_created:
                draft_message_fi = f"<b>{draft_message_fi}</b>"
                active_message_fi = f"<b>{active_message_fi}</b>"
                scheduled_message_fi = f"<b>{scheduled_message_fi}</b>"
                past_message_fi = f"<b>{past_message_fi}</b>"
                with_bold_created = True

            banner_notifications += [
                BannerNotification(
                    name=f"Draft {level} notification for {target}",
                    message=draft_message_fi,
                    message_fi=draft_message_fi,
                    message_en=faker_en.sentence(),
                    message_sv=faker_sv.sentence(),
                    level=level,
                    target=target,
                    draft=True,
                    active_from=None,
                    active_until=None,
                ),
                BannerNotification(
                    name=f"Active {level} notification for {target}",
                    message=active_message_fi,
                    message_fi=active_message_fi,
                    message_en=faker_en.sentence(),
                    message_sv=faker_sv.sentence(),
                    level=level,
                    target=target,
                    draft=False,
                    active_from=today - timedelta(days=1),
                    active_until=today + timedelta(days=7),
                ),
                BannerNotification(
                    name=f"Scheduled {level} notification for {target}",
                    message=scheduled_message_fi,
                    message_fi=scheduled_message_fi,
                    message_en=faker_en.sentence(),
                    message_sv=faker_sv.sentence(),
                    level=level,
                    target=target,
                    draft=False,
                    active_from=today + timedelta(days=7),
                    active_until=today + timedelta(days=14),
                ),
                BannerNotification(
                    name=f"Past {level} notification for {target}",
                    message=past_message_fi,
                    message_fi=past_message_fi,
                    message_en=faker_en.sentence(),
                    message_sv=faker_sv.sentence(),
                    level=level,
                    target=target,
                    draft=False,
                    active_from=today - timedelta(days=7),
                    active_until=today - timedelta(days=1),
                ),
            ]

    return BannerNotification.objects.bulk_create(banner_notifications)


@with_logs()
def _create_periodic_tasks() -> None:
    even_5_minute = CrontabSchedule.objects.create(
        minute="0,5,10,15,20,25,30,35,40,45,50,55",
        timezone=DEFAULT_TIMEZONE,
    )
    off_5_minute = CrontabSchedule.objects.create(
        minute="2,7,12,17,22,27,32,37,42,47,52,57",
        timezone=DEFAULT_TIMEZONE,
    )

    PeriodicTask.objects.create(
        name="Maksamattomien tilausten rauetus",
        task=update_expired_orders_task.name,
        crontab=off_5_minute,
        description=(
            "Merkitsee rauenneiksi ja peruuu verkkokaupan rajapinnasta maksutilaukset, "
            "jotka on luotu yli 10 minuuttia sitten mutta joita ei ole maksettu."
        ),
    )

    PeriodicTask.objects.create(
        name="Vahvistamattomien väliaikaisten varausten poisto",
        task=prune_reservations_task.name,
        crontab=even_5_minute,
        description=(
            "Poistaa väliaikaiset varaukset, joita ei ole vahvistettu (lähetetty), "
            "jos ne ovat yli 20 minuuttia vanhoja eikä niihin liity verkkomaksua."
            "Ne joihin liittyy verkkomaksu, poistetaan jos tilaus verkkokauppaan on "
            "luotu yli 10 minuuttia sitten ja maksutilauksen status on rauennut tai peruttu."
        ),
    )
