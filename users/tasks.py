from django.contrib.auth import get_user_model

from tilavarauspalvelu.celery import app
from users.models import PersonalInfoViewLog


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
    )
