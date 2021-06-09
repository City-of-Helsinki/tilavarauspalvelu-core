import pytest
from assertpy import assert_that
from freezegun import freeze_time
from rest_framework.reverse import reverse

from applications.models import (
    Application,
    ApplicationEvent,
    ApplicationEventScheduleResult,
    ApplicationEventWeeklyAmountReduction,
    ApplicationStatus,
)


@pytest.mark.django_db
def test_application_create(
    valid_application_data,
    user_api_client,
):
    assert Application.objects.count() == 0

    response = user_api_client.post(
        reverse("application-list"), valid_application_data, format="json"
    )
    assert response.status_code == 201

    assert response.data["organisation"]["identifier"] == "123-identifier"
    assert response.data["contact_person"]["email"] == "john@test.com"
    assert response.data["organisation"]["address"]["street_address"] == "Testikatu 28"
    assert response.data["billing_address"]["street_address"] == "Laskukatu 1c"
    assert Application.objects.count() == 1


@pytest.mark.django_db
def test_application_create_organization_identifier_can_be_null(
    valid_application_data,
    user_api_client,
):
    valid_application_data["organisation"]["identifier"] = None
    assert_that(Application.objects.count()).is_zero()

    response = user_api_client.post(
        reverse("application-list"), valid_application_data, format="json"
    )
    assert_that(response.status_code).is_equal_to(201)

    assert_that(response.data["organisation"]["identifier"]).is_none()
    assert_that(Application.objects.count()).is_equal_to(1)


@pytest.mark.django_db
def test_application_create_organization_identifier_cannot_be_empty(
    valid_application_data,
    user_api_client,
):
    valid_application_data["organisation"].update({"identifier": ""})
    assert_that(Application.objects.count()).is_zero()

    response = user_api_client.post(
        reverse("application-list"), valid_application_data, format="json"
    )
    assert_that(response.status_code).is_equal_to(400)


@pytest.mark.django_db
def test_application_create_organization_address_cannot_be_empty(
    valid_application_data,
    user_api_client,
):
    valid_application_data["organisation"].update({"address": ""})
    assert_that(Application.objects.count()).is_zero()

    response = user_api_client.post(
        reverse("application-list"), valid_application_data, format="json"
    )
    assert_that(response.status_code).is_equal_to(400)


@pytest.mark.django_db
def test_application_create_organization_address_cannot_be_null(
    valid_application_data,
    user_api_client,
):
    data = valid_application_data.copy()
    data["organisation"].update({"address": None})
    assert_that(Application.objects.count()).is_zero()

    response = user_api_client.post(reverse("application-list"), data, format="json")
    assert_that(response.status_code).is_equal_to(400)


@pytest.mark.django_db
def test_application_create_organization_address_not_included(
    valid_application_data,
    user_api_client,
):
    valid_application_data["organisation"].pop("address")
    assert_that(Application.objects.count()).is_zero()

    response = user_api_client.post(
        reverse("application-list"), valid_application_data, format="json"
    )
    assert_that(response.status_code).is_equal_to(400)


@pytest.mark.django_db
def test_application_create_organization_can_be_null(
    valid_application_data,
    user_api_client,
):
    valid_application_data["organisation"] = None
    assert_that(Application.objects.count()).is_zero()

    response = user_api_client.post(
        reverse("application-list"), valid_application_data, format="json"
    )
    assert_that(response.status_code).is_equal_to(201)


@pytest.mark.django_db
@freeze_time("2021-01-15")
def test_application_update_should_update_organisation_and_contact_person(
    user_api_client, application, organisation, person, purpose, application_round
):
    assert Application.objects.count() == 1

    data = {
        "id": application.id,
        "applicant_type": "company",
        "organisation": {
            "id": organisation.id,
            "identifier": organisation.identifier,
            "name": "Super organisation modified",
            "address": {
                "street_address": "Testikatu 1",
                "post_code": 33540,
                "city": "Tampere",
            },
        },
        "contact_person": {
            "id": person.id,
            "first_name": person.first_name,
            "last_name": "The modified",
            "email": person.email,
            "phone_number": person.phone_number,
        },
        "application_round_id": application_round.id,
        "application_events": [],
        "status": "draft",
        "billing_address": None,
    }

    response = user_api_client.put(
        reverse("application-detail", kwargs={"pk": application.id}),
        data=data,
        format="json",
    )

    assert response.status_code == 200
    assert response.data.get("contact_person")["id"] == person.id
    assert response.data.get("contact_person")["last_name"] == "The modified"

    assert response.data.get("organisation")["id"] == organisation.id
    assert response.data.get("organisation")["name"] == "Super organisation modified"


