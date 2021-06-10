import pytest
from assertpy import assert_that
from django.urls import reverse

from applications.models import ApplicationRoundStatus


@pytest.mark.django_db
def test_application_round_fetch(user_api_client, application_round):
    response = user_api_client.get(reverse("application_round-list"))
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0].get("id") == application_round.id


@pytest.mark.django_db
def test_regular_user_should_not_be_admin(user_api_client, application_round):
    response = user_api_client.get(
        reverse("application_round-detail", kwargs={"pk": application_round.id})
    )
    assert_that(response.data.get("is_admin")).is_false()


@pytest.mark.django_db
def test_service_sector_application_round_admin_should_depend_on_service_sector(
    user_api_client, application_round, service_sector_admin_api_client
):
    response = service_sector_admin_api_client.get(
        reverse("application_round-detail", kwargs={"pk": application_round.id})
    )
    assert_that(response.data.get("is_admin")).is_true()

    application_round.service_sector = None
    application_round.save()
    response = service_sector_admin_api_client.get(
        reverse("application_round-detail", kwargs={"pk": application_round.id})
    )
    assert_that(response.data.get("is_admin")).is_false()


@pytest.mark.django_db
def test_general_admin_should_be_admin_without_service_sector(
    user_api_client, application_round, general_admin_api_client
):
    application_round.service_sector = None
    application_round.save()
    response = general_admin_api_client.get(
        reverse("application_round-detail", kwargs={"pk": application_round.id})
    )
    assert_that(response.data.get("is_admin")).is_true()


@pytest.mark.django_db
def test_create_application_round(
    user_api_client, service_sector_admin_api_client, valid_application_round_data
):
    response = user_api_client.post(
        reverse("application_round-list"),
        data=valid_application_round_data,
        format="json",
    )

    assert response.status_code == 403

    response = service_sector_admin_api_client.post(
        reverse("application_round-list"),
        data=valid_application_round_data,
        format="json",
    )

    assert response.data["status"] == ApplicationRoundStatus.DRAFT
    assert response.data["name"] == valid_application_round_data["name"]


@pytest.mark.django_db
def test_application_round_should_not_allow_order_number_overlap(
    service_sector_admin_api_client,
    valid_application_round_data,
    valid_application_round_basket_data,
):
    baskets = []
    for i in range(2):
        data = valid_application_round_basket_data.copy()
        data["order_number"] = 1
        baskets.append(data)

    valid_application_round_data["application_round_baskets"] = baskets
    response = service_sector_admin_api_client.post(
        reverse("application_round-list"),
        data=valid_application_round_data,
        format="json",
    )

    assert response.status_code == 400
    assert "Order numbers should be unique" in response.data["non_field_errors"]


@pytest.mark.django_db
def test_application_round_when_basket_orders_dont_overlap(
    service_sector_admin_api_client,
    valid_application_round_data,
    valid_application_round_basket_data,
):
    baskets = []
    for i in range(2):
        data = valid_application_round_basket_data.copy()
        data["order_number"] = i + 1
        baskets.append(data)

    valid_application_round_data["application_round_baskets"] = baskets
    response = service_sector_admin_api_client.post(
        reverse("application_round-list"),
        data=valid_application_round_data,
        format="json",
    )

    assert response.status_code == 201
    order_numbers = list(
        map(lambda x: x["order_number"], response.data["application_round_baskets"])
    )
    assert len(order_numbers) == 2
    assert 1 in order_numbers and 2 in order_numbers


@pytest.mark.django_db
def test_update_application_round(
    user_api_client,
    service_sector_admin_api_client,
    application_round,
    valid_application_round_data,
):
    data = {**valid_application_round_data, "status": ApplicationRoundStatus.IN_REVIEW}

    # Normal user not allowed to edit application round
    response = user_api_client.put(
        reverse("application_round-detail", kwargs={"pk": application_round.id}),
        data=data,
        format="json",
    )
    assert response.status_code == 403

    # Service Sector admin can edit application round
    response = service_sector_admin_api_client.put(
        reverse("application_round-detail", kwargs={"pk": application_round.id}),
        data=data,
        format="json",
    )
    assert response.status_code == 200

    application_round.refresh_from_db()

    assert application_round.status == ApplicationRoundStatus.IN_REVIEW
    assert application_round.name == valid_application_round_data["name"]


