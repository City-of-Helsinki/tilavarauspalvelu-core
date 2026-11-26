from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

from tilavarauspalvelu.models import ReservationUnitImage

from tests.factories import ReservationUnitImageFactory

from .helpers import DELETE_MUTATION

if TYPE_CHECKING:
    from tests.helpers import GraphQLClient

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_image__delete(graphql: GraphQLClient) -> None:
    reservation_unit_image = ReservationUnitImageFactory.create()

    graphql.login_with_superuser()

    response = graphql(DELETE_MUTATION, input_data={"pk": reservation_unit_image.pk})

    assert response.has_errors is False
    assert ReservationUnitImage.objects.count() == 0