@pytest.mark.django_db
@freeze_time("2021-01-15")
def test_should_handle_patch_requests(
    user_api_client, application, organisation, person, purpose, application_round
):
    assert Application.objects.count() == 1

    data = {
        "status": "cancelled",
    }

    response = user_api_client.patch(
        reverse("application-detail", kwargs={"pk": application.id}),
        data=data,
        format="json",
    )

    assert response.status_code == 200
    assert response.data.get("status") == "cancelled"


@pytest.mark.django_db
@freeze_time("2021-01-15")
def test_application_update_should_null_organisation_and_contact_person_for_draft(
    user_api_client, application, organisation, person, purpose, application_round
):
    assert Application.objects.count() == 1

    data = {
        "id": application.id,
        "applicant_type": Application.APPLICANT_TYPE_INDIVIDUAL,
        "organisation": None,
        "contact_person": None,
        "application_round_id": application_round.id,
        "application_events": [],
        "status": "draft",
        "billing_address": None,
    }

    response = user_api_client.put(
        reverse("application-detail", kwargs={"pk": application.id}),
        data=data,
        format="json",
    )
    assert response.status_code == 200
    assert response.data.get("contact_person") is None
    assert response.data.get("organisation") is None
    application.refresh_from_db()
    assert application.contact_person is None


@pytest.mark.django_db
@freeze_time("2021-01-15")
def test_application_update_should_force_contact_person_for_in_review(
    user_api_client,
    application,
    organisation,
    person,
    purpose,
    application_round,
    valid_application_event_data,
):
    assert Application.objects.count() == 1

    data = {
        "id": application.id,
        "applicant_type": Application.APPLICANT_TYPE_INDIVIDUAL,
        "organisation": None,
        "contact_person": None,
        "application_round_id": application_round.id,
        "application_events": [valid_application_event_data],
        "status": ApplicationStatus.IN_REVIEW,
        "billing_address": None,
    }

    response = user_api_client.put(
        reverse("application-detail", kwargs={"pk": application.id}),
        data=data,
        format="json",
    )
    assert response.status_code == 400


@pytest.mark.django_db
@freeze_time("2021-01-15")
def test_application_update_updating_and_adding_application_events(
    user_api_client,
    application,
    organisation,
    person,
    purpose,
    application_round,
    application_event,
    valid_application_event_data,
):
    assert Application.objects.count() == 1
    application_event.num_persons = 20

    existing_event = dict(valid_application_event_data)
    existing_event["id"] = application_event.id
    existing_event["name"] = "Updated name"
    existing_event["num_persons"] = 112
    existing_event["application_event_schedules"] = [
        {"day": 3, "begin": "10:40", "end": "16:30"}
    ]

    valid_application_event_data["name"] = "New event name"
    data = {
        "id": application.id,
        "applicant_type": Application.APPLICANT_TYPE_INDIVIDUAL,
        "organisation": None,
        "contact_person": {
            "id": None,
            "first_name": "Hak",
            "last_name": "Ija",
            "email": "hak.ija@test.com",
            "phone_number": "123-123",
        },
        "application_round_id": application_round.id,
        "application_events": [existing_event, valid_application_event_data],
        "status": "draft",
        "billing_address": None,
    }

    response = user_api_client.put(
        reverse("application-detail", kwargs={"pk": application.id}),
        data=data,
        format="json",
    )
    assert response.status_code == 200
    assert len(response.data.get("application_events")) == 2

    event = next(
        x
        for x in response.data.get("application_events")
        if x.get("id") == existing_event.get("id")
    )
    assert event.get("num_persons") == 112
    assert event.get("name") == "Updated name"
    assert event.get("application_event_schedules")[0].get("day") == 3

    assert (
        next(
            x
            for x in response.data.get("application_events")
            if x.get("id") != existing_event.get("id")
        ).get("name")
        == "New event name"
    )


