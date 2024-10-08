import pytest

from tests.factories import EmailTemplateFactory, ReservationUnitFactory
from tilavarauspalvelu.admin.email_template.tester import (
    EmailTemplateTesterForm,
    EmailTemplateTesterReservationUnitSelectForm,
)
from tilavarauspalvelu.enums import EmailType

pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_select_form():
    runit1 = ReservationUnitFactory.create(name_fi="Test reservation unit 1")
    runit2 = ReservationUnitFactory.create(name_fi="Test reservation unit 2")
    runit3 = ReservationUnitFactory.create(name_fi="Test reservation unit 3")

    form = EmailTemplateTesterReservationUnitSelectForm()
    assert form.fields["reservation_unit"].choices == [
        (runit1.pk, f"{runit1.name_fi} - {runit1.unit.name_fi}"),
        (runit2.pk, f"{runit2.name_fi} - {runit2.unit.name_fi}"),
        (runit3.pk, f"{runit3.name_fi} - {runit3.unit.name_fi}"),
    ]


def test_email_test_form():
    template1 = EmailTemplateFactory.create(name="Template 1", type=EmailType.RESERVATION_CANCELLED)
    template2 = EmailTemplateFactory.create(name="Template 2", type=EmailType.RESERVATION_CONFIRMED)
    template3 = EmailTemplateFactory.create(name="Template 3", type=EmailType.RESERVATION_REJECTED)

    form = EmailTemplateTesterForm()
    assert form.fields["template"].choices == [
        (template1.pk, template1.name),
        (template2.pk, template2.name),
        (template3.pk, template3.name),
    ]
