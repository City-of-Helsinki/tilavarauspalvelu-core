import datetime
import json
from uuid import UUID

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.utils.timezone import get_default_timezone
from freezegun import freeze_time

from api.graphql.tests.test_reservation_units.base import (
    ReservationUnitQueryTestCaseBase,
    mock_create_product,
)
from api.graphql.tests.test_reservation_units.conftest import reservation_unit_by_pk_query, reservation_units_query
from merchants.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from permissions.models import (
    GeneralRoleChoice,
    GeneralRolePermission,
    ServiceSectorRole,
    ServiceSectorRoleChoice,
    ServiceSectorRolePermission,
    UnitRole,
    UnitRoleChoice,
    UnitRolePermission,
)
from reservation_units.enums import ReservationKind
from reservation_units.models import ReservationUnit
from reservations.choices import ReservationStateChoice
from terms_of_use.models import TermsOfUse
from tests.factories import (
    ApplicationRoundFactory,
    KeywordCategoryFactory,
    KeywordGroupFactory,
    PaymentMerchantFactory,
    PurposeFactory,
    QualifierFactory,
    ReservationCancelReasonFactory,
    ReservationDenyReasonFactory,
    ReservationFactory,
    ReservationUnitFactory,
    ReservationUnitPricingFactory,
    ReservationUnitTypeFactory,
    ServiceSectorFactory,
    TermsOfUseFactory,
    UnitFactory,
    UnitGroupFactory,
)
from tests.helpers import patch_method
from users.models import PersonalInfoViewLog

DEFAULT_TIMEZONE = get_default_timezone()