@pytest.mark.django_db
@freeze_time("2021-01-15")
def test_application_update_should_remove_application_events_if_no_longer_in_data(
    user_api_client,
    application,
    organisation,
    person,
    purpose,
    application_round,
    application_event,
    valid_application_event_data,
):
    assert Application.objects.count() == 1
    application_event.num_persons = 20

    valid_application_event_data["name"] = "New event name"
    data = {
        "id": application.id,
        "applicant_type": Application.APPLICANT_TYPE_INDIVIDUAL,
        "organisation": None,
        "contact_person": {
            "id": None,
            "first_name": "John",
            "last_name": "Wayne",
            "email": "john@test.com",
            "phone_number": "123-123",
        },
        "application_round_id": application_round.id,
        "application_events": [valid_application_event_data],
        "status": "draft",
        "billing_address": None,
    }

    response = user_api_client.put(
        reverse("application-detail", kwargs={"pk": application.id}),
        data=data,
        format="json",
    )
    assert response.status_code == 200
    assert len(response.data.get("application_events")) == 1

    assert response.data.get("application_events")[0].get("name") == "New event name"


@pytest.mark.django_db
def test_application_fetch(user_api_client, application):
    response = user_api_client.get(reverse("application-list"))
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0].get("id") == application.id
    assert response.data[0].get("contact_person")["last_name"] == "Legend"


@pytest.mark.django_db
@freeze_time("2021-01-15")
def test_application_event_save(user_api_client, valid_application_event_data):
    assert ApplicationEvent.objects.count() == 0
    data = valid_application_event_data

    response = user_api_client.post(
        reverse("application_event-list"), data=data, format="json"
    )

    assert response.status_code == 201

    assert response.data.get("min_duration") == "01:15:00"
    assert response.data.get("name") == valid_application_event_data["name"]
    assert ApplicationEvent.objects.count() == 1


@pytest.mark.django_db
@freeze_time("2021-01-15")
def test_application_event_reduction_count(
    user_api_client, application_event, event_reduction
):

    response = user_api_client.get(
        reverse("application_event-detail", kwargs={"pk": application_event.id}),
        format="json",
    )

    assert response.status_code == 200
    assert response.data.get("weekly_amount_reductions_count") == 1


@pytest.mark.django_db
@freeze_time("2021-01-15")
def test_application_event_invalid_durations(
    user_api_client, valid_application_event_data
):
    assert ApplicationEvent.objects.count() == 0
    data = valid_application_event_data
    data["max_duration"] = "00:45:00"

    response = user_api_client.post(
        reverse("application_event-list"), data=data, format="json"
    )
    assert response.status_code == 400

    assert (
        "Maximum duration should be larger than minimum duration"
        in response.data["non_field_errors"]
    )


@pytest.mark.django_db
@freeze_time("2021-01-15")
def test_application_update_review_valid(
    user_api_client,
    application,
    organisation,
    person,
    purpose,
    application_round,
    valid_application_event_data,
):
    assert Application.objects.count() == 1

    data = {
        "id": application.id,
        "applicant_type": Application.APPLICANT_TYPE_COMPANY,
        "organisation": {
            "id": organisation.id,
            "identifier": organisation.identifier,
            "name": "Super organisation modified",
            "address": {
                "street_address": "Osoitetie 11b",
                "post_code": 33540,
                "city": "Tampere",
            },
        },
        "contact_person": {
            "id": person.id,
            "first_name": person.first_name,
            "last_name": "The modified",
            "email": person.email,
            "phone_number": person.phone_number,
        },
        "application_round_id": application_round.id,
        "application_events": [valid_application_event_data],
        "status": "in_review",
        "billing_address": None,
    }

    response = user_api_client.put(
        reverse("application-detail", kwargs={"pk": application.id}),
        data=data,
        format="json",
    )
    assert response.status_code == 200


@pytest.mark.django_db
@freeze_time("2021-01-15")
def test_application_review_invalid(
    purpose,
    application_round,
    user_api_client,
    user,
):
    data = {
        "organisation": {
            "id": None,
            "identifier": "123-identifier",
            "name": "Super organisation",
        },
        "contact_person": {
            "id": None,
            "first_name": "John",
            "last_name": "Wayne",
            "email": "john@test.com",
            "phone_number": "123-123",
        },
        "application_round_id": application_round.id,
        "application_events": [],
        "status": "review",
    }
    response = user_api_client.post(reverse("application-list"), data, format="json")
    assert response.status_code == 400


@pytest.mark.django_db
@freeze_time("2021-01-15")
def test_application_update_should_update_contact_person_and_billing_address(
    user_api_client,
    application,
    organisation,
    person,
    purpose,
    application_round,
    billing_address,
):
    assert Application.objects.count() == 1

    data = {
        "contact_person": {
            "id": person.id,
            "first_name": person.first_name,
            "last_name": "Modified",
            "email": person.email,
            "phone_number": person.phone_number,
        },
        "billing_address": {
            "id": billing_address.id,
            "street_address": "No bills please",
            "post_code": "99999",
            "city": "None",
        },
    }

    response = user_api_client.patch(
        reverse("application-detail", kwargs={"pk": application.id}),
        data=data,
        format="json",
    )

    assert response.status_code == 200
    assert response.data.get("contact_person")["id"] == person.id
    assert response.data.get("contact_person")["last_name"] == "Modified"
    assert response.data.get("billing_address")["id"] == billing_address.id
    assert response.data.get("billing_address")["street_address"] == "No bills please"


