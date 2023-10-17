import pytest

from applications.choices import ApplicationStatusChoice
from tests.factories import ApplicationFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


@pytest.mark.parametrize("status", ApplicationStatusChoice.values)
def test_application_factory_create_in_status(status):
    application = ApplicationFactory.create_in_status(status=status)
    assert application.status == status
