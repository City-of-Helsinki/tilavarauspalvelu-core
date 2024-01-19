from contextlib import contextmanager
from functools import partial
from typing import Any
from unittest.mock import patch

from tests.gql_builders import build_mutation, build_query
from tests.helpers import ResponseMock

reservations_query = partial(build_query, "reservations", connection=True, order_by="pk")


CREATE_MUTATION = build_mutation("createReservation", "ReservationCreateMutationInput")
ADJUST_MUTATION = build_mutation("adjustReservationTime", "ReservationAdjustTimeMutationInput")
CREATE_STAFF_MUTATION = build_mutation("createStaffReservation", "ReservationStaffCreateMutationInput")
UPDATE_STAFF_MUTATION = build_mutation("staffReservationModify", "ReservationStaffModifyMutationInput")
ADJUST_STAFF_MUTATION = build_mutation("staffAdjustReservationTime", "ReservationStaffAdjustTimeMutationInput")


@contextmanager
def mock_profile_reader(profile_data: dict[str, Any] | None = None, **kwargs: Any):
    if profile_data is None:
        profile_data = {
            "firstName": "John",
            "lastName": "Doe",
            "primaryAddress": {
                "postalCode": "00100",
                "address": "Test street 1",
                "city": "Helsinki",
                "addressType": "HOME",
            },
            "primaryPhone": {
                "phone": "123456789",
            },
            "verifiedPersonalInformation": {
                "municipalityOfResidence": "Helsinki",
                "municipalityOfResidenceNumber": "12345",
            },
        }

    profile_data.update(kwargs)
    data = {"data": {"myProfile": profile_data}}

    response = ResponseMock(status_code=200, json_data=data)
    get_from_profile = "users.utils.open_city_profile.basic_info_resolver.requests.get"
    get_profile_token = "users.utils.open_city_profile.mixins.get_profile_token"  # noqa: S105
    with patch(get_from_profile, return_value=response) as mock, patch(get_profile_token, return_value="token"):
        yield mock
