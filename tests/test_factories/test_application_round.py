import pytest

from applications.choices import ApplicationRoundStatusChoice
from tests.factories import ApplicationRoundFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


@pytest.mark.parametrize("status", ApplicationRoundStatusChoice.values)
def test_application_round_factory_create_in_status(status):
    application = ApplicationRoundFactory.create_in_status(status=status)
    assert application.status == status
