import pytest

from applications.choices import ApplicationSectionStatusChoice
from tests.factories import ApplicationSectionFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize(
    "status",
    [
        ApplicationSectionStatusChoice.UNALLOCATED,
        ApplicationSectionStatusChoice.IN_ALLOCATION,
        ApplicationSectionStatusChoice.HANDLED,
    ],
)
def test_application_section_factory_create_in_status(status):
    section = ApplicationSectionFactory.create_in_status(status=status)
    assert section.status == status
