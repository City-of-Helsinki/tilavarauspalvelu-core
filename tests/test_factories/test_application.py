import pytest

from tests.factories.application import ApplicationBuilder
from tilavarauspalvelu.enums import ApplicationStatusChoice

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize("status", ApplicationStatusChoice.values)
def test_application_factory_create_in_status(status):
    application = ApplicationBuilder().with_status(status=status).create()
    assert application.status == status
