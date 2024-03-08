import pytest

from actions.reservation_unit import ReservationUnitHaukiExporter
from opening_hours.errors import HaukiAPIError
from opening_hours.utils.hauki_resource_hash_updater import HaukiResourceHashUpdater
from tests.factories import OriginHaukiResourceFactory, ReservationUnitFactory
from tests.helpers import patch_method

from .helpers import UPDATE_MUTATION, get_draft_update_input_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_setup_hauki"),
]


@patch_method(HaukiResourceHashUpdater.run)
@patch_method(ReservationUnitHaukiExporter.send_reservation_unit_to_hauki)
def test_reservation_unit__update__send_resource_to_hauki_when_resource_id_exists(graphql, settings):
    settings.HAUKI_EXPORTS_ENABLED = True
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(
        is_draft=True,
        origin_hauki_resource=OriginHaukiResourceFactory.create(id=1),
    )
    data = get_draft_update_input_data(reservation_unit)

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is False, response

    assert HaukiResourceHashUpdater.run.call_count == 1
    assert ReservationUnitHaukiExporter.send_reservation_unit_to_hauki.call_count == 1


@patch_method(ReservationUnitHaukiExporter.send_reservation_unit_to_hauki)
def test_reservation_unit__update__send_resource_to_hauki_when_resource_id_doesnt_exist(graphql, settings):
    settings.HAUKI_EXPORTS_ENABLED = True
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    data = get_draft_update_input_data(reservation_unit)

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is False, response

    assert ReservationUnitHaukiExporter.send_reservation_unit_to_hauki.call_count == 1


@patch_method(ReservationUnitHaukiExporter.send_reservation_unit_to_hauki)
def test_reservation_unit__update__send_resource_to_hauki_when_exports_disabled(graphql, settings):
    settings.HAUKI_EXPORTS_ENABLED = False
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    data = get_draft_update_input_data(reservation_unit)

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    assert ReservationUnitHaukiExporter.send_reservation_unit_to_hauki.call_count == 0


@patch_method(ReservationUnitHaukiExporter.send_reservation_unit_to_hauki, side_effect=HaukiAPIError())
def test_reservation_unit__update__send_resource_to_hauki_errors_returns_error_message(graphql, settings):
    settings.HAUKI_EXPORTS_ENABLED = True
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    data = get_draft_update_input_data(reservation_unit)
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Sending reservation unit as resource to HAUKI failed."

    assert ReservationUnitHaukiExporter.send_reservation_unit_to_hauki.call_count == 1
