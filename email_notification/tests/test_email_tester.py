from assertpy import assert_that
from django.test.testcases import TestCase

from email_notification.email_tester import EmailTestForm, ReservationUnitSelectForm
from email_notification.models import EmailType
from tests.factories import EmailTemplateFactory, ReservationUnitFactory


class ReservationUnitSelectFormTestCase(TestCase):
    def test_constructor(self):
        runit1 = ReservationUnitFactory.create(name_fi="Test reservation unit 1")
        runit2 = ReservationUnitFactory.create(name_fi="Test reservation unit 2")
        runit3 = ReservationUnitFactory.create(name_fi="Test reservation unit 3")

        form = ReservationUnitSelectForm()
        assert_that(form.fields["reservation_unit"].choices).is_equal_to(
            [
                (runit1.pk, runit1.name_fi),
                (runit2.pk, runit2.name_fi),
                (runit3.pk, runit3.name_fi),
            ]
        )


class EmailTestFormTestCase(TestCase):
    def test_constructor(self):
        template1 = EmailTemplateFactory.create(name="Template 1", type=EmailType.RESERVATION_CONFIRMED)
        template2 = EmailTemplateFactory.create(name="Template 2", type=EmailType.RESERVATION_CANCELLED)
        template3 = EmailTemplateFactory.create(name="Template 3", type=EmailType.RESERVATION_REJECTED)

        form = EmailTestForm()
        assert_that(form.fields["template"].choices).is_equal_to(
            [
                (template1.pk, template1.name),
                (template2.pk, template2.name),
                (template3.pk, template3.name),
            ]
        )
