from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone

from applications.models import ApplicationEvent


class ApplicationEnet(TestCase):

    def test_joe_must_have_a_website(self):
        p = ApplicationEvent(num_persons=10, num_events=20, duration=10000, application=1,
                             timeframe_end=timezone.now() + timezone.timedelta(seconds=10),
                             timeframe_start=timezone.now(),
                             )
        with self.assertRaises(ValidationError):
            p.full_clean()