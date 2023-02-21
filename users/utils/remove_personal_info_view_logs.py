from django.utils import timezone

from users.models import PersonalInfoViewLog

REMOVE_OLDER_THAN_DAYS = 365 * 2


def remove_personal_info_view_logs_older_than(days: int = REMOVE_OLDER_THAN_DAYS):
    remove_lt = timezone.now() - timezone.timedelta(days=days)
    PersonalInfoViewLog.objects.filter(access_time__lt=remove_lt).delete()
