from __future__ import annotations

import pytest
from lookup_property import L

from tilavarauspalvelu.enums import ApplicationSectionStatusChoice, ApplicationStatusChoice
from tilavarauspalvelu.models import ApplicationSection

from tests.factories.application_section import ApplicationSectionBuilder

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize(
    ("status", "application_status"),
    [
        (ApplicationSectionStatusChoice.UNALLOCATED, ApplicationStatusChoice.DRAFT),
        (ApplicationSectionStatusChoice.IN_ALLOCATION, ApplicationStatusChoice.IN_ALLOCATION),
        (ApplicationSectionStatusChoice.HANDLED, ApplicationStatusChoice.HANDLED),
        (ApplicationSectionStatusChoice.REJECTED, ApplicationStatusChoice.HANDLED),
    ],
)
def test_application_section_factory_create_in_status(status, application_status):
    section = ApplicationSectionBuilder().with_status(status).create()
    assert section.status == status
    assert ApplicationSection.objects.filter(L(status=status.value)).exists()

    assert section.application.status == application_status