@freeze_time("2021-05-03")
class ReservationUnitQueryTestCase(ReservationUnitQueryTestCaseBase):
    def test_getting_reservation_units(self):
        self.client.force_login(self.regular_joe)
        response = self.query(
            reservation_units_query(
                fields="""
                    nameFi
                    descriptionFi
                    spaces {
                      nameFi
                    }
                    resources {
                      nameFi
                    }
                    services {
                      nameFi
                      bufferTimeBefore
                      bufferTimeAfter
                    }
                    requireIntroduction
                    purposes {
                      nameFi
                    }
                    qualifiers {
                        nameFi
                    }
                    images {
                      imageUrl
                      mediumUrl
                      smallUrl
                    }
                    location {
                      longitude
                      latitude
                    }
                    maxPersons
                    minPersons
                    surfaceArea
                    reservationUnitType {
                      nameFi
                    }
                    termsOfUseFi
                    equipment {
                      nameFi
                    }
                    contactInformation
                    reservationPendingInstructionsFi
                    reservationPendingInstructionsSv
                    reservationPendingInstructionsEn
                    reservationConfirmedInstructionsFi
                    reservationConfirmedInstructionsSv
                    reservationConfirmedInstructionsEn
                    reservationCancelledInstructionsFi
                    reservationCancelledInstructionsSv
                    reservationCancelledInstructionsEn
                    reservations {
                      begin
                      end
                      state
                    }
                    applicationRounds {
                      nameFi
                      targetGroup
                      applicationPeriodBegin
                      applicationPeriodEnd
                      reservationPeriodBegin
                      reservationPeriodEnd
                      publicDisplayBegin
                      publicDisplayEnd
                      criteriaFi
                    }
                    cancellationRule {
                        nameFi
                        nameEn
                        nameSv
                    }
                    reservationStartInterval
                    reservationBegins
                    reservationEnds
                    publishBegins
                    publishEnds
                    bufferTimeBefore
                    bufferTimeAfter
                    minReservationDuration
                    maxReservationDuration
                    metadataSet {
                      name
                      supportedFields
                      requiredFields
                    }
                    maxReservationsPerUser
                    requireReservationHandling
                    authentication
                    reservationKind
                    canApplyFreeOfCharge
                    reservationsMaxDaysBefore
                    reservationsMinDaysBefore
                    allowReservationsWithoutOpeningHours
                    isArchived
                    state
                    pricingTerms {
                        termsType
                    }
                    paymentTypes {
                        code
                    }
                    pricings {
                        begins
                        pricingType
                        priceUnit
                        lowestPrice
                        highestPrice
                        taxPercentage {
                            value
                        }
                        status
                    }
                    paymentMerchant {
                        name
                    }
                """
            ),
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {
                "node": {
                    "allowReservationsWithoutOpeningHours": False,
                    "applicationRounds": [],
                    "authentication": "WEAK",
                    "bufferTimeAfter": 900,
                    "bufferTimeBefore": 900,
                    "canApplyFreeOfCharge": False,
                    "cancellationRule": {"nameEn": "en", "nameFi": "fi", "nameSv": "sv"},
                    "contactInformation": "",
                    "descriptionFi": "",
                    "equipment": [],
                    "images": [],
                    "isArchived": False,
                    "location": None,
                    "maxPersons": 200,
                    "maxReservationDuration": 86400,
                    "maxReservationsPerUser": 5,
                    "metadataSet": {"name": "Test form", "requiredFields": [], "supportedFields": []},
                    "minPersons": 10,
                    "minReservationDuration": 600,
                    "nameFi": "test name fi",
                    "paymentMerchant": None,
                    "paymentTypes": [{"code": "ONLINE"}],
                    "pricingTerms": {"termsType": "PRICING_TERMS"},
                    "pricings": [
                        {
                            "begins": "2021-01-01",
                            "highestPrice": "10.00",
                            "lowestPrice": "5.00",
                            "priceUnit": "PER_15_MINS",
                            "pricingType": "PAID",
                            "status": "ACTIVE",
                            "taxPercentage": {"value": "10.00"},
                        }
                    ],
                    "publishBegins": "2021-05-03T00:00:00+00:00",
                    "publishEnds": "2021-05-10T00:00:00+00:00",
                    "purposes": [],
                    "qualifiers": [{"nameFi": "Test Qualifier"}],
                    "requireIntroduction": False,
                    "requireReservationHandling": False,
                    "reservationBegins": "2021-05-03T00:00:00+00:00",
                    "reservationCancelledInstructionsEn": "",
                    "reservationCancelledInstructionsFi": "",
                    "reservationCancelledInstructionsSv": "",
                    "reservationConfirmedInstructionsEn": "Additional instructions for the approved reservation",
                    "reservationConfirmedInstructionsFi": "Hyväksytyn varauksen lisäohjeita",
                    "reservationConfirmedInstructionsSv": "Ytterligare instruktioner för den godkända reservationen",
                    "reservationEnds": "2021-05-03T00:00:00+00:00",
                    "reservationKind": "DIRECT_AND_SEASON",
                    "reservationPendingInstructionsEn": "",
                    "reservationPendingInstructionsFi": "",
                    "reservationPendingInstructionsSv": "",
                    "reservationStartInterval": "INTERVAL_30_MINS",
                    "reservationUnitType": {"nameFi": "test type fi"},
                    "reservations": [],
                    "reservationsMaxDaysBefore": 360,
                    "reservationsMinDaysBefore": 1,
                    "resources": [],
                    "services": [{"bufferTimeAfter": 1800, "bufferTimeBefore": 900, "nameFi": "Test Service"}],
                    "spaces": [{"nameFi": "Large space"}, {"nameFi": "Small space"}],
                    "state": "SCHEDULED_HIDING",
                    "surfaceArea": 150,
                    "termsOfUseFi": None,
                }
            }
        ]

    def test_should_not_return_archived_reservation_units(self):
        ReservationUnitFactory(
            name="I should be hiding",
            is_archived=True,
        )
        response = self.query(
            reservation_units_query(fields="nameFi isArchived"),
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"isArchived": False, "nameFi": "test name fi"}}
        ]

    def test_should_be_able_to_find_by_pk(self):
        response = self.query(
            reservation_unit_by_pk_query(
                pk=self.reservation_unit.id,
                fields="id nameFi pk",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnitByPk").get("pk") == self.reservation_unit.id

    def test_getting_authentication_by_pk(self):
        response = self.query(
            reservation_unit_by_pk_query(
                pk=self.reservation_unit.id,
                fields="authentication",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnitByPk").get("authentication") == "WEAK"

    def test_getting_hauki_url_is_none_when_regular_user(self):
        self.reservation_unit.unit.tprek_department_id = "ORGANISATION"
        self.reservation_unit.unit.save()
        self.client.force_login(self.regular_joe)
        response = self.query(
            reservation_unit_by_pk_query(
                pk=self.reservation_unit.id,
                fields="nameFi haukiUrl {url}",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnitByPk") == {
            "haukiUrl": {"url": None},
            "nameFi": "test name fi",
        }

    def test_hauki_url_for_admin(self):
        self.reservation_unit.unit.tprek_department_id = "ORGANISATION"
        self.reservation_unit.unit.save()
        gen_role_choice = GeneralRoleChoice.objects.get(code="admin")
        GeneralRolePermission.objects.create(role=gen_role_choice, permission="can_manage_units")
        self.client.force_login(self.general_admin)
        response = self.query(
            reservation_unit_by_pk_query(
                pk=self.reservation_unit.id,
                fields="nameFi haukiUrl {url}",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnitByPk") == {
            "haukiUrl": {
                "url": "https://test.com/resource/origin%3A3774af34-9916-40f2-acc7-68db5a627710/"
                "?hsa_source=origin"
                "&hsa_username=amin.general%40foo.com"
                "&hsa_organization=tprek%3AORGANISATION"
                "&hsa_created_at=2021-05-03T03%3A00%3A00%2B03%3A00"
                "&hsa_valid_until=2021-05-03T03%3A30%3A00%2B03%3A00"
                "&hsa_resource=origin%3A3774af34-9916-40f2-acc7-68db5a627710"
                "&hsa_has_organization_rights=true"
                "&hsa_signature=ed303be8a365c5f7c13b69135f5306a288103373a6b6932512f352db9daffb42"
            },
            "nameFi": "test name fi",
        }

    def test_hauki_url_for_unit_manager(self):
        self.reservation_unit.unit.tprek_department_id = "ORGANISATION"
        self.reservation_unit.unit.save()
        unit_manager = get_user_model().objects.create(
            username="res_admin",
            first_name="unit",
            last_name="adm",
            email="unit.admin@foo.com",
        )
        unit_role_choice = UnitRoleChoice.objects.get(code="manager")
        unit_role = UnitRole.objects.create(user=unit_manager, role=unit_role_choice)
        unit_role.unit.add(self.reservation_unit.unit)
        UnitRolePermission.objects.create(role=unit_role_choice, permission="can_manage_units")
        self.client.force_login(unit_manager)
        response = self.query(
            reservation_unit_by_pk_query(
                pk=self.reservation_unit.id,
                fields="nameFi haukiUrl {url}",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnitByPk") == {
            "haukiUrl": {
                "url": "https://test.com/resource/origin%3A3774af34-9916-40f2-acc7-68db5a627710/"
                "?hsa_source=origin"
                "&hsa_username=unit.admin%40foo.com"
                "&hsa_organization=tprek%3AORGANISATION"
                "&hsa_created_at=2021-05-03T03%3A00%3A00%2B03%3A00"
                "&hsa_valid_until=2021-05-03T03%3A30%3A00%2B03%3A00"
                "&hsa_resource=origin%3A3774af34-9916-40f2-acc7-68db5a627710"
                "&hsa_has_organization_rights=true"
                "&hsa_signature=8b9a2bb12d735b498c5b3e2fccb6c56c0fa3d4ef30a891f12f2c2991be7e1432"
            },
            "nameFi": "test name fi",
        }

    def test_should_error_when_not_found_by_pk(self):
        response = self.query(
            reservation_unit_by_pk_query(
                pk=self.reservation_unit.id + 666,
                fields="id",
            )
        )

        content = json.loads(response.content)
        errors = content.get("errors")
        assert len(errors) == 1
        assert errors[0].get("message") == "No ReservationUnit matches the given query."

    def test_reservations_date_filter(self):
        ReservationFactory(
            name="Hide me",
            reservation_unit=[self.reservation_unit],
            begin=datetime.datetime(2023, 1, 1, 15, 0, 0, tzinfo=DEFAULT_TIMEZONE),
            end=datetime.datetime(2023, 1, 1, 16, 0, 0, tzinfo=DEFAULT_TIMEZONE),
        )
        ReservationFactory(
            name="Show me",
            reservation_unit=[self.reservation_unit],
            begin=datetime.datetime(2023, 1, 2, 0, 0, 0, tzinfo=DEFAULT_TIMEZONE),
            end=datetime.datetime(2023, 1, 2, 1, 0, 0, tzinfo=DEFAULT_TIMEZONE),
        )
        ReservationFactory(
            name="Show me too",
            reservation_unit=[self.reservation_unit],
            begin=datetime.datetime(2023, 1, 3, 23, 00, 00, tzinfo=DEFAULT_TIMEZONE),
            end=datetime.datetime(2023, 1, 3, 23, 59, 59, tzinfo=DEFAULT_TIMEZONE),
        )
        ReservationFactory(
            name="Hide me too",
            reservation_unit=[self.reservation_unit],
            begin=datetime.datetime(2023, 1, 4, 0, 0, 0, tzinfo=DEFAULT_TIMEZONE),
            end=datetime.datetime(2023, 1, 4, 1, 0, 0, tzinfo=DEFAULT_TIMEZONE),
        )
        self.client.force_login(self.general_admin)
        response = self.query(
            reservation_unit_by_pk_query(
                pk=self.reservation_unit.id,
                fields='reservations(from: "2023-01-02", to: "2023-01-03"){begin end name}',
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None

        reservations = content.get("data").get("reservationUnitByPk").get("reservations")
        assert len(reservations) == 2
        assert reservations[0]["name"] == "Show me"
        assert reservations[1]["name"] == "Show me too"

    def test_filtering_by_unit(self):
        ReservationUnitFactory(unit=UnitFactory())  # should be excluded
        response = self.query(
            reservation_units_query(
                unit=self.reservation_unit.unit.id,
                fields="nameFi unit {nameFi}",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "test name fi", "unit": {"nameFi": "test unit fi"}}}
        ]

    def test_filtering_by_multiple_units(self):
        ReservationUnitFactory(unit=UnitFactory())  # should be excluded
        other_unit = UnitFactory(name_fi="Other unit")
        ReservationUnitFactory(name_fi="Other reservation unit", unit=other_unit)
        response = self.query(
            reservation_units_query(
                unit=[self.reservation_unit.unit.pk, other_unit.pk],
                fields="nameFi unit {nameFi}",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "test name fi", "unit": {"nameFi": "test unit fi"}}},
            {"node": {"nameFi": "Other reservation unit", "unit": {"nameFi": "Other unit"}}},
        ]

    def test_filtering_by_multiple_application_round(self):
        res_unit = ReservationUnitFactory(name_fi="Reservation unit")
        other_res_unit = ReservationUnitFactory(name_fi="The Other reservation unit")
        ReservationUnitFactory(name_fi="Reservation unit too")
        app_round = ApplicationRoundFactory(reservation_units=[res_unit])
        app_round_too = ApplicationRoundFactory(reservation_units=[other_res_unit])
        response = self.query(
            reservation_units_query(
                applicationRound=[app_round.id, app_round_too.id],
                fields="nameFi",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "Reservation unit"}},
            {"node": {"nameFi": "The Other reservation unit"}},
        ]

    def test_filtering_by_type(self):
        response = self.query(
            reservation_units_query(
                reservationUnitType=self.type.id,
                fields="nameFi reservationUnitType {nameFi}",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "test name fi", "reservationUnitType": {"nameFi": "test type fi"}}}
        ]

    def test_filtering_by_multiple_types(self):
        ReservationUnitFactory(unit=UnitFactory())  # should be excluded
        other_type = ReservationUnitTypeFactory(name="Other type")
        ReservationUnitFactory(
            name="Other reservation unit",
            reservation_unit_type=other_type,
            uuid="25455dc2-5383-426d-b711-97b241710ace",
            is_draft=True,
        )
        response = self.query(
            reservation_units_query(
                reservationUnitType=[self.type.id, other_type.id],
                fields="nameFi reservationUnitType {nameFi}",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "test name fi", "reservationUnitType": {"nameFi": "test type fi"}}},
            {"node": {"nameFi": "Other reservation unit", "reservationUnitType": {"nameFi": "Other type"}}},
        ]

    def test_filtering_by_purpose(self):
        purpose = PurposeFactory(name="Test purpose")
        self.reservation_unit.purposes.set([purpose])
        response = self.query(
            reservation_units_query(
                purposes=purpose.pk,
                fields="nameFi purposes {nameFi}",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "test name fi", "purposes": [{"nameFi": "Test purpose"}]}}
        ]

    def test_filtering_by_multiple_purposes(self):
        excluded = ReservationUnitFactory()  # should be excluded
        excluded.purposes.set([PurposeFactory()])
        purpose = PurposeFactory(name="Test purpose")
        other_purpose = PurposeFactory(name="Other purpose")
        self.reservation_unit.purposes.set([purpose])
        response = self.query(
            reservation_units_query(
                purposes=[purpose.pk, other_purpose.pk],
                fields="nameFi purposes {nameFi}",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "test name fi", "purposes": [{"nameFi": "Test purpose"}]}}
        ]

    def test_filtering_by_qualifier(self):
        qualifier = QualifierFactory(name="Filter test qualifier")
        self.reservation_unit.qualifiers.set([qualifier])
        response = self.query(
            reservation_units_query(
                qualifiers=qualifier.pk,
                fields="nameFi qualifiers {nameFi}",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "test name fi", "qualifiers": [{"nameFi": "Filter test qualifier"}]}}
        ]

    def test_filtering_by_multiple_qualifiers(self):
        excluded = ReservationUnitFactory()  # should be excluded
        excluded.qualifiers.set([QualifierFactory()])

        qualifier = QualifierFactory(name="Filter test qualifier")
        other_qualifier = QualifierFactory(name="Other filter test qualifier")

        self.reservation_unit.qualifiers.set([qualifier])

        other_reservation_unit = ReservationUnitFactory(name="Other reservation unit")
        other_reservation_unit.qualifiers.set([other_qualifier])

        response = self.query(
            reservation_units_query(
                qualifiers=[qualifier.pk, other_qualifier.pk],
                fields="nameFi qualifiers {nameFi}",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "test name fi", "qualifiers": [{"nameFi": "Filter test qualifier"}]}},
            {"node": {"nameFi": "Other reservation unit", "qualifiers": [{"nameFi": "Other filter test qualifier"}]}},
        ]

    def test_filtering_by_max_persons_gte_within_limit(self):
        response = self.query(
            reservation_units_query(
                maxPersonsGte=200,
                fields="nameFi maxPersons",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"maxPersons": 200, "nameFi": "test name fi"}}
        ]

    def test_filtering_by_max_persons_gte_outside_limit(self):
        response = self.query(
            reservation_units_query(
                maxPersonsGte=201,
                fields="nameFi maxPersons",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == []

    def test_filtering_by_max_persons_gte_not_set(self):
        self.reservation_unit.max_persons = None
        self.reservation_unit.save()
        response = self.query(
            reservation_units_query(
                maxPersonsGte=201,
                fields="nameFi maxPersons",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"maxPersons": None, "nameFi": "test name fi"}}
        ]

    def test_filtering_by_max_persons_lte_within_limit(self):
        response = self.query(
            reservation_units_query(
                maxPersonsLte=200,
                fields="nameFi maxPersons",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"maxPersons": 200, "nameFi": "test name fi"}}
        ]

    def test_filtering_by_max_persons_lte_outside_limit(self):
        response = self.query(
            reservation_units_query(
                maxPersonsLte=199,
                fields="nameFi maxPersons",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == []

    def test_filtering_by_max_persons_lte_not_set(self):
        self.reservation_unit.max_persons = None
        self.reservation_unit.save()
        response = self.query(
            reservation_units_query(
                maxPersonsLte=199,
                fields="nameFi maxPersons",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"maxPersons": None, "nameFi": "test name fi"}}
        ]

    def test_filtering_by_min_persons_gte_within_limit(self):
        response = self.query(
            reservation_units_query(
                minPersonsGte=10,
                fields="nameFi minPersons",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"minPersons": 10, "nameFi": "test name fi"}}
        ]

    def test_filtering_by_min_persons_gte_outside_limit(self):
        response = self.query(
            reservation_units_query(
                minPersonsGte=11,
                fields="nameFi minPersons",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == []

    def test_filtering_by_min_persons_gte_not_set(self):
        self.reservation_unit.min_persons = None
        self.reservation_unit.save()
        response = self.query(
            reservation_units_query(
                minPersonsGte=11,
                fields="nameFi minPersons",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"minPersons": None, "nameFi": "test name fi"}}
        ]

    def test_filtering_by_min_persons_lte_within_limit(self):
        response = self.query(
            reservation_units_query(
                minPersonsLte=10,
                fields="nameFi minPersons",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"minPersons": 10, "nameFi": "test name fi"}}
        ]

    def test_filtering_by_min_persons_lte_outside_limit(self):
        response = self.query(
            reservation_units_query(
                minPersonsLte=9,
                fields="nameFi minPersons",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == []

    def test_filtering_by_min_persons_lte_not_set(self):
        self.reservation_unit.min_persons = None
        self.reservation_unit.save()
        response = self.query(
            reservation_units_query(
                minPersonsLte=9,
                fields="nameFi minPersons",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"minPersons": None, "nameFi": "test name fi"}}
        ]

    def test_filtering_by_keyword_group(self):
        category = KeywordCategoryFactory()
        keyword_group = KeywordGroupFactory(keyword_category=category, name="Sports")
        self.reservation_unit.keyword_groups.set([keyword_group])
        self.reservation_unit.save()
        response = self.query(
            reservation_units_query(
                keywordGroups=keyword_group.id,
                fields="nameFi keywordGroups{nameFi}",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"keywordGroups": [{"nameFi": "Sports"}], "nameFi": "test name fi"}}
        ]

    def test_filtering_by_multiple_keyword_groups(self):
        category = KeywordCategoryFactory()
        excluded = ReservationUnitFactory()  # should be excluded
        excluded.keyword_groups.set([KeywordGroupFactory(keyword_category=category)])
        keyword_group = KeywordGroupFactory(name="Test group", keyword_category=category)
        other_keyword_group = KeywordGroupFactory(name="Other group", keyword_category=category)
        self.reservation_unit.keyword_groups.set([keyword_group])
        response = self.query(
            reservation_units_query(
                keywordGroups=[keyword_group.id, other_keyword_group.pk],
                fields="nameFi keywordGroups{nameFi}",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"keywordGroups": [{"nameFi": "Test group"}], "nameFi": "test name fi"}}
        ]

    def test_filtering_by_name_fi(self):
        ReservationUnit.objects.exclude(id=self.reservation_unit.id).delete()
        ReservationUnitFactory(name_fi="show only me")
        response = self.query(
            reservation_units_query(
                nameFi="show",
                fields="nameFi",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [{"node": {"nameFi": "show only me"}}]

    def test_filtering_by_surface_area(self):
        ReservationUnit.objects.exclude(id=self.reservation_unit.id).delete()
        ReservationUnitFactory(surface_area=121)  # Do not include
        ReservationUnitFactory(surface_area=120)
        ReservationUnitFactory(surface_area=90)
        ReservationUnitFactory(surface_area=60)
        ReservationUnitFactory(surface_area=59)  # Do not include
        response = self.query(
            reservation_units_query(
                surfaceAreaLte=120,
                surfaceAreaGte=60,
                fields="surfaceArea",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"surfaceArea": 120}},
            {"node": {"surfaceArea": 90}},
            {"node": {"surfaceArea": 60}},
        ]

    def test_filtering_by_rank(self):
        ReservationUnit.objects.exclude(id=self.reservation_unit.id).delete()
        ReservationUnitFactory(rank=1)  # Do not include
        ReservationUnitFactory(rank=2)
        ReservationUnitFactory(rank=3)
        ReservationUnitFactory(rank=4)
        ReservationUnitFactory(rank=5)  # Do not include
        response = self.query(
            reservation_units_query(
                rankLte=4,
                rankGte=2,
                fields="rank",
            )
        )
        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"rank": 2}},
            {"node": {"rank": 3}},
            {"node": {"rank": 4}},
        ]

    def test_filtering_by_type_rank(self):
        ReservationUnit.objects.exclude(id=self.reservation_unit.id).delete()
        rank1 = ReservationUnitTypeFactory(rank=1)  # Do not include
        rank2 = ReservationUnitTypeFactory(rank=2)
        rank3 = ReservationUnitTypeFactory(rank=3)
        rank4 = ReservationUnitTypeFactory(rank=4)
        rank5 = ReservationUnitTypeFactory(rank=5)  # Do not include
        ReservationUnitFactory(reservation_unit_type=rank1, name_fi="Rank 1")  # Do not include
        ReservationUnitFactory(reservation_unit_type=rank2, name_fi="Rank 2")
        ReservationUnitFactory(reservation_unit_type=rank3, name_fi="Rank 3")
        ReservationUnitFactory(reservation_unit_type=rank4, name_fi="Rank 4")
        ReservationUnitFactory(reservation_unit_type=rank5, name_fi="Rank 5")  # Do not include
        response = self.query(
            reservation_units_query(
                typeRankLte=4,
                typeRankGte=2,
                fields="nameFi reservationUnitType{rank}",
            )
        )
        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "Rank 2", "reservationUnitType": {"rank": 2}}},
            {"node": {"nameFi": "Rank 3", "reservationUnitType": {"rank": 3}}},
            {"node": {"nameFi": "Rank 4", "reservationUnitType": {"rank": 4}}},
        ]

    def test_filtering_by_reservation_timestamps(self):
        now = datetime.datetime.now(DEFAULT_TIMEZONE)
        one_hour = datetime.timedelta(hours=1)
        matching_reservation = ReservationFactory(
            begin=now,
            end=now + one_hour,
            state=ReservationStateChoice.CREATED,
        )
        other_reservation = ReservationFactory(
            begin=datetime.datetime(2021, 1, 1),
            end=datetime.datetime(2021, 1, 2),
        )
        self.reservation_unit.reservation_set.set([matching_reservation, other_reservation])
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(
            reservation_units_query(
                fields='nameFi reservations(from: "2021-05-03", to: "2021-05-04"){begin end state}',
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {
                "node": {
                    "nameFi": "test name fi",
                    "reservations": [
                        {"begin": "2021-05-03T00:00:00+00:00", "end": "2021-05-03T01:00:00+00:00", "state": "CREATED"}
                    ],
                }
            }
        ]

    def test_filtering_by_reservation_state(self):
        now = datetime.datetime.now(tz=DEFAULT_TIMEZONE)
        one_hour = datetime.timedelta(hours=1)
        matching_reservation = ReservationFactory(
            begin=now,
            end=now + one_hour,
            state=ReservationStateChoice.CREATED,
        )
        other_reservation = ReservationFactory(
            begin=now + one_hour,
            end=now + one_hour + one_hour,
            state=ReservationStateChoice.CANCELLED,
        )
        self.reservation_unit.reservation_set.set([matching_reservation, other_reservation])
        self.reservation_unit.save()
        self.client.force_login(self.regular_joe)
        response = self.query(
            reservation_units_query(
                fields='nameFi reservations(state: "created"){begin end state}',
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {
                "node": {
                    "nameFi": "test name fi",
                    "reservations": [
                        {"begin": "2021-05-03T00:00:00+00:00", "end": "2021-05-03T01:00:00+00:00", "state": "CREATED"}
                    ],
                }
            }
        ]

    def test_filtering_by_multiple_reservation_states(self):
        now = datetime.datetime.now(tz=DEFAULT_TIMEZONE)
        one_hour = datetime.timedelta(hours=1)
        two_hours = datetime.timedelta(hours=2)
        matching_reservations = [
            ReservationFactory(begin=now, end=now + one_hour, state=ReservationStateChoice.CREATED),
            ReservationFactory(begin=now + one_hour, end=now + two_hours, state=ReservationStateChoice.CONFIRMED),
        ]
        other_reservation = ReservationFactory(
            begin=now + two_hours,
            end=now + two_hours + one_hour,
            state=ReservationStateChoice.CANCELLED,
        )
        self.reservation_unit.reservation_set.set([*matching_reservations, other_reservation])
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(
            reservation_units_query(
                fields='nameFi reservations(state: ["created", "confirmed"]){begin end state}',
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {
                "node": {
                    "nameFi": "test name fi",
                    "reservations": [
                        {"begin": "2021-05-03T00:00:00+00:00", "end": "2021-05-03T01:00:00+00:00", "state": "CREATED"},
                        {
                            "begin": "2021-05-03T01:00:00+00:00",
                            "end": "2021-05-03T02:00:00+00:00",
                            "state": "CONFIRMED",
                        },
                    ],
                }
            }
        ]

    def test_filtering_by_active_application_rounds(self):
        now = datetime.datetime.now().astimezone()
        one_hour = datetime.timedelta(hours=1)
        matching_round = ApplicationRoundFactory(
            name="Test Round",
            application_period_begin=now - one_hour,
            application_period_end=now + one_hour,
        )
        other_round = ApplicationRoundFactory(
            application_period_begin=datetime.datetime(2021, 1, 1, 12).astimezone(),
            application_period_end=datetime.datetime(2021, 1, 1, 13).astimezone(),
        )
        self.reservation_unit.application_rounds.set([matching_round, other_round])
        self.reservation_unit.save()
        response = self.query(
            reservation_units_query(
                fields="applicationRounds(active: true){nameFi}",
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"applicationRounds": [{"nameFi": "Test Round"}]}}
        ]

    def test_filtering_by_is_draft_true(self):
        ReservationUnitFactory(name="Draft reservation unit", is_draft=True)
        response = self.query(
            reservation_units_query(
                isDraft=True,
                fields="nameFi isDraft",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"isDraft": True, "nameFi": "Draft reservation unit"}}
        ]

    def test_filtering_by_is_draft_false(self):
        response = self.query(
            reservation_units_query(
                isDraft=False,
                fields="nameFi isDraft",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"isDraft": False, "nameFi": "test name fi"}}
        ]

    def test_filtering_by_is_visible_true(self):
        today = datetime.datetime.now(tz=DEFAULT_TIMEZONE)
        # No publish times should be included in results.
        ReservationUnitFactory(name_fi="show me")
        # Publish begins before today should be included.
        ReservationUnitFactory(
            name_fi="show me too!",
            publish_begins=today - datetime.timedelta(days=5),
            publish_ends=today + datetime.timedelta(days=10),
        )
        # Publish begins after today should not be included.
        ReservationUnitFactory(
            name_fi="I'm invisible",
            publish_begins=today + datetime.timedelta(days=5),
            publish_ends=today + datetime.timedelta(days=10),
        )
        # Publish begin before and end time null should be included.
        ReservationUnitFactory(
            name_fi="Take me in!",
            publish_begins=today - datetime.timedelta(days=5),
            publish_ends=None,
        )
        # Publish end after today and begin time null should be included.
        ReservationUnitFactory(
            name_fi="Take me in too!",
            publish_ends=today + datetime.timedelta(days=5),
            publish_begins=None,
        )
        # Publish end after before today and begin time null shouldn't be included.
        ReservationUnitFactory(
            name_fi="I shouldn't be included!",
            publish_ends=today - datetime.timedelta(days=1),
            publish_begins=None,
        )
        # Archived units shouldn't be included
        ReservationUnitFactory(
            name_fi="I shouldn't be included because I'm archived!",
            publish_begins=today - datetime.timedelta(days=5),
            publish_ends=today + datetime.timedelta(days=10),
            is_archived=True,
        )
        response = self.query(
            reservation_units_query(
                isVisible=True,
                fields="nameFi publishBegins publishEnds",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {
                "node": {
                    "nameFi": "test name fi",
                    "publishBegins": "2021-05-03T00:00:00+00:00",
                    "publishEnds": "2021-05-10T00:00:00+00:00",
                }
            },
            {"node": {"nameFi": "show me", "publishBegins": None, "publishEnds": None}},
            {
                "node": {
                    "nameFi": "show me too!",
                    "publishBegins": "2021-04-28T00:00:00+00:00",
                    "publishEnds": "2021-05-13T00:00:00+00:00",
                }
            },
            {"node": {"nameFi": "Take me in!", "publishBegins": "2021-04-28T00:00:00+00:00", "publishEnds": None}},
            {"node": {"nameFi": "Take me in too!", "publishBegins": None, "publishEnds": "2021-05-08T00:00:00+00:00"}},
        ]

    def test_filtering_by_is_visible_false(self):
        # No publish time shouldn't include
        ReservationUnitFactory(name_fi="testing is besthing")
        response = self.query(
            reservation_units_query(
                isVisible=False,
                fields="nameFi publishBegins publishEnds",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == []

    def test_filtering_by_reservation_kind_direct(self):
        ReservationUnitFactory(reservation_kind=ReservationKind.DIRECT, name_fi="show me")
        ReservationUnitFactory(reservation_kind=ReservationKind.DIRECT_AND_SEASON, name_fi="show me as well")
        ReservationUnitFactory(reservation_kind=ReservationKind.SEASON, name_fi="Don't you ever show me")
        response = self.query(
            reservation_units_query(
                reservationKind="DIRECT",
                fields="nameFi",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "test name fi"}},
            {"node": {"nameFi": "show me"}},
            {"node": {"nameFi": "show me as well"}},
        ]

    def test_filtering_by_reservation_kind_season(self):
        ReservationUnitFactory(reservation_kind=ReservationKind.SEASON, name_fi="show me")
        ReservationUnitFactory(reservation_kind=ReservationKind.DIRECT_AND_SEASON, name_fi="show me as well")
        ReservationUnitFactory(reservation_kind=ReservationKind.DIRECT, name_fi="Don't you ever show me")
        response = self.query(
            reservation_units_query(
                reservationKind="SEASON",
                fields="nameFi",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "test name fi"}},
            {"node": {"nameFi": "show me"}},
            {"node": {"nameFi": "show me as well"}},
        ]

    def test_order_by_name_fi(self):
        ReservationUnitFactory(name="name_fi", name_fi="name_fi")
        response = self.query(
            reservation_units_query(
                orderBy="nameFi",
                fields="nameFi",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "name_fi"}},
            {"node": {"nameFi": "test name fi"}},
        ]

    def test_order_by_name_en(self):
        ReservationUnitFactory(name="name_en", name_en="name_en")
        response = self.query(
            reservation_units_query(
                orderBy="nameEn",
                fields="nameEn",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameEn": "name_en"}},
            {"node": {"nameEn": "test name en"}},
        ]

    def test_order_by_name_sv(self):
        ReservationUnitFactory(name="name_sv", name_sv="name_sv")
        response = self.query(
            reservation_units_query(
                orderBy="nameSv",
                fields="nameSv",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameSv": "name_sv"}},
            {"node": {"nameSv": "test name sv"}},
        ]

    def test_order_by_type_fi(self):
        res_type = ReservationUnitTypeFactory(name="name_fi", name_fi="name_fi")
        ReservationUnitFactory(reservation_unit_type=res_type)
        response = self.query(
            reservation_units_query(
                orderBy="typeFi",
                fields="reservationUnitType {nameFi}",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"reservationUnitType": {"nameFi": "name_fi"}}},
            {"node": {"reservationUnitType": {"nameFi": "test type fi"}}},
        ]

    def test_order_by_type_en(self):
        res_type = ReservationUnitTypeFactory(name="name_en", name_fi="name_en")
        ReservationUnitFactory(reservation_unit_type=res_type)
        response = self.query(
            reservation_units_query(
                orderBy="typeEn",
                fields="reservationUnitType {nameEn}",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"reservationUnitType": {"nameEn": "test type en"}}},
            {"node": {"reservationUnitType": {"nameEn": None}}},
        ]

    def test_order_by_type_sv(self):
        res_type = ReservationUnitTypeFactory(name="name_sv", name_fi="name_sv")
        ReservationUnitFactory(reservation_unit_type=res_type)
        response = self.query(
            reservation_units_query(
                orderBy="typeSv",
                fields="reservationUnitType {nameSv}",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"reservationUnitType": {"nameSv": "test type sv"}}},
            {"node": {"reservationUnitType": {"nameSv": None}}},
        ]

    def test_order_by_unit(self):
        ReservationUnit.objects.exclude(id=self.reservation_unit.id).delete()
        ReservationUnitFactory(unit=UnitFactory(name_fi="2", name_sv="2", name_en="_"))
        ReservationUnitFactory(unit=UnitFactory(name_fi="3", name_sv="_", name_en="2"))
        ReservationUnitFactory(unit=UnitFactory(name_fi="2", name_sv="1", name_en="_"))
        ReservationUnitFactory(unit=UnitFactory(name_fi="3", name_sv="_", name_en="1"))
        ReservationUnitFactory(unit=UnitFactory(name_fi="1", name_sv="_", name_en="_"))
        self.client.force_login(self.regular_joe)
        response = self.query(
            reservation_units_query(
                orderBy="unitNameFi,unitNameSv,unitNameEn",
                fields="unit {nameFi nameSv nameEn}",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"unit": {"nameEn": "_", "nameFi": "1", "nameSv": "_"}}},
            {"node": {"unit": {"nameEn": "_", "nameFi": "2", "nameSv": "1"}}},
            {"node": {"unit": {"nameEn": "_", "nameFi": "2", "nameSv": "2"}}},
            {"node": {"unit": {"nameEn": "1", "nameFi": "3", "nameSv": "_"}}},
            {"node": {"unit": {"nameEn": "2", "nameFi": "3", "nameSv": "_"}}},
            {"node": {"unit": {"nameEn": "test unit en", "nameFi": "test unit fi", "nameSv": "test unit sv"}}},
        ]

    def test_order_by_unit_reverse_order(self):
        ReservationUnit.objects.exclude(id=self.reservation_unit.id).delete()
        ReservationUnitFactory(unit=UnitFactory(name_fi="2", name_sv="2", name_en="_"))
        ReservationUnitFactory(unit=UnitFactory(name_fi="3", name_sv="_", name_en="2"))
        ReservationUnitFactory(unit=UnitFactory(name_fi="2", name_sv="1", name_en="_"))
        ReservationUnitFactory(unit=UnitFactory(name_fi="3", name_sv="_", name_en="1"))
        ReservationUnitFactory(unit=UnitFactory(name_fi="1", name_sv="_", name_en="_"))
        self.client.force_login(self.regular_joe)
        response = self.query(
            reservation_units_query(
                orderBy="-unitNameFi,-unitNameSv,-unitNameEn",
                fields="unit {nameFi nameSv nameEn}",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"unit": {"nameEn": "test unit en", "nameFi": "test unit fi", "nameSv": "test unit sv"}}},
            {"node": {"unit": {"nameEn": "2", "nameFi": "3", "nameSv": "_"}}},
            {"node": {"unit": {"nameEn": "1", "nameFi": "3", "nameSv": "_"}}},
            {"node": {"unit": {"nameEn": "_", "nameFi": "2", "nameSv": "2"}}},
            {"node": {"unit": {"nameEn": "_", "nameFi": "2", "nameSv": "1"}}},
            {"node": {"unit": {"nameEn": "_", "nameFi": "1", "nameSv": "_"}}},
        ]

    def test_order_by_max_persons(self):
        ReservationUnit.objects.exclude(id=self.reservation_unit.id).delete()
        ReservationUnitFactory(max_persons=1)
        ReservationUnitFactory(max_persons=2)
        ReservationUnitFactory(max_persons=3)
        ReservationUnitFactory(max_persons=4)
        ReservationUnitFactory(max_persons=5)
        self.client.force_login(self.regular_joe)
        response = self.query(
            reservation_units_query(
                orderBy="maxPersons",
                fields="maxPersons",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"maxPersons": 1}},
            {"node": {"maxPersons": 2}},
            {"node": {"maxPersons": 3}},
            {"node": {"maxPersons": 4}},
            {"node": {"maxPersons": 5}},
            {"node": {"maxPersons": 200}},
        ]

    def test_order_by_max_persons_reverse_order(self):
        ReservationUnit.objects.exclude(id=self.reservation_unit.id).delete()
        ReservationUnitFactory(max_persons=1)
        ReservationUnitFactory(max_persons=2)
        ReservationUnitFactory(max_persons=3)
        ReservationUnitFactory(max_persons=4)
        ReservationUnitFactory(max_persons=5)
        self.client.force_login(self.regular_joe)
        response = self.query(
            reservation_units_query(
                orderBy="-maxPersons",
                fields="maxPersons",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"maxPersons": 200}},
            {"node": {"maxPersons": 5}},
            {"node": {"maxPersons": 4}},
            {"node": {"maxPersons": 3}},
            {"node": {"maxPersons": 2}},
            {"node": {"maxPersons": 1}},
        ]

    def test_order_by_surface_area(self):
        ReservationUnit.objects.exclude(id=self.reservation_unit.id).delete()
        ReservationUnitFactory(surface_area=1)
        ReservationUnitFactory(surface_area=2)
        ReservationUnitFactory(surface_area=3)
        ReservationUnitFactory(surface_area=4)
        ReservationUnitFactory(surface_area=5)
        self.client.force_login(self.regular_joe)
        response = self.query(
            reservation_units_query(
                orderBy="surfaceArea",
                fields="surfaceArea",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"surfaceArea": 1}},
            {"node": {"surfaceArea": 2}},
            {"node": {"surfaceArea": 3}},
            {"node": {"surfaceArea": 4}},
            {"node": {"surfaceArea": 5}},
            {"node": {"surfaceArea": 150.0}},
        ]

    def test_order_by_surface_area_reverse_order(self):
        ReservationUnit.objects.exclude(id=self.reservation_unit.id).delete()
        ReservationUnitFactory(surface_area=1)
        ReservationUnitFactory(surface_area=2)
        ReservationUnitFactory(surface_area=3)
        ReservationUnitFactory(surface_area=4)
        ReservationUnitFactory(surface_area=5)
        self.client.force_login(self.regular_joe)
        response = self.query(
            reservation_units_query(
                orderBy="-surfaceArea",
                fields="surfaceArea",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"surfaceArea": 150}},
            {"node": {"surfaceArea": 5}},
            {"node": {"surfaceArea": 4}},
            {"node": {"surfaceArea": 3}},
            {"node": {"surfaceArea": 2}},
            {"node": {"surfaceArea": 1}},
        ]

    def test_order_by_name_and_unit_name(self):
        ReservationUnit.objects.exclude(id=self.reservation_unit.id).delete()
        ReservationUnitFactory(name="a", unit=UnitFactory(name_fi="2"))
        ReservationUnitFactory(name="a", unit=UnitFactory(name_fi="3"))
        ReservationUnitFactory(name="b", unit=UnitFactory(name_fi="2"))
        ReservationUnitFactory(name="b", unit=UnitFactory(name_fi="3"))
        ReservationUnitFactory(name="b", unit=UnitFactory(name_fi="1"))
        self.client.force_login(self.regular_joe)
        response = self.query(
            reservation_units_query(
                orderBy="nameFi,unitNameFi",
                fields="nameFi, unit {nameFi}",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "a", "unit": {"nameFi": "2"}}},
            {"node": {"nameFi": "a", "unit": {"nameFi": "3"}}},
            {"node": {"nameFi": "b", "unit": {"nameFi": "1"}}},
            {"node": {"nameFi": "b", "unit": {"nameFi": "2"}}},
            {"node": {"nameFi": "b", "unit": {"nameFi": "3"}}},
            {"node": {"nameFi": "test name fi", "unit": {"nameFi": "test unit fi"}}},
        ]

    def test_order_by_name_and_unit_name_reversed(self):
        ReservationUnit.objects.exclude(id=self.reservation_unit.id).delete()
        ReservationUnitFactory(name="a", unit=UnitFactory(name_fi="2"))
        ReservationUnitFactory(name="a", unit=UnitFactory(name_fi="3"))
        ReservationUnitFactory(name="b", unit=UnitFactory(name_fi="2"))
        ReservationUnitFactory(name="b", unit=UnitFactory(name_fi="3"))
        ReservationUnitFactory(name="b", unit=UnitFactory(name_fi="1"))
        self.client.force_login(self.regular_joe)
        response = self.query(
            reservation_units_query(
                orderBy="-nameFi,-unitNameFi",
                fields="nameFi, unit {nameFi}",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "test name fi", "unit": {"nameFi": "test unit fi"}}},
            {"node": {"nameFi": "b", "unit": {"nameFi": "3"}}},
            {"node": {"nameFi": "b", "unit": {"nameFi": "2"}}},
            {"node": {"nameFi": "b", "unit": {"nameFi": "1"}}},
            {"node": {"nameFi": "a", "unit": {"nameFi": "3"}}},
            {"node": {"nameFi": "a", "unit": {"nameFi": "2"}}},
        ]

    def test_order_by_rank(self):
        ReservationUnit.objects.exclude(id=self.reservation_unit.id).delete()
        ReservationUnitFactory(rank=5)
        ReservationUnitFactory(rank=3)
        ReservationUnitFactory(rank=1)
        ReservationUnitFactory(rank=2)
        ReservationUnitFactory(rank=4)

        self.client.force_login(self.regular_joe)
        response = self.query(
            reservation_units_query(
                orderBy="rank",
                fields="rank",
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"rank": 1}},
            {"node": {"rank": 2}},
            {"node": {"rank": 3}},
            {"node": {"rank": 4}},
            {"node": {"rank": 5}},
            {"node": {"rank": None}},
        ]

    def test_order_by_type_rank(self):
        ReservationUnit.objects.exclude(id=self.reservation_unit.id).delete()
        rank5 = ReservationUnitTypeFactory(rank=5)
        rank3 = ReservationUnitTypeFactory(rank=3)
        rank1 = ReservationUnitTypeFactory(rank=1)
        rank2 = ReservationUnitTypeFactory(rank=2)
        rank4 = ReservationUnitTypeFactory(rank=4)
        ReservationUnitFactory(name="Fifth", reservation_unit_type=rank5)
        ReservationUnitFactory(name="Third", reservation_unit_type=rank3)
        ReservationUnitFactory(name="First", reservation_unit_type=rank1)
        ReservationUnitFactory(name="Second", reservation_unit_type=rank2)
        ReservationUnitFactory(name="Fourth", reservation_unit_type=rank4)

        self.client.force_login(self.regular_joe)
        response = self.query(
            reservation_units_query(
                orderBy="typeRank",
                fields="reservationUnitType{rank}",
            )
        )
        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"reservationUnitType": {"rank": 1}}},
            {"node": {"reservationUnitType": {"rank": 2}}},
            {"node": {"reservationUnitType": {"rank": 3}}},
            {"node": {"reservationUnitType": {"rank": 4}}},
            {"node": {"reservationUnitType": {"rank": 5}}},
            {"node": {"reservationUnitType": {"rank": None}}},
        ]

    def test_getting_manually_given_surface_area(self):
        self.reservation_unit.surface_area = 500
        self.reservation_unit.save()
        response = self.query(
            reservation_units_query(
                fields="surfaceArea",
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [{"node": {"surfaceArea": 500}}]

    def test_getting_terms(self):
        self.reservation_unit.payment_terms = TermsOfUseFactory(
            text_fi="Payment terms", terms_type=TermsOfUse.TERMS_TYPE_CANCELLATION
        )
        self.reservation_unit.cancellation_terms = TermsOfUseFactory(
            text_fi="Cancellation terms", terms_type=TermsOfUse.TERMS_TYPE_PAYMENT
        )
        self.reservation_unit.service_specific_terms = TermsOfUseFactory(
            text_fi="Service-specific terms", terms_type=TermsOfUse.TERMS_TYPE_SERVICE
        )
        self.reservation_unit.save()
        response = self.query(
            reservation_units_query(
                fields="paymentTerms{textFi} cancellationTerms{textFi} serviceSpecificTerms{textFi}",
            )
        )
        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {
                "node": {
                    "cancellationTerms": {"textFi": "Cancellation terms"},
                    "paymentTerms": {"textFi": "Payment terms"},
                    "serviceSpecificTerms": {"textFi": "Service-specific terms"},
                }
            }
        ]

    def test_filter_by_pk_single_value(self):
        response = self.query(
            reservation_units_query(
                pk=self.reservation_unit.id,
                fields="nameFi",
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [{"node": {"nameFi": "test name fi"}}]

    def test_filter_by_pk_multiple_values(self):
        second_reservation_unit = ReservationUnitFactory(name_fi="Second unit")
        response = self.query(
            reservation_units_query(
                pk=[self.reservation_unit.id, second_reservation_unit.id],
                fields="nameFi",
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "test name fi"}},
            {"node": {"nameFi": "Second unit"}},
        ]

    def test_that_state_is_draft(self):
        self.reservation_unit.name = "This should be draft"
        self.reservation_unit.is_draft = True
        self.reservation_unit.save()
        response = self.query(
            reservation_units_query(
                pk=self.reservation_unit.id,
                fields="nameFi state",
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "This should be draft", "state": "DRAFT"}}
        ]

    def test_that_state_is_scheduled_publishing(self):
        now = datetime.datetime.now(tz=DEFAULT_TIMEZONE)
        self.reservation_unit.name = "This should be scheduled publishing"
        self.reservation_unit.is_draft = False
        self.reservation_unit.is_archived = False
        self.reservation_unit.publish_begins = now + datetime.timedelta(hours=1)
        self.reservation_unit.publish_ends = None
        self.reservation_unit.save()
        response = self.query(
            reservation_units_query(
                pk=self.reservation_unit.id,
                fields="nameFi state",
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "This should be scheduled publishing", "state": "SCHEDULED_PUBLISHING"}}
        ]

    def test_that_state_is_scheduled_hiding(self):
        now = datetime.datetime.now(tz=DEFAULT_TIMEZONE)
        self.reservation_unit.name = "This should be scheduled hiding"
        self.reservation_unit.is_draft = False
        self.reservation_unit.is_archived = False
        self.reservation_unit.publish_begins = now - datetime.timedelta(days=1)
        self.reservation_unit.publish_ends = now + datetime.timedelta(days=2)
        self.reservation_unit.save()
        response = self.query(
            reservation_units_query(
                pk=self.reservation_unit.id,
                fields="nameFi state",
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "This should be scheduled hiding", "state": "SCHEDULED_HIDING"}}
        ]

    def test_that_state_is_hidden(self):
        now = datetime.datetime.now(tz=DEFAULT_TIMEZONE)
        self.reservation_unit.name = "This should be state hidden"
        self.reservation_unit.is_draft = False
        self.reservation_unit.is_archived = False
        self.reservation_unit.publish_begins = now - datetime.timedelta(days=2)
        self.reservation_unit.publish_ends = now - datetime.timedelta(days=1)
        self.reservation_unit.save()
        response = self.query(
            reservation_units_query(
                pk=self.reservation_unit.id,
                fields="nameFi state",
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "This should be state hidden", "state": "HIDDEN"}}
        ]

    def test_that_state_is_scheduled_period(self):
        now = datetime.datetime.now(tz=DEFAULT_TIMEZONE)
        self.reservation_unit.name = "This should be scheduled period"
        self.reservation_unit.is_draft = False
        self.reservation_unit.is_archived = False
        self.reservation_unit.publish_begins = now + datetime.timedelta(days=2)
        self.reservation_unit.publish_ends = now + datetime.timedelta(days=3)
        self.reservation_unit.save()
        response = self.query(
            reservation_units_query(
                pk=self.reservation_unit.id,
                fields="nameFi state",
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "This should be scheduled period", "state": "SCHEDULED_PERIOD"}}
        ]

    def test_that_state_is_published(self):
        self.reservation_unit.name = "This should be published"
        self.reservation_unit.is_draft = False
        self.reservation_unit.is_archived = False
        self.reservation_unit.publish_begins = None
        self.reservation_unit.publish_ends = None
        self.reservation_unit.reservation_begins = None
        self.reservation_unit.reservation_ends = None
        self.reservation_unit.save()
        response = self.query(
            reservation_units_query(
                pk=self.reservation_unit.id,
                fields="nameFi state",
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "This should be published", "state": "PUBLISHED"}}
        ]

    def test_filter_only_with_permission_unit_admin(self):
        unit = UnitFactory()
        unit_group_admin = get_user_model().objects.create(
            username="unit_admin",
            first_name="Amin",
            last_name="Dee",
            email="amin.dee@foo.com",
        )

        unit_role = UnitRole.objects.create(
            user=unit_group_admin,
            role=UnitRoleChoice.objects.get(code="admin"),
        )
        UnitRolePermission.objects.create(
            role=UnitRoleChoice.objects.get(code="admin"),
            permission="can_validate_applications",
        )

        unit_role.unit.add(unit)

        other_unit = UnitFactory()
        unit_role.unit_group.add(UnitGroupFactory(units=[other_unit]))

        ReservationUnitFactory(unit=other_unit, name_fi="I'm in result since i'm in the group")
        ReservationUnitFactory(unit=unit, name_fi="I should be in the result")

        self.client.force_login(unit_group_admin)

        response = self.query(
            reservation_units_query(
                onlyWithPermission=True,
                fields="nameFi",
            )
        )
        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "I'm in result since i'm in the group"}},
            {"node": {"nameFi": "I should be in the result"}},
        ]

    def test_filter_only_with_permission_service_sector_admin(self):
        service_sector = ServiceSectorFactory()
        service_sector_admin = get_user_model().objects.create(
            username="ss_admin",
            first_name="Amin",
            last_name="Dee",
            email="amin.dee@foo.com",
        )

        ServiceSectorRole.objects.create(
            user=service_sector_admin,
            role=ServiceSectorRoleChoice.objects.get(code="admin"),
            service_sector=service_sector,
        )
        ServiceSectorRolePermission.objects.create(
            role=ServiceSectorRoleChoice.objects.get(code="admin"),
            permission="can_handle_applications",
        )

        unit = UnitFactory()
        service_sector.units.add(unit)

        ReservationUnitFactory(unit=unit, name_fi="I should be in the result")

        self.client.force_login(service_sector_admin)

        response = self.query(
            reservation_units_query(
                onlyWithPermission=True,
                fields="nameFi",
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "I should be in the result"}}
        ]

    def test_filter_only_with_permission_general_admin_admin(self):
        ReservationUnitFactory(name_fi="I'm in the results with the other one too.")
        self.client.force_login(self.general_admin)
        response = self.query(
            reservation_units_query(
                onlyWithPermission=True,
                fields="nameFi",
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "test name fi"}},
            {"node": {"nameFi": "I'm in the results with the other one too."}},
        ]

    def test_other_reservations_does_not_show_sensitive_information(self):
        self.client.force_login(self.regular_joe)
        self.general_admin.date_of_birth = datetime.date(2020, 1, 1)
        self.general_admin.save()
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            user=self.general_admin,
            reservee_last_name="Admin",
            reservee_first_name="General",
            reservee_phone="123435",
            working_memo="I should not be visible",
            handling_details="I should not be visible",
            reservee_email="no_visible@localhost",
            reservee_address_street="not visbile address",
            reservee_address_city="not visible city",
            reservee_address_zip="don't show this zip",
            reservee_organisation_name="don't show org name",
            free_of_charge_reason="do not display me",
            billing_first_name="not visible bill first",
            billing_last_name="not visible bill last",
            billing_address_street="not visible bill addr",
            billing_address_city="not visible city",
            billing_address_zip="not visible billing zip",
            billing_phone="not visible bill phone",
            billing_email="not visible bill email",
            description="not visible description",
            reservee_id="novisible",
            cancel_details="not visible cancel_details",
            cancel_reason=ReservationCancelReasonFactory(reason="secret"),
            deny_reason=ReservationDenyReasonFactory(reason="secret"),
        )

        response = self.query(
            reservation_units_query(
                fields="""
                    reservations {
                        user {email dateOfBirth}
                        reserveeLastName
                        reserveeFirstName
                        reserveePhone
                        workingMemo
                        handlingDetails
                        reserveeEmail
                        reserveeAddressStreet
                        reserveeAddressCity
                        reserveeAddressZip
                        reserveeOrganisationName
                        freeOfChargeReason
                        billingFirstName
                        billingLastName
                        billingAddressStreet
                        billingAddressCity
                        billingAddressZip
                        billingPhone
                        billingEmail
                        description
                        reserveeId
                        cancelDetails
                        cancelReason{reason}
                        denyReason{reason}
                    }
                """,
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {
                "node": {
                    "reservations": [
                        {
                            "billingAddressCity": None,
                            "billingAddressStreet": None,
                            "billingAddressZip": None,
                            "billingEmail": None,
                            "billingFirstName": None,
                            "billingLastName": None,
                            "billingPhone": None,
                            "cancelDetails": None,
                            "cancelReason": None,
                            "denyReason": None,
                            "description": None,
                            "freeOfChargeReason": None,
                            "handlingDetails": "",
                            "reserveeAddressCity": None,
                            "reserveeAddressStreet": None,
                            "reserveeAddressZip": None,
                            "reserveeEmail": None,
                            "reserveeFirstName": None,
                            "reserveeId": None,
                            "reserveeLastName": None,
                            "reserveeOrganisationName": None,
                            "reserveePhone": None,
                            "user": None,
                            "workingMemo": None,
                        }
                    ]
                }
            }
        ]

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_admin_sees_reservations_sensitive_information(self):
        self.client.force_login(self.general_admin)
        self.regular_joe.date_of_birth = datetime.date(2020, 1, 1)
        self.regular_joe.save()
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            user=self.regular_joe,
            reservee_last_name="Reggie",
            reservee_first_name="Joe",
            reservee_phone="123435",
            working_memo="Working this memo",
            handling_details="Handling details",
            reservee_email="email@localhost",
            reservee_address_street="address",
            reservee_address_city="city",
            reservee_address_zip="zip",
            reservee_organisation_name="org name",
            free_of_charge_reason="reason",
            billing_first_name="Joe",
            billing_last_name="Reggie",
            billing_address_street="addr",
            billing_address_city="city",
            billing_address_zip="zip",
            billing_phone="phone",
            billing_email="email",
            description="description",
            reservee_id="residee",
            cancel_details="cancdetails",
            cancel_reason=ReservationCancelReasonFactory(reason="secret"),
            deny_reason=ReservationDenyReasonFactory(reason="secret"),
        )

        response = self.query(
            reservation_units_query(
                fields="""
                    reservations {
                        reserveeLastName
                        reserveeFirstName
                        reserveePhone
                        workingMemo
                        handlingDetails
                        reserveeEmail
                        reserveeAddressStreet
                        reserveeAddressCity
                        reserveeAddressZip
                        reserveeOrganisationName
                        freeOfChargeReason
                        billingFirstName
                        billingLastName
                        billingAddressStreet
                        billingAddressCity
                        billingAddressZip
                        billingPhone
                        billingEmail
                        description
                        reserveeId
                        cancelDetails
                        user{dateOfBirth}
                        cancelReason{reason}
                        denyReason{reason}
                    }
                """,
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {
                "node": {
                    "reservations": [
                        {
                            "billingAddressCity": "city",
                            "billingAddressStreet": "addr",
                            "billingAddressZip": "zip",
                            "billingEmail": "email",
                            "billingFirstName": "Joe",
                            "billingLastName": "Reggie",
                            "billingPhone": "phone",
                            "cancelDetails": "cancdetails",
                            "cancelReason": {"reason": "secret"},
                            "denyReason": {"reason": "secret"},
                            "description": "description",
                            "freeOfChargeReason": "reason",
                            "handlingDetails": "Handling details",
                            "reserveeAddressCity": "city",
                            "reserveeAddressStreet": "address",
                            "reserveeAddressZip": "zip",
                            "reserveeEmail": "email@localhost",
                            "reserveeFirstName": "Joe",
                            "reserveeId": "residee",
                            "reserveeLastName": "Reggie",
                            "reserveeOrganisationName": "org name",
                            "reserveePhone": "123435",
                            "user": {"dateOfBirth": "2020-01-01"},
                            "workingMemo": "Working this memo",
                        }
                    ]
                }
            }
        ]
        assert PersonalInfoViewLog.objects.all().count() == 1

    @patch_method(VerkkokauppaAPIClient.create_product)
    def test_show_payment_merchant_from_reservation_unit(self):
        VerkkokauppaAPIClient.create_product.return_value = mock_create_product()
        merchant = PaymentMerchantFactory.create(name="Test Merchant")
        self.client.force_login(self.general_admin)
        self.reservation_unit.payment_merchant = merchant
        self.reservation_unit.save()
        response = self.query(
            reservation_units_query(
                onlyWithPermission=True,
                fields="nameFi paymentMerchant{name}",
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "test name fi", "paymentMerchant": {"name": "Test Merchant"}}}
        ]

    @patch_method(VerkkokauppaAPIClient.create_product)
    def test_show_payment_merchant_from_unit(self):
        VerkkokauppaAPIClient.create_product.return_value = mock_create_product()
        self.client.force_login(self.general_admin)
        merchant = PaymentMerchantFactory.create(name="Test Merchant")
        self.unit.payment_merchant = merchant
        self.unit.save()
        response = self.query(
            reservation_units_query(
                fields="nameFi paymentMerchant{name}",
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "test name fi", "paymentMerchant": {"name": "Test Merchant"}}}
        ]

    @patch_method(VerkkokauppaAPIClient.create_product)
    def test_hide_payment_merchant_without_permissions(self):
        VerkkokauppaAPIClient.create_product.return_value = mock_create_product()
        merchant = PaymentMerchantFactory.create(name="Test Merchant")
        self.reservation_unit.payment_merchant = merchant
        self.reservation_unit.save()
        response = self.query(
            reservation_units_query(
                fields="nameFi paymentMerchant{name}",
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "test name fi", "paymentMerchant": None}}
        ]

    def test_by_pk_has_reservations(self):
        now = datetime.datetime.now(tz=DEFAULT_TIMEZONE)
        one_hour = datetime.timedelta(hours=1)
        matching_reservation = ReservationFactory(
            begin=now,
            end=now + one_hour,
            state=ReservationStateChoice.CREATED,
        )
        other_reservation = ReservationFactory(
            begin=datetime.datetime(2021, 1, 1, tzinfo=DEFAULT_TIMEZONE),
            end=datetime.datetime(2021, 1, 2, tzinfo=DEFAULT_TIMEZONE),
        )
        self.reservation_unit.reservation_set.set([matching_reservation, other_reservation])
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(
            reservation_unit_by_pk_query(
                pk=self.reservation_unit.id,
                fields='nameFi reservations(from: "2021-05-03", to: "2021-05-04"){begin end state}',
            )
        )

        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnitByPk") == {
            "nameFi": "test name fi",
            "reservations": [
                {"begin": "2021-05-03T00:00:00+00:00", "end": "2021-05-03T01:00:00+00:00", "state": "CREATED"}
            ],
        }

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    @patch_method(VerkkokauppaAPIClient.create_product)
    def test_show_payment_product(self):
        VerkkokauppaAPIClient.create_product.return_value = mock_create_product()
        self.client.force_login(self.general_admin)

        merchant_pk = UUID("3828ac38-3e26-4501-8556-ba2ea3442627")
        merchant = PaymentMerchantFactory.create(id=merchant_pk, name="Test Merchant")
        ReservationUnitPricingFactory(reservation_unit=self.reservation_unit)

        self.reservation_unit.payment_merchant = merchant
        self.reservation_unit.save()
        response = self.query(
            reservation_units_query(
                fields="nameFi paymentProduct{pk merchantPk}",
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {
                "node": {
                    "nameFi": "test name fi",
                    "paymentProduct": {
                        "merchantPk": "3828ac38-3e26-4501-8556-ba2ea3442627",
                        "pk": "1018cabd-d693-41c1-8ddc-dc5c08829048",
                    },
                }
            }
        ]

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    @patch_method(VerkkokauppaAPIClient.create_product)
    def test_hide_payment_product_without_permissions(self):
        VerkkokauppaAPIClient.create_product.return_value = mock_create_product()
        merchant_pk = UUID("3828ac38-3e26-4501-8556-ba2ea3442627")
        merchant = PaymentMerchantFactory.create(pk=merchant_pk, name="Test Merchant")

        self.reservation_unit.payment_merchant = merchant
        self.reservation_unit.save()

        response = self.query(
            reservation_units_query(
                fields="nameFi paymentProduct{pk merchantPk}",
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        assert content.get("data").get("reservationUnits").get("edges") == [
            {"node": {"nameFi": "test name fi", "paymentProduct": None}}
        ]
