from __future__ import annotations

from typing import Literal

from django_celery_beat.models import CrontabSchedule, PeriodicTask

from tilavarauspalvelu.enums import BannerNotificationLevel, BannerNotificationTarget, TermsOfUseTypeChoices
from tilavarauspalvelu.models import TermsOfUse
from tilavarauspalvelu.models.banner_notification.model import BannerNotification
from tilavarauspalvelu.tasks import (
    create_missing_pindora_reservations_task,
    handle_unfinished_reservations_task,
    refresh_expired_payments_in_verkkokauppa_task,
    update_affecting_time_spans_task,
    update_pindora_access_code_is_active_task,
)
from utils.date_utils import DEFAULT_TIMEZONE

from tests.factories import TermsOfUseFactory
from tests.factories.banner_notification import BannerNotificationBuilder

from .utils import with_logs


@with_logs
def _create_banner_notifications() -> list[BannerNotification]:
    banner_notifications: list[BannerNotification] = [
        (
            BannerNotificationBuilder()
            .active()
            .bold_messages()
            .build(
                name="Active message with bold text.",
                target=BannerNotificationTarget.ALL,
            )
        ),
        (
            BannerNotificationBuilder()
            .active()
            .messages_are_links()
            .build(
                name="Active message with link.",
                target=BannerNotificationTarget.ALL,
            )
        ),
    ]

    for target in BannerNotificationTarget.values:
        for level in BannerNotificationLevel.values:
            banner_notifications += [
                (
                    BannerNotificationBuilder()
                    .draft()
                    .build(
                        name=f"Draft {level} notification for {target}",
                        level=level,
                        target=target,
                    )
                ),
                (
                    BannerNotificationBuilder()
                    .active()
                    .build(
                        name=f"Active {level} notification for {target}",
                        level=level,
                        target=target,
                    )
                ),
                (
                    BannerNotificationBuilder()
                    .scheduled()
                    .build(
                        name=f"Scheduled {level} notification for {target}",
                        level=level,
                        target=target,
                    )
                ),
                (
                    BannerNotificationBuilder()
                    .past()
                    .build(
                        name=f"Past {level} notification for {target}",
                        level=level,
                        target=target,
                    )
                ),
            ]

    return BannerNotification.objects.bulk_create(banner_notifications)


@with_logs
def _create_periodic_tasks() -> None:
    even_5_minute = CrontabSchedule.objects.create(
        minute="0,5,10,15,20,25,30,35,40,45,50,55",
        timezone=DEFAULT_TIMEZONE,
    )
    off_5_minute = CrontabSchedule.objects.create(
        minute="2,7,12,17,22,27,32,37,42,47,52,57",
        timezone=DEFAULT_TIMEZONE,
    )
    every_other_minute = CrontabSchedule.objects.create(
        minute="2",
        timezone=DEFAULT_TIMEZONE,
    )

    PeriodicTask.objects.update_or_create(
        task=refresh_expired_payments_in_verkkokauppa_task.name,
        defaults={
            "name": refresh_expired_payments_in_verkkokauppa_task.tvp_auto_create_name,
            "description": refresh_expired_payments_in_verkkokauppa_task.tvp_auto_create_description,
            "crontab": off_5_minute,
            "enabled": True,
        },
    )

    PeriodicTask.objects.update_or_create(
        task=handle_unfinished_reservations_task.name,
        defaults={
            "name": handle_unfinished_reservations_task.tvp_auto_create_name,
            "description": handle_unfinished_reservations_task.tvp_auto_create_description,
            "crontab": even_5_minute,
            "enabled": True,
        },
    )

    PeriodicTask.objects.update_or_create(
        task=update_affecting_time_spans_task.name,
        defaults={
            "name": update_affecting_time_spans_task.tvp_auto_create_name,
            "description": update_affecting_time_spans_task.tvp_auto_create_description,
            "crontab": every_other_minute,
            "enabled": True,
        },
    )

    PeriodicTask.objects.update_or_create(
        task=create_missing_pindora_reservations_task.name,
        defaults={
            "name": create_missing_pindora_reservations_task.tvp_auto_create_name,
            "description": create_missing_pindora_reservations_task.tvp_auto_create_description,
            "crontab": even_5_minute,
            "enabled": True,
        },
    )

    PeriodicTask.objects.update_or_create(
        task=update_pindora_access_code_is_active_task.name,
        defaults={
            "name": update_pindora_access_code_is_active_task.tvp_auto_create_name,
            "description": update_pindora_access_code_is_active_task.tvp_auto_create_description,
            "crontab": off_5_minute,
            "enabled": True,
        },
    )


@with_logs
def _create_general_terms_of_use() -> list[TermsOfUse]:
    general_terms: dict[str, dict[Literal["fi", "en", "sv"], str]] = {
        "accessibility": {
            "fi": "Saavutettavuusseloste",
            "en": "Accessibility Statement",
            "sv": "Tillgänglighet",
        },
        "booking": {
            "fi": "Yleiset sopimusehdot",
            "en": "General Terms and Conditions",
            "sv": "Allmänna villkor",
        },
        "privacy": {
            "fi": "Tietosuojaseloste",
            "en": "Privacy Statement",
            "sv": "Dataskyddspolicy",
        },
        "service": {
            "fi": "Palvelun yleiset käyttöehdot",
            "en": "General Terms of Service",
            "sv": "Allmänna användarvillkor",
        },
    }

    terms_of_use: list[TermsOfUse] = []
    for term_id, term_name in general_terms.items():
        terms = TermsOfUseFactory.build(
            id=term_id,
            name=term_name["fi"],
            name_fi=term_name["fi"],
            name_sv=term_name["en"],
            name_en=term_name["sv"],
            terms_type=TermsOfUseTypeChoices.GENERIC,
        )
        terms_of_use.append(terms)

    return TermsOfUse.objects.bulk_create(terms_of_use)
