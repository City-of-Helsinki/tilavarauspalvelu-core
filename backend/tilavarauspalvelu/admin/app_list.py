from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING, Any

from django.utils.translation import gettext_lazy as _

if TYPE_CHECKING:
    from django.utils.functional import Promise

__all__ = [
    "group_admin_app_list",
]


@dataclasses.dataclass(frozen=True, slots=True)
class AdminAppGroup:
    app_label: str
    name: str | Promise
    # Models as 'app_label.ObjectName', in the order they are shown.
    models: list[str]


ADMIN_APP_GROUPS: list[AdminAppGroup] = [
    AdminAppGroup(
        app_label="reservations",
        name=_("Reservations"),
        models=[
            "tilavarauspalvelu.Reservation",
            "tilavarauspalvelu.ReservationSeries",
            "tilavarauspalvelu.RejectedOccurrence",
            "tilavarauspalvelu.ReservationStatistic",
            "tilavarauspalvelu.ReservationDenyReason",
            "tilavarauspalvelu.ReservationPurpose",
            "tilavarauspalvelu.AgeGroup",
        ],
    ),
    AdminAppGroup(
        app_label="reservation-units",
        name=_("Reservation units"),
        models=[
            "tilavarauspalvelu.ReservationUnit",
            "tilavarauspalvelu.ReservationUnitPricing",
            "tilavarauspalvelu.ReservationUnitAccessType",
            "tilavarauspalvelu.ReservationUnitImage",
            "tilavarauspalvelu.ReservationUnitCancellationRule",
            "tilavarauspalvelu.ReservationUnitType",
            "tilavarauspalvelu.Equipment",
            "tilavarauspalvelu.EquipmentCategory",
            "tilavarauspalvelu.IntendedUse",
            "tilavarauspalvelu.OriginHaukiResource",
        ],
    ),
    AdminAppGroup(
        app_label="locations",
        name=_("Units and spaces"),
        models=[
            "tilavarauspalvelu.Unit",
            "tilavarauspalvelu.UnitGroup",
            "tilavarauspalvelu.Space",
            "tilavarauspalvelu.Resource",
        ],
    ),
    AdminAppGroup(
        app_label="seasonal-bookings",
        name=_("Seasonal bookings"),
        models=[
            "tilavarauspalvelu.ApplicationRound",
            "tilavarauspalvelu.Application",
            "tilavarauspalvelu.ApplicationSection",
            "tilavarauspalvelu.ReservationUnitOption",
            "tilavarauspalvelu.AllocatedTimeSlot",
        ],
    ),
    AdminAppGroup(
        app_label="payments",
        name=_("Payments"),
        models=[
            "tilavarauspalvelu.PaymentOrder",
            "tilavarauspalvelu.PaymentMerchant",
            "tilavarauspalvelu.PaymentAccounting",
            "tilavarauspalvelu.TaxLevel",
            "tilavarauspalvelu.TaxPercentage",
        ],
    ),
    AdminAppGroup(
        app_label="users-and-permissions",
        name=_("Users and permissions"),
        models=[
            "tilavarauspalvelu.User",
            "tilavarauspalvelu.GeneralRole",
            "tilavarauspalvelu.UnitRole",
            "auth.Group",
            "helusers.ADGroup",
            "helusers.ADGroupMapping",
        ],
    ),
    AdminAppGroup(
        app_label="content-and-emails",
        name=_("Content and emails"),
        models=[
            "tilavarauspalvelu.TermsOfUse",
            "tilavarauspalvelu.BannerNotification",
            "tilavarauspalvelu.EmailMessage",
            "admin-data-views.email_templates",
            "admin-data-views.email_template_tester",
        ],
    ),
    AdminAppGroup(
        app_label="system",
        name=_("System"),
        models=[
            "auditlog.LogEntry",
            "django_celery_beat.PeriodicTask",
            "django_celery_beat.CrontabSchedule",
            "django_celery_beat.IntervalSchedule",
            "django_celery_beat.ClockedSchedule",
            "django_celery_beat.SolarSchedule",
            "django_celery_results.TaskResult",
            "django_celery_results.GroupResult",
            "resilient_logger.ResilientLogEntry",
            "social_django.UserSocialAuth",
            "social_django.Association",
            "social_django.Nonce",
        ],
    ),
]


# Names for the models and views whose apps have no Finnish translations.
TRANSLATED_MODEL_NAMES: dict[str, Promise] = {
    "helusers.ADGroup": _("AD groups"),
    "helusers.ADGroupMapping": _("AD group mappings"),
    "admin-data-views.email_templates": _("Email templates"),
    "admin-data-views.email_template_tester": _("Email template testing"),
    "django_celery_beat.PeriodicTask": _("Periodic tasks"),
    "django_celery_beat.CrontabSchedule": _("Crontab schedules"),
    "django_celery_beat.IntervalSchedule": _("Interval schedules"),
    "django_celery_beat.ClockedSchedule": _("Clocked schedules"),
    "django_celery_beat.SolarSchedule": _("Solar schedules"),
    "django_celery_results.TaskResult": _("Task results"),
    "django_celery_results.GroupResult": _("Group results"),
    "resilient_logger.ResilientLogEntry": _("Resilient log entries"),
    "social_django.UserSocialAuth": _("User social auths"),
    "social_django.Association": _("Associations"),
    "social_django.Nonce": _("Nonces"),
}


def group_admin_app_list(app_list: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Group the models on the admin index page and in the sidebar by topic instead of by Django app."""
    models_by_label: dict[str, dict[str, Any]] = {}
    for app in app_list:
        for model in app["models"]:
            label = f"{app['app_label']}.{model['object_name']}"
            translated_name = TRANSLATED_MODEL_NAMES.get(label)
            if translated_name is None:
                models_by_label[label] = model
            else:
                models_by_label[label] = {**model, "name": translated_name}

    grouped_app_list: list[dict[str, Any]] = []
    for group in ADMIN_APP_GROUPS:
        models = [models_by_label.pop(label) for label in group.models if label in models_by_label]
        if not models:
            continue

        grouped_app_list.append({
            "name": group.name,
            "app_label": group.app_label,
            # Groups have no page of their own.
            "app_url": f"#{group.app_label}",
            "has_module_perms": True,
            "models": models,
        })

    # A model that is not in any group goes under 'Other', so that it stays visible.
    if models_by_label:
        other_models = sorted(models_by_label.values(), key=lambda model: str(model["name"]))
        grouped_app_list.append({
            "name": _("Other"),
            "app_label": "other",
            "app_url": "#other",
            "has_module_perms": True,
            "models": other_models,
        })

    return grouped_app_list
