from __future__ import annotations

import datetime

import pytest
from graphql_relay import to_global_id

from tilavarauspalvelu.enums import (
    ReservationStateChoice,
    ReservationTypeChoice,
    ReservationUnitPublishingState,
    TermsOfUseTypeChoices,
    Weekday,
)
from utils.date_utils import local_date, local_datetime, next_hour

from tests.factories import (
    ApplicationRoundFactory,
    ApplicationRoundTimeSlotFactory,
    EquipmentFactory,
    PaymentMerchantFactory,
    PaymentProductFactory,
    PurposeFactory,
    ReservationFactory,
    ReservationMetadataSetFactory,
    ReservationUnitCancellationRuleFactory,
    ReservationUnitFactory,
    ResourceFactory,
    SpaceFactory,
    TermsOfUseFactory,
    UserFactory,
)

from .helpers import reservation_unit_query, reservation_units_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# Single


def test_reservation_unit__single__query(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create()
    global_id = to_global_id("ReservationUnitNode", reservation_unit.pk)
    query = reservation_unit_query(id=global_id)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert response.first_query_object == {"pk": reservation_unit.pk}


def test_reservation_unit__single__query__authentication(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create()

    fields = "authentication"
    global_id = to_global_id("ReservationUnitNode", reservation_unit.pk)
    query = reservation_unit_query(fields=fields, id=global_id)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert response.first_query_object == {
        "authentication": reservation_unit.authentication.upper(),
    }


def test_reservation_unit__single__query__reservation_blocks_whole_day(graphql):
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(reservation_block_whole_day=True)

    fields = "reservationBlockWholeDay"
    global_id = to_global_id("ReservationUnitNode", reservation_unit.pk)
    query = reservation_unit_query(id=global_id, fields=fields)
    response = graphql(query)

    assert response.has_errors is False
    assert response.first_query_object == {
        "reservationBlockWholeDay": reservation_unit.reservation_block_whole_day,
    }


# Multiple


def test_reservation_unit__query__all_fields(graphql):
    graphql.login_with_superuser()

    fields = """
        pk
        extUuid
        rank

        nameFi
        nameEn
        nameSv
        descriptionFi
        descriptionEn
        descriptionSv
        contactInformation
        notesWhenApplyingFi
        notesWhenApplyingEn
        notesWhenApplyingSv
        reservationPendingInstructionsFi
        reservationPendingInstructionsSv
        reservationPendingInstructionsEn
        reservationConfirmedInstructionsFi
        reservationConfirmedInstructionsSv
        reservationConfirmedInstructionsEn
        reservationCancelledInstructionsFi
        reservationCancelledInstructionsSv
        reservationCancelledInstructionsEn

        surfaceArea
        minPersons
        maxPersons
        maxReservationsPerUser
        reservationsMinDaysBefore
        reservationsMaxDaysBefore

        reservationBeginsAt
        reservationEndsAt
        publishBeginsAt
        publishEndsAt
        minReservationDuration
        maxReservationDuration
        bufferTimeBefore
        bufferTimeAfter

        isDraft
        isArchived
        requireReservationHandling
        reservationBlockWholeDay
        canApplyFreeOfCharge
        allowReservationsWithoutOpeningHours

        authentication
        reservationStartInterval
        reservationKind
        publishingState
        reservationState
        currentAccessType
    """

    reservation_unit = ReservationUnitFactory.create(
        surface_area=100,
        min_persons=10,
        max_persons=100,
        max_reservations_per_user=5,
        reservations_min_days_before=1,
        reservations_max_days_before=10,
        buffer_time_before=datetime.timedelta(minutes=15),
        buffer_time_after=datetime.timedelta(minutes=15),
        reservation_begins_at=datetime.datetime(2021, 5, 3, tzinfo=datetime.UTC),
        reservation_ends_at=datetime.datetime(2021, 5, 3, tzinfo=datetime.UTC),
        publish_begins_at=datetime.datetime(2021, 5, 3, tzinfo=datetime.UTC),
        publish_ends_at=datetime.datetime(2021, 5, 3, tzinfo=datetime.UTC),
        min_reservation_duration=datetime.timedelta(minutes=15),
        max_reservation_duration=datetime.timedelta(hours=2),
    )
    query = reservation_units_query(fields=fields)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": reservation_unit.pk,
        "extUuid": str(reservation_unit.ext_uuid),
        "rank": reservation_unit.rank,
        #
        "nameFi": reservation_unit.name_fi,
        "nameEn": reservation_unit.name_en,
        "nameSv": reservation_unit.name_sv,
        "descriptionFi": reservation_unit.description_fi,
        "descriptionEn": reservation_unit.description_en,
        "descriptionSv": reservation_unit.description_sv,
        "notesWhenApplyingFi": reservation_unit.notes_when_applying_fi,
        "notesWhenApplyingEn": reservation_unit.notes_when_applying_en,
        "notesWhenApplyingSv": reservation_unit.notes_when_applying_sv,
        "contactInformation": reservation_unit.contact_information,
        "reservationPendingInstructionsEn": reservation_unit.reservation_pending_instructions_en,
        "reservationPendingInstructionsFi": reservation_unit.reservation_pending_instructions_fi,
        "reservationPendingInstructionsSv": reservation_unit.reservation_pending_instructions_sv,
        "reservationConfirmedInstructionsEn": reservation_unit.reservation_confirmed_instructions_en,
        "reservationConfirmedInstructionsFi": reservation_unit.reservation_confirmed_instructions_fi,
        "reservationConfirmedInstructionsSv": reservation_unit.reservation_confirmed_instructions_sv,
        "reservationCancelledInstructionsEn": reservation_unit.reservation_cancelled_instructions_en,
        "reservationCancelledInstructionsFi": reservation_unit.reservation_cancelled_instructions_fi,
        "reservationCancelledInstructionsSv": reservation_unit.reservation_cancelled_instructions_sv,
        #
        "surfaceArea": reservation_unit.surface_area,
        "minPersons": reservation_unit.min_persons,
        "maxPersons": reservation_unit.max_persons,
        "maxReservationsPerUser": reservation_unit.max_reservations_per_user,
        "reservationsMinDaysBefore": reservation_unit.reservations_min_days_before,
        "reservationsMaxDaysBefore": reservation_unit.reservations_max_days_before,
        #
        "reservationBeginsAt": reservation_unit.reservation_begins_at.isoformat(),
        "reservationEndsAt": reservation_unit.reservation_ends_at.isoformat(),
        "publishBeginsAt": reservation_unit.publish_begins_at.isoformat(),
        "publishEndsAt": reservation_unit.publish_ends_at.isoformat(),
        "minReservationDuration": int(reservation_unit.min_reservation_duration.total_seconds()),
        "maxReservationDuration": int(reservation_unit.max_reservation_duration.total_seconds()),
        "bufferTimeBefore": int(reservation_unit.buffer_time_before.total_seconds()),
        "bufferTimeAfter": int(reservation_unit.buffer_time_after.total_seconds()),
        #
        "isDraft": reservation_unit.is_draft,
        "isArchived": reservation_unit.is_archived,
        "requireReservationHandling": reservation_unit.require_reservation_handling,
        "reservationBlockWholeDay": reservation_unit.reservation_block_whole_day,
        "canApplyFreeOfCharge": reservation_unit.can_apply_free_of_charge,
        "allowReservationsWithoutOpeningHours": reservation_unit.allow_reservations_without_opening_hours,
        #
        "authentication": reservation_unit.authentication.upper(),
        "reservationStartInterval": reservation_unit.reservation_start_interval.upper(),
        "reservationKind": reservation_unit.reservation_kind.upper(),
        "publishingState": reservation_unit.publishing_state,
        "reservationState": reservation_unit.reservation_state,
        "currentAccessType": reservation_unit.current_access_type,
    }


def test_reservation_unit__query__all_to_one_relations(graphql):
    graphql.login_with_superuser()

    fields = """
        pk
        unit {
            nameFi
        }
        reservationUnitType {
            nameFi
        }
        cancellationRule {
            nameFi
        }
        metadataSet {
            name
        }
        cancellationTerms {
            termsType
        }
        serviceSpecificTerms {
            termsType
        }
        pricingTerms {
            termsType
        }
        paymentTerms {
            termsType
        }
        paymentProduct {
            pk
        }
        paymentMerchant {
            name
        }
    """

    reservation_unit = ReservationUnitFactory.create(
        cancellation_rule=ReservationUnitCancellationRuleFactory.create(),
        metadata_set=ReservationMetadataSetFactory.create(),
        cancellation_terms=TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.CANCELLATION),
        service_specific_terms=TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.SERVICE),
        pricing_terms=TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PRICING),
        payment_terms=TermsOfUseFactory.create(terms_type=TermsOfUseTypeChoices.PAYMENT),
        payment_product=PaymentProductFactory.create(),
        payment_merchant=PaymentMerchantFactory.create(),
    )
    query = reservation_units_query(fields=fields)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": reservation_unit.pk,
        "unit": {
            "nameFi": reservation_unit.unit.name_fi,
        },
        "reservationUnitType": {
            "nameFi": reservation_unit.reservation_unit_type.name_fi,
        },
        "cancellationRule": {
            "nameFi": reservation_unit.cancellation_rule.name_fi,
        },
        "metadataSet": {
            "name": reservation_unit.metadata_set.name,
        },
        "cancellationTerms": {
            "termsType": reservation_unit.cancellation_terms.terms_type.upper(),
        },
        "serviceSpecificTerms": {
            "termsType": reservation_unit.service_specific_terms.terms_type.upper(),
        },
        "pricingTerms": {
            "termsType": reservation_unit.pricing_terms.terms_type.upper(),
        },
        "paymentTerms": {
            "termsType": reservation_unit.payment_terms.terms_type.upper(),
        },
        "paymentProduct": {
            "pk": str(reservation_unit.payment_product.pk),
        },
        "paymentMerchant": {
            "name": reservation_unit.payment_merchant.name,
        },
    }