@pytest.mark.django_db
@freeze_time("2021-01-15")
def test_application_update_should_create_new_contact_person_and_billing_address(
    user_api_client,
    application,
    organisation,
    person,
    purpose,
    application_round,
    billing_address,
):
    assert Application.objects.count() == 1

    data = {
        "contact_person": {
            "first_name": "John",
            "last_name": "Malkovich",
            "email": "test@test.com",
            "phone_number": "123",
        },
        "billing_address": {
            "street_address": "Bill me",
            "post_code": "00100",
            "city": "Helsinki",
        },
    }

    response = user_api_client.patch(
        reverse("application-detail", kwargs={"pk": application.id}),
        data=data,
        format="json",
    )

    assert response.status_code == 200
    assert response.data.get("contact_person")["id"] != person.id
    assert response.data.get("contact_person")["last_name"] == "Malkovich"
    assert response.data.get("billing_address")["id"] != billing_address.id
    assert response.data.get("billing_address")["street_address"] == "Bill me"


@pytest.mark.django_db
def test_unauthenticated_cannot_create_application(
    unauthenticated_api_client, valid_application_data
):
    response = unauthenticated_api_client.post(
        reverse("application-list"), valid_application_data, format="json"
    )
    assert response.status_code == 401


@pytest.mark.django_db
def test_user_can_create_application(user_api_client, valid_application_data):
    response = user_api_client.post(
        reverse("application-list"), valid_application_data, format="json"
    )
    assert response.status_code == 201


@pytest.mark.django_db
@freeze_time("2021-01-15")
def test_user_can_update_own_application(
    user_api_client, application, valid_application_data
):
    response = user_api_client.put(
        reverse("application-detail", kwargs={"pk": application.id}),
        data=valid_application_data,
        format="json",
    )
    assert response.status_code == 200


@pytest.mark.django_db
@freeze_time("2021-01-15")
def test_user_cannot_update_own_application_status_to_review_done(
    user_api_client, application, valid_application_data
):
    valid_application_data["status"] = ApplicationStatus.REVIEW_DONE
    response = user_api_client.put(
        reverse("application-detail", kwargs={"pk": application.id}),
        data=valid_application_data,
        format="json",
    )
    assert response.status_code == 400


