import pytest
from lookup_property import L

from applications.choices import ApplicationRoundStatusChoice
from applications.models import ApplicationRound
from tests.factories import ApplicationRoundFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize("status", ApplicationRoundStatusChoice.values)
def test_application_round_factory_create_in_status(status):
    application_round = ApplicationRoundFactory.create_in_status(status=status)
    assert application_round.status == status
    assert ApplicationRound.objects.filter(L(status=status)).exists()