def test_reservation_unit__query__all_one_to_many_relations(graphql):
    fields = """
        pk
        pricings {
            begins
            taxPercentage {
                value
            }
        }
        images {
            largeUrl
        }
        applicationRoundTimeSlots {
            isClosed
        }
        accessTypes {
            accessType
            beginDate
        }
        reservations {
            beginsAt
        }
    """

    reservation_unit = ReservationUnitFactory.create(
        pricings__highest_price=20,
        images__large_url="https://example.com",
        application_round_time_slots__is_closed=False,
        access_types__begin_date=local_date(),
    )
    ReservationFactory.create(reservation_unit=reservation_unit)

    graphql.login_with_superuser()
    query = reservation_units_query(fields=fields)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": reservation_unit.pk,
        "pricings": [
            {
                "begins": reservation_unit.pricings.first().begins.isoformat(),
                "taxPercentage": {
                    "value": str(reservation_unit.pricings.first().tax_percentage.value),
                },
            },
        ],
        "images": [
            {
                "largeUrl": reservation_unit.images.first().large_url,
            },
        ],
        "applicationRoundTimeSlots": [
            {
                "isClosed": reservation_unit.application_round_time_slots.first().is_closed,
            },
        ],
        "accessTypes": [
            {
                "accessType": reservation_unit.access_types.first().access_type,
                "beginDate": reservation_unit.access_types.first().begin_date.isoformat(),
            },
        ],
        "reservations": [
            {
                "beginsAt": reservation_unit.reservations.first().begins_at.isoformat(),
            },
        ],
    }


