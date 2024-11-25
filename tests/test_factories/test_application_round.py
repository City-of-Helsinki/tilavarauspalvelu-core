import pytest
from lookup_property import L

from tilavarauspalvelu.enums import ApplicationRoundStatusChoice
from tilavarauspalvelu.models import ApplicationRound

from tests.factories.application_round import ApplicationRoundBuilder

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize("status", ApplicationRoundStatusChoice.values)
def test_application_round_factory_create_in_status(status):
    application_round = ApplicationRoundBuilder().with_status(status).create()
    assert application_round.status == status
    assert ApplicationRound.objects.filter(L(status=status)).exists()
