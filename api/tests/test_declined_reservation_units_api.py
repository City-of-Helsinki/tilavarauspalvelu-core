import pytest
from rest_framework.reverse import reverse


@pytest.mark.django_db
def test_updating_declined_reservation_units(application_event, reservation_unit, service_sector_admin_api_client):
    data = {"declined_reservation_unit_ids": [reservation_unit.id]}
    response = service_sector_admin_api_client.put(
        reverse(
            "declined_reservation_unit-detail",
            kwargs={"pk": application_event.id},
        ),
        data=data,
        format="json",
    )

    assert response.status_code == 200
    assert response.data["declined_reservation_unit_ids"] == [reservation_unit.id]