def test_reservation_unit__query__all_many_to_many_relations(graphql):
    graphql.login_with_superuser()

    fields = """
        pk
        spaces {
            nameFi
        }
        resources {
            nameFi
        }
        purposes {
            nameFi
        }
        equipments {
            nameFi
        }
        applicationRounds {
            nameFi
        }
    """

    reservation_unit = ReservationUnitFactory.create(
        spaces=[SpaceFactory.create()],
        resources=[ResourceFactory.create()],
        purposes=[PurposeFactory.create()],
        equipments=[EquipmentFactory.create()],
        application_rounds=[ApplicationRoundFactory.create()],
    )

    query = reservation_units_query(fields=fields)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": reservation_unit.pk,
        #
        # Forward
        "spaces": [
            {
                "nameFi": reservation_unit.spaces.first().name_fi,
            },
        ],
        "resources": [
            {
                "nameFi": reservation_unit.resources.first().name_fi,
            },
        ],
        "purposes": [
            {
                "nameFi": reservation_unit.purposes.first().name_fi,
            },
        ],
        "equipments": [
            {
                "nameFi": reservation_unit.equipments.first().name_fi,
            },
        ],
        #
        # Reverse
        "applicationRounds": [
            {
                "nameFi": reservation_unit.application_rounds.first().name_fi,
            },
        ],
    }


