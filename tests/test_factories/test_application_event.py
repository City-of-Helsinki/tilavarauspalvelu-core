import pytest

from applications.choices import ApplicationEventStatusChoice
from tests.factories import ApplicationEventFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize("status", ApplicationEventStatusChoice.values)
def test_application_event_factory_create_in_status(status):
    application = ApplicationEventFactory.create_in_status(status=status)
    assert application.status == status