@pytest.mark.django_db
def test_partial_update_application_round_status(
    user_api_client,
    service_sector_admin_api_client,
    application_round,
    valid_application_round_data,
):

    data = {
        "status": ApplicationRoundStatus.IN_REVIEW,
    }

    # Normal user not allowed to edit application round
    response = user_api_client.patch(
        reverse("application_round-detail", kwargs={"pk": application_round.id}),
        data=data,
        format="json",
    )
    assert response.status_code == 403

    # Service Sector admin can edit application round
    response = service_sector_admin_api_client.patch(
        reverse("application_round-detail", kwargs={"pk": application_round.id}),
        data=data,
        format="json",
    )
    assert response.status_code == 200

    application_round.refresh_from_db()

    assert application_round.status == ApplicationRoundStatus.IN_REVIEW


@pytest.mark.django_db
def test_partial_update_application_round_name(
    user_api_client,
    service_sector_admin_api_client,
    application_round,
    valid_application_round_data,
):

    data = {
        "name": "name changes",
    }

    response = service_sector_admin_api_client.patch(
        reverse("application_round-detail", kwargs={"pk": application_round.id}),
        data=data,
        format="json",
    )
    assert response.status_code == 200

    application_round.refresh_from_db()

    assert application_round.name == "name changes"


@pytest.mark.django_db
def test_normal_user_cannot_create_application_rounds(
    user_api_client, valid_application_round_data
):
    response = user_api_client.post(
        reverse("application_round-list"),
        data=valid_application_round_data,
        format="json",
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_normal_user_cannot_edit_application_rounds(
    user_api_client, application_round, valid_application_round_data
):
    response = user_api_client.put(
        reverse("application_round-detail", kwargs={"pk": application_round.id}),
        data=valid_application_round_data,
        format="json",
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_normal_user_can_see_application_rounds(user_api_client, application_round):
    response = user_api_client.get(reverse("application_round-list"), format="json")
    assert application_round.id in map(lambda x: x["id"], response.data)


@pytest.mark.django_db
def test_general_admin_can_create_application_rounds(
    general_admin_api_client, valid_application_round_data
):
    response = general_admin_api_client.post(
        reverse("application_round-list"),
        data=valid_application_round_data,
        format="json",
    )

    assert response.status_code == 201


@pytest.mark.django_db
def test_general_admin_can_update_application_rounds(
    application_round, valid_application_round_data, general_admin_api_client
):
    response = general_admin_api_client.put(
        reverse("application_round-detail", kwargs={"pk": application_round.id}),
        data=valid_application_round_data,
        format="json",
    )
    assert response.status_code == 200


@pytest.mark.django_db
def test_service_sector_admin_can_create_application_rounds(
    service_sector_admin_api_client, valid_application_round_data
):
    response = service_sector_admin_api_client.post(
        reverse("application_round-list"),
        data=valid_application_round_data,
        format="json",
    )
    assert response.status_code == 201


@pytest.mark.django_db
def test_service_sector_admin_can_update_application_rounds(
    service_sector_admin_api_client, application_round, valid_application_round_data
):
    response = service_sector_admin_api_client.put(
        reverse("application_round-detail", kwargs={"pk": application_round.id}),
        data=valid_application_round_data,
        format="json",
    )
    assert response.status_code == 200


@pytest.mark.django_db
def test_application_manager_can_create_application_rounds(
    service_sector_application_manager_api_client, valid_application_round_data
):
    response = service_sector_application_manager_api_client.post(
        reverse("application_round-list"),
        data=valid_application_round_data,
        format="json",
    )
    assert response.status_code == 201


@pytest.mark.django_db
def test_application_manager_can_update_application_rounds(
    service_sector_application_manager_api_client,
    application_round,
    valid_application_round_data,
):
    response = service_sector_application_manager_api_client.put(
        reverse("application_round-detail", kwargs={"pk": application_round.id}),
        data=valid_application_round_data,
        format="json",
    )
    assert response.status_code == 200


@pytest.mark.django_db
def test_wrong_service_sector_admin_cannot_manage_application_rounds(
    service_sector_2_admin_api_client, valid_application_round_data, application_round
):
    response = service_sector_2_admin_api_client.post(
        reverse("application_round-list"),
        data=valid_application_round_data,
        format="json",
    )
    assert response.status_code == 403

    response = service_sector_2_admin_api_client.put(
        reverse("application_round-detail", kwargs={"pk": application_round.id}),
        data=valid_application_round_data,
        format="json",
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_approved_application_round_cannot_change_status(
    user_api_client,
    service_sector_admin_api_client,
    application_round,
    valid_application_round_data,
):
    application_round.set_status(ApplicationRoundStatus.APPROVED)
    data = {**valid_application_round_data, "status": ApplicationRoundStatus.IN_REVIEW}

    response = service_sector_admin_api_client.put(
        reverse("application_round-detail", kwargs={"pk": application_round.id}),
        data=data,
        format="json",
    )
    assert response.status_code == 400

    application_round.refresh_from_db()

    assert application_round.status == ApplicationRoundStatus.APPROVED
