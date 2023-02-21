from django.contrib.auth import get_user_model

from tilavarauspalvelu.celery import app
from users.models import PersonalInfoViewLog
from users.utils.remove_personal_info_view_logs import (
    remove_personal_info_view_logs_older_than,
)


@app.task(name="save_personal_info_view_log")
def save_personal_info_view_log(user_id: int, viewer_user_id: int, field: str):
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
def remove_old_personal_info_view_logs():
    remove_personal_info_view_logs_older_than()