def test_reservation_unit__query__hide_archived(graphql):
    graphql.login_with_superuser()

    ReservationUnitFactory.create(is_archived=True)
    query = reservation_units_query()
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 0


def test_reservation_unit__query__state__draft(graphql):
    reservation_unit = ReservationUnitFactory.create(is_draft=True)

    query = reservation_units_query(fields="publishingState", pk=reservation_unit.pk)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {"publishingState": ReservationUnitPublishingState.DRAFT.value}


def test_reservation_unit__query__state__scheduled_publishing(graphql):
    now = local_datetime()
    reservation_unit = ReservationUnitFactory.create(
        publish_begins_at=now + datetime.timedelta(hours=1),
        publish_ends_at=None,
    )

    query = reservation_units_query(fields="publishingState", pk=reservation_unit.pk)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {"publishingState": ReservationUnitPublishingState.SCHEDULED_PUBLISHING.value}


def test_reservation_unit__query__state__scheduled_hiding(graphql):
    now = local_datetime()
    reservation_unit = ReservationUnitFactory.create(
        publish_begins_at=now - datetime.timedelta(days=1),
        publish_ends_at=now + datetime.timedelta(days=2),
    )

    query = reservation_units_query(fields="publishingState", pk=reservation_unit.pk)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {"publishingState": ReservationUnitPublishingState.SCHEDULED_HIDING.value}


def test_reservation_unit__query__state__hidden(graphql):
    now = local_datetime()
    reservation_unit = ReservationUnitFactory.create(
        publish_begins_at=now - datetime.timedelta(days=2),
        publish_ends_at=now - datetime.timedelta(days=1),
    )

    query = reservation_units_query(fields="publishingState", pk=reservation_unit.pk)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {"publishingState": ReservationUnitPublishingState.HIDDEN.value}


def test_reservation_unit__query__state__scheduled_period(graphql):
    now = local_datetime()
    reservation_unit = ReservationUnitFactory.create(
        publish_begins_at=now + datetime.timedelta(days=2),
        publish_ends_at=now + datetime.timedelta(days=3),
    )

    query = reservation_units_query(fields="publishingState", pk=reservation_unit.pk)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {"publishingState": ReservationUnitPublishingState.SCHEDULED_PERIOD.value}


def test_reservation_unit__query__state__published(graphql):
    reservation_unit = ReservationUnitFactory.create(
        publish_begins_at=None,
        publish_ends_at=None,
        reservation_begins_at=None,
        reservation_ends_at=None,
    )

    query = reservation_units_query(fields="publishingState", pk=reservation_unit.pk)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {"publishingState": ReservationUnitPublishingState.PUBLISHED.value}


def test_reservation_unit__query__reservation_blocks_whole_day(graphql):
    reservation_unit = ReservationUnitFactory.create(reservation_block_whole_day=True)
    graphql.login_with_superuser()

    query = reservation_units_query(fields="pk reservationBlockWholeDay")
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": reservation_unit.pk,
        "reservationBlockWholeDay": reservation_unit.reservation_block_whole_day,
    }


def test_reservation_unit__query__timeslots(graphql):
    # given:
    # - There is a reservation unit with timeslots
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create()
    ApplicationRoundTimeSlotFactory.create(reservation_unit=reservation_unit, weekday=Weekday.MONDAY)
    ApplicationRoundTimeSlotFactory.create_closed(reservation_unit=reservation_unit, weekday=Weekday.WEDNESDAY)
    graphql.login_with_superuser()

    # when:
    # - The reservation unit timeslots are queried
    fields = "applicationRoundTimeSlots { weekday isClosed reservableTimes { begin end } }"
    query = reservation_units_query(fields=fields)
    response = graphql(query)

    # then:
    # - The response contains the application round timeslots
    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {
        "applicationRoundTimeSlots": [
            {
                "weekday": Weekday.MONDAY.value,
                "isClosed": False,
                "reservableTimes": [
                    {
                        "begin": "10:00:00",
                        "end": "12:00:00",
                    }
                ],
            },
            {
                "weekday": Weekday.WEDNESDAY.value,
                "isClosed": True,
                "reservableTimes": [],
            },
        ]
    }


def test_reservation_unit__query__timeslots__not_found(graphql):
    # given:
    # - There is a reservation unit without any timeslots
    # - A superuser is using the system
    ReservationUnitFactory.create()
    graphql.login_with_superuser()

    # when:
    # - The reservation unit timeslots are queried
    fields = "applicationRoundTimeSlots { weekday isClosed reservableTimes { begin end } }"
    query = reservation_units_query(fields=fields)
    response = graphql(query)

    # then:
    # - The response contains no timeslots
    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"applicationRoundTimeSlots": []}


def test_reservation_unit__query__payment_merchant__from_reservation_unit(graphql):
    merchant = PaymentMerchantFactory.create()
    ReservationUnitFactory.create(payment_merchant=merchant)

    graphql.login_with_superuser()
    query = reservation_units_query(fields="paymentMerchant { name }")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {"paymentMerchant": {"name": merchant.name}}


def test_reservation_unit__query__payment_merchant__from_unit(graphql):
    merchant = PaymentMerchantFactory.create()
    ReservationUnitFactory.create(unit__payment_merchant=merchant)

    graphql.login_with_superuser()
    query = reservation_units_query(fields="paymentMerchant { name }")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {"paymentMerchant": {"name": merchant.name}}


def test_reservation_unit__query__payment_product(graphql):
    merchant = PaymentMerchantFactory.create()
    product = PaymentProductFactory.create(merchant=merchant)
    ReservationUnitFactory.create(payment_merchant=merchant, payment_product=product)

    graphql.login_with_superuser()
    query = reservation_units_query(fields="paymentProduct { pk merchant { pk } }")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {
        "paymentProduct": {
            "pk": str(product.id),
            "merchant": {
                "pk": str(merchant.id),
            },
        },
    }


def test_reservation_unit__query__num_active_user_reservations(graphql):
    user = graphql.login_with_regular_user()
    other_user = UserFactory.create()

    reservation_unit = ReservationUnitFactory.create()

    begin = next_hour(plus_hours=1)
    end = begin + datetime.timedelta(hours=1)

    # Correct user
    ReservationFactory.create_for_reservation_unit(
        begins_at=begin,
        ends_at=end,
        reservation_unit=reservation_unit,
        user=user,
    )
    # Another user
    ReservationFactory.create_for_reservation_unit(
        begins_at=begin,
        ends_at=end,
        reservation_unit=reservation_unit,
        user=other_user,
    )
    # Unauthenticated user
    ReservationFactory.create_for_reservation_unit(
        begins_at=begin,
        ends_at=end,
        reservation_unit=reservation_unit,
    )
    # Another reservation unit
    ReservationFactory.create(begins_at=begin, ends_at=end)
    # Another reservation unit with correct user
    ReservationFactory.create(begins_at=begin, ends_at=end, user=user)
    # Past reservation
    ReservationFactory.create_for_reservation_unit(
        begins_at=begin - datetime.timedelta(days=1),
        ends_at=end - datetime.timedelta(days=1),
        reservation_unit=reservation_unit,
        user=user,
    )
    # Denied reservation
    ReservationFactory.create_for_reservation_unit(
        begins_at=begin,
        ends_at=end,
        reservation_unit=reservation_unit,
        user=user,
        state=ReservationStateChoice.DENIED,
    )
    # Only NORMAL type choice should affect the count, all others should be ignored
    for type_choice in [
        ReservationTypeChoice.BLOCKED,
        ReservationTypeChoice.STAFF,
        ReservationTypeChoice.BEHALF,
        ReservationTypeChoice.SEASONAL,
    ]:
        ReservationFactory.create_for_reservation_unit(
            begins_at=begin,
            ends_at=end,
            reservation_unit=reservation_unit,
            user=user,
            type=type_choice,
        )

    query = reservation_units_query(fields="numActiveUserReservations", pk=reservation_unit.pk)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {"numActiveUserReservations": 1}


def test_reservation_unit__query__num_active_user_reservations__user_unauthenticated(graphql):
    reservation_unit = ReservationUnitFactory.create()

    begin = next_hour(plus_hours=1)
    end = begin + datetime.timedelta(hours=1)

    # Reservation with a user
    user = UserFactory.create()
    ReservationFactory.create_for_reservation_unit(
        begins_at=begin, ends_at=end, reservation_unit=reservation_unit, user=user
    )
    # Reservation without a user
    ReservationFactory.create_for_reservation_unit(begins_at=begin, ends_at=end, reservation_unit=reservation_unit)

    query = reservation_units_query(fields="numActiveUserReservations", pk=reservation_unit.pk)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0) == {"numActiveUserReservations": 0}
