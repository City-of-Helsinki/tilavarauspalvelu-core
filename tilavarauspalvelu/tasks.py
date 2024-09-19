from django.contrib.auth import get_user_model
from django.db.transaction import atomic
from django.utils import timezone

from config.celery import app
from tilavarauspalvelu.models import PersonalInfoViewLog, Space, Unit
from tilavarauspalvelu.utils.importers.tprek_unit_importer import TprekUnitImporter


@app.task(name="rebuild_space_tree_hierarchy")
def rebuild_space_tree_hierarchy() -> None:
    from reservation_units.models import ReservationUnitHierarchy

    with atomic():
        Space.objects.rebuild()
        ReservationUnitHierarchy.refresh()


@app.task(name="update_units_from_tprek")
def update_units_from_tprek() -> None:
    units_to_update = Unit.objects.exclude(tprek_id__isnull=True)
    tprek_unit_importer = TprekUnitImporter()
    tprek_unit_importer.update_unit_from_tprek(units_to_update)


@app.task(name="save_personal_info_view_log")
def save_personal_info_view_log(user_id: int, viewer_user_id: int, field: str) -> None:
    user = get_user_model().objects.filter(id=user_id).first()
    viewer_user = get_user_model().objects.filter(id=viewer_user_id).first()

    # Do not log own views.
    if user == viewer_user:
        return

    PersonalInfoViewLog.objects.create(
        user=user,
        viewer_user=viewer_user,
        viewer_username=viewer_user.username,
        field=field,
        viewer_user_full_name=viewer_user.get_full_name(),
        viewer_user_email=viewer_user.email,
    )


@app.task(name="remove_old_personal_info_view_logs")
def remove_old_personal_info_view_logs() -> None:
    remove_personal_info_view_logs_older_than()


REMOVE_OLDER_THAN_DAYS = 365 * 2


def remove_personal_info_view_logs_older_than(days: int = REMOVE_OLDER_THAN_DAYS) -> None:
    remove_lt = timezone.now() - timezone.timedelta(days=days)
    PersonalInfoViewLog.objects.filter(access_time__lt=remove_lt).delete()