@pytest.mark.django_db
@freeze_time("2021-02-01")
def test_user_cannot_update_own_application_after_period_end(
    user_api_client, application, valid_application_data
):
    response = user_api_client.put(
        reverse("application-detail", kwargs={"pk": application.id}),
        data=valid_application_data,
        format="json",
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_user_cannot_see_or_update_other_users_application(
    user_2_api_client, application, valid_application_data
):
    response = user_2_api_client.get(
        reverse("application-detail", kwargs={"pk": application.id}),
        format="json",
    )
    assert response.status_code == 404

    response = user_2_api_client.put(
        reverse("application-detail", kwargs={"pk": application.id}),
        data=valid_application_data,
        format="json",
    )
    assert response.status_code == 404


@pytest.mark.django_db
def test_general_admin_can_update_users_application(
    general_admin_api_client, application, valid_application_data
):
    response = general_admin_api_client.put(
        reverse("application-detail", kwargs={"pk": application.id}),
        data=valid_application_data,
        format="json",
    )
    assert response.status_code == 200


@pytest.mark.django_db
def test_service_sector_admin_can_update_users_application(
    service_sector_admin_api_client, application, valid_application_data
):
    response = service_sector_admin_api_client.put(
        reverse("application-detail", kwargs={"pk": application.id}),
        data=valid_application_data,
        format="json",
    )
    assert response.status_code == 200


@pytest.mark.django_db
def test_service_sector_application_manager_can_update_users_application(
    service_sector_application_manager_api_client, application, valid_application_data
):
    response = service_sector_application_manager_api_client.put(
        reverse("application-detail", kwargs={"pk": application.id}),
        data=valid_application_data,
        format="json",
    )
    assert response.status_code == 200


@pytest.mark.django_db
def test_wrong_service_sector_admin_cannot_create_or_update_application(
    service_sector_2_admin_api_client, application, valid_application_data
):
    response = service_sector_2_admin_api_client.get(
        reverse("application-detail", kwargs={"pk": application.id}),
        format="json",
    )
    assert response.status_code == 404

    response = service_sector_2_admin_api_client.put(
        reverse("application-detail", kwargs={"pk": application.id}),
        data=valid_application_data,
        format="json",
    )
    assert response.status_code == 404


@pytest.mark.django_db
@freeze_time("2021-01-15")
def test_user_can_create_application_event(
    user_api_client, valid_application_event_data
):
    response = user_api_client.post(
        reverse("application_event-list"),
        data=valid_application_event_data,
        format="json",
    )
    assert response.status_code == 201


@pytest.mark.django_db
@freeze_time("2021-01-15")
def test_user_can_update_application_event(
    user_api_client, valid_application_event_data, application_event
):
    response = user_api_client.put(
        reverse("application_event-detail", kwargs={"pk": application_event.id}),
        data=valid_application_event_data,
        format="json",
    )
    assert response.status_code == 200


@pytest.mark.django_db
def test_user_cannot_view_other_users_application_event(
    user_2_api_client, application_event
):
    response = user_2_api_client.get(
        reverse("application_event-detail", kwargs={"pk": application_event.id}),
        format="json",
    )
    assert response.status_code == 404


@pytest.mark.django_db
def test_user_cannot_update_other_users_application_event(
    user_2_api_client, application_event, valid_application_event_data
):
    response = user_2_api_client.put(
        reverse("application_event-detail", kwargs={"pk": application_event.id}),
        data=valid_application_event_data,
        format="json",
    )
    assert response.status_code == 404


@pytest.mark.django_db
def test_general_admin_can_update_users_application_event(
    general_admin_api_client, application_event, valid_application_event_data
):
    response = general_admin_api_client.put(
        reverse("application_event-detail", kwargs={"pk": application_event.id}),
        data=valid_application_event_data,
        format="json",
    )

    assert response.status_code == 200


@pytest.mark.django_db
def test_service_sector_admin_can_update_users_application_event(
    service_sector_admin_api_client, application_event, valid_application_event_data
):
    response = service_sector_admin_api_client.put(
        reverse("application_event-detail", kwargs={"pk": application_event.id}),
        data=valid_application_event_data,
        format="json",
    )
    assert response.status_code == 200


@pytest.mark.django_db
def test_service_sector_application_manager_can_update_users_application_event(
    service_sector_application_manager_api_client,
    application_event,
    valid_application_event_data,
):
    response = service_sector_application_manager_api_client.put(
        reverse("application_event-detail", kwargs={"pk": application_event.id}),
        data=valid_application_event_data,
        format="json",
    )
    assert response.status_code == 200


@pytest.mark.django_db
def test_wrong_service_sector_admin_cannot_view_or_update_users_application_event(
    service_sector_2_admin_api_client, application_event, valid_application_event_data
):
    response = service_sector_2_admin_api_client.put(
        reverse("application_event-detail", kwargs={"pk": application_event.id}),
        data=valid_application_event_data,
        format="json",
    )
    assert response.status_code == 404


@pytest.mark.django_db
def test_creating_weekly_amount_reduction_should_mark_declined(
    result_scheduled_for_monday,
    general_admin_api_client,
):
    assert_that(ApplicationEventWeeklyAmountReduction.objects.count()).is_equal_to(0)
    assert_that(ApplicationEventScheduleResult.objects.count()).is_equal_to(1)

    data = {
        "application_event_schedule_result_id": result_scheduled_for_monday.application_event_schedule.id
    }

    response = general_admin_api_client.post(
        reverse("application_event_weekly_amount_reduction-list"), data, format="json"
    )
    assert_that(response.status_code).is_equal_to(201)
    assert_that(
        ApplicationEventScheduleResult.objects.get(
            application_event_schedule_id=result_scheduled_for_monday.application_event_schedule.id
        ).declined
    ).is_true()


@pytest.mark.django_db
def test_cant_create_more_reductions_than_events_per_week(
    application_event, general_admin_api_client, result_scheduled_for_monday
):

    for i in range(application_event.events_per_week):
        ApplicationEventWeeklyAmountReduction.objects.create(
            application_event=application_event
        )
    assert_that(ApplicationEventWeeklyAmountReduction.objects.count()).is_equal_to(2)

    data = {
        "application_event_schedule_result_id": result_scheduled_for_monday.application_event_schedule.id
    }

    response = general_admin_api_client.post(
        reverse("application_event_weekly_amount_reduction-list"), data, format="json"
    )
    assert_that(response.status_code).is_equal_to(400)
    assert_that(
        ApplicationEventScheduleResult.objects.get(
            pk=result_scheduled_for_monday.application_event_schedule.id
        ).declined
    ).is_false()


@pytest.mark.django_db
def test_cant_reduce_with_accepted_result(
    application_event, general_admin_api_client, result_scheduled_for_monday
):
    result_scheduled_for_monday.accepted = True
    result_scheduled_for_monday.save()

    assert_that(ApplicationEventWeeklyAmountReduction.objects.count()).is_equal_to(0)

    data = {
        "application_event_schedule_result_id": result_scheduled_for_monday.application_event_schedule.id
    }

    response = general_admin_api_client.post(
        reverse("application_event_weekly_amount_reduction-list"), data, format="json"
    )
    assert_that(response.status_code).is_equal_to(400)
    assert_that(ApplicationEventWeeklyAmountReduction.objects.count()).is_equal_to(0)
    assert_that(
        ApplicationEventScheduleResult.objects.get(
            pk=result_scheduled_for_monday.application_event_schedule.id
        ).declined
    ).is_false()


@pytest.mark.django_db
def test_regular_user_cant_create_reductions(
    result_scheduled_for_monday,
    user_api_client,
):

    data = {
        "application_event_schedule_result_id": result_scheduled_for_monday.application_event_schedule.id
    }

    response = user_api_client.post(
        reverse("application_event_weekly_amount_reduction-list"), data, format="json"
    )
    assert_that(response.status_code).is_equal_to(403)


@pytest.mark.django_db
def test_wrong_service_sector_admin_cant_create_reductions(
    result_scheduled_for_monday,
    service_sector_2_admin_api_client,
):

    data = {
        "application_event_schedule_result_id": result_scheduled_for_monday.application_event_schedule.id
    }

    response = service_sector_2_admin_api_client.post(
        reverse("application_event_weekly_amount_reduction-list"), data, format="json"
    )
    assert_that(response.status_code).is_equal_to(403)


@pytest.mark.django_db
def test_deleting_weekly_reductions(
    event_reduction,
    general_admin_api_client,
):
    assert_that(ApplicationEventWeeklyAmountReduction.objects.count()).is_equal_to(1)

    response = general_admin_api_client.delete(
        reverse(
            "application_event_weekly_amount_reduction-detail",
            kwargs={"pk": event_reduction.id},
        ),
        format="json",
    )
    assert_that(response.status_code).is_equal_to(204)
    assert_that(ApplicationEventScheduleResult.objects.count()).is_equal_to(0)


@pytest.mark.django_db
def test_application_status_set_sent_from_in_review_fails(
    general_admin_api_client, application, valid_application_data
):
    assert Application.objects.count() == 1
    application.set_status(ApplicationStatus.IN_REVIEW)
    valid_application_data["status"] = ApplicationStatus.SENT

    response = general_admin_api_client.put(
        reverse("application-detail", kwargs={"pk": application.id}),
        data=valid_application_data,
        format="json",
    )

    assert response.status_code == 400
    application.refresh_from_db()
    assert application.status == ApplicationStatus.IN_REVIEW


@pytest.mark.django_db
def test_application_status_set_sent_from_draft_fails(
    general_admin_api_client, application, valid_application_data
):
    assert Application.objects.count() == 1
    application.set_status(ApplicationStatus.DRAFT)
    valid_application_data["status"] = ApplicationStatus.SENT

    response = general_admin_api_client.put(
        reverse("application-detail", kwargs={"pk": application.id}),
        data=valid_application_data,
        format="json",
    )

    assert response.status_code == 400
    application.refresh_from_db()
    assert application.status == ApplicationStatus.DRAFT


@pytest.mark.django_db
def test_application_status_set_sent_assigns_when_not_in_review_nor_draft(
    general_admin_api_client, application, valid_application_data
):
    assert Application.objects.count() == 1
    application.set_status(ApplicationStatus.REVIEW_DONE)
    valid_application_data["status"] = ApplicationStatus.SENT

    response = general_admin_api_client.put(
        reverse("application-detail", kwargs={"pk": application.id}),
        data=valid_application_data,
        format="json",
    )

    assert response.status_code == 200
    application.refresh_from_db()
    assert application.status == ApplicationStatus.SENT
