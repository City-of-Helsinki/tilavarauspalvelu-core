from __future__ import annotations

import datetime
import os
import uuid
from contextlib import contextmanager
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Literal

from django.contrib.auth.hashers import make_password
from django.contrib.gis.geos import Point
from django.core.exceptions import MultipleObjectsReturned, ObjectDoesNotExist, ValidationError
from django.core.management import BaseCommand
from django.db import models, transaction
from django.db.models import Subquery

from tilavarauspalvelu.enums import (
    AccessType,
    AuthenticationType,
    PaymentType,
    PriceUnit,
    ReservationFormType,
    ReservationKind,
    ReservationNotification,
    ReservationStartInterval,
    ReservationStateChoice,
    ReservationTypeChoice,
    TermsOfUseTypeChoices,
    Weekday,
)
from tilavarauspalvelu.management.commands.data_creation.utils import defer_reservation_unit_create_operations
from tilavarauspalvelu.models import (
    AllocatedTimeSlot,
    Application,
    ApplicationRound,
    ApplicationRoundTimeSlot,
    Equipment,
    EquipmentCategory,
    IntendedUse,
    OriginHaukiResource,
    PaymentAccounting,
    PaymentMerchant,
    PaymentProduct,
    Reservation,
    ReservationMetadataField,
    ReservationMetadataSet,
    ReservationPurpose,
    ReservationSeries,
    ReservationUnit,
    ReservationUnitAccessType,
    ReservationUnitCancellationRule,
    ReservationUnitOption,
    ReservationUnitPricing,
    ReservationUnitType,
    Space,
    TaxPercentage,
    TermsOfUse,
    Unit,
    User,
)
from tilavarauspalvelu.typing import TimeSlotDB
from utils.date_utils import local_date, local_datetime

if TYPE_CHECKING:
    from collections.abc import Generator

__all__ = [
    "create_robot_test_data",
]


class Command(BaseCommand):
    help = "Creates test data for robotframework tests."

    def handle(self, *args: Any, **options: Any) -> None:
        create_robot_test_data()


@contextmanager
def handle_model_object_errors() -> Generator[None]:
    try:
        yield

    except ObjectDoesNotExist as error:
        msg = f"Object does not exist: {error}"
        raise ValidationError(msg, code="object_does_not_exist") from error

    except MultipleObjectsReturned as error:
        msg = f"Multiple objects returned: {error}"
        raise ValidationError(msg, code="multiple_objects_returned") from error


@transaction.atomic()
@handle_model_object_errors()
@defer_reservation_unit_create_operations
def create_robot_test_data() -> None:
    if os.getenv("DJANGO_SETTINGS_ENVIRONMENT") == "Production":
        msg = "Hey! This is the production environment! Don't just try to generate test data! >:("
        raise ValidationError(msg, code="production_environment")

    remove_existing_data()
    create_users()
    create_reservation_units()
    create_application_rounds()
    create_past_reservations()


def remove_existing_data() -> None:
    try:
        harakka = Unit.objects.get(tprek_id="71677")

    # If Harakka doesn't exist, then none of the other entities should exist either.
    except Unit.DoesNotExist:
        return

    application_round = ApplicationRound.objects.filter(name="Kausivaraus (AUTOMAATIO TESTI ÄLÄ POISTA)")

    reservation_units = ReservationUnit.objects.filter(unit=harakka)
    spaces = Space.objects.filter(unit=harakka)

    sq = Subquery(reservation_units.values("id"))
    reservations = Reservation.objects.filter(reservation_unit__in=sq)
    series = ReservationSeries.objects.filter(reservation_unit__in=sq)
    allocation = AllocatedTimeSlot.objects.filter(reservation_unit_option__reservation_unit__in=sq)
    options = ReservationUnitOption.objects.filter(reservation_unit__in=sq)
    applications = Application.objects.filter(
        models.Q(application_round__reservation_units__in=sq)
        | models.Q(application_round__name="Kausivaraus (AUTOMAATIO TESTI ÄLÄ POISTA)")
    )

    spaces.delete()
    reservations.delete()
    series.delete()
    allocation.delete()
    options.delete()
    applications.delete()
    application_round.delete()
    reservation_units.delete()
    harakka.delete()


def create_reservation_units() -> None:  # noqa: PLR0915
    # ------------------------------------------------------------------------------------------------------------
    # Fetch existing objects
    # ------------------------------------------------------------------------------------------------------------

    kokoustila, _ = ReservationUnitType.objects.get_or_create(
        name="Kokoustila",
        defaults={
            "name_fi": "Kokoustila",
            "name_sv": "Meeting room",
            "name_en": "Möteslokal",
        },
    )

    metadata_fields = [
        ReservationMetadataField(field_name=field_name)
        for field_name in [
            "reservee_type",
            "reservee_first_name",
            "reservee_last_name",
            "reservee_organisation_name",
            "reservee_is_unregistered_association",
            "reservee_phone",
            "reservee_email",
            "reservee_identifier",
            "reservee_address_zip",
            "age_group",
            "applying_for_free_of_charge",
            "free_of_charge_reason",
            "name",
            "description",
            "num_persons",
            "purpose",
            "municipality",
        ]
    ]
    fields = ReservationMetadataField.objects.bulk_create(
        metadata_fields,
        update_conflicts=True,
        update_fields=["field_name"],
        unique_fields=["field_name"],
    )
    fields_by_name = {field.field_name: field for field in fields}

    lomake_1, _ = ReservationMetadataSet.objects.get_or_create(name="Lomake 1")
    lomake_2, _ = ReservationMetadataSet.objects.get_or_create(name="Lomake 2")
    lomake_3, _ = ReservationMetadataSet.objects.get_or_create(name="Lomake 3")
    lomake_4, _ = ReservationMetadataSet.objects.get_or_create(name="Lomake 4")
    lomake_3_sub, _ = ReservationMetadataSet.objects.get_or_create(name="Lomake 3 - maksuttomuuspyyntö sallittu")
    lomake_4_sub, _ = ReservationMetadataSet.objects.get_or_create(name="Lomake 4 - maksuttomuuspyyntö sallittu")

    lomake_1.supported_fields.set([
        fields_by_name["reservee_first_name"],
        fields_by_name["reservee_last_name"],
        fields_by_name["reservee_email"],
        fields_by_name["reservee_phone"],
    ])
    lomake_1.required_fields.set([
        fields_by_name["reservee_first_name"],
        fields_by_name["reservee_last_name"],
        fields_by_name["reservee_email"],
        fields_by_name["reservee_phone"],
    ])
    lomake_2.supported_fields.set([
        fields_by_name["description"],
        fields_by_name["num_persons"],
        fields_by_name["reservee_email"],
        fields_by_name["reservee_first_name"],
        fields_by_name["reservee_identifier"],
        fields_by_name["reservee_is_unregistered_association"],
        fields_by_name["reservee_last_name"],
        fields_by_name["reservee_organisation_name"],
        fields_by_name["reservee_phone"],
        fields_by_name["reservee_type"],
    ])
    lomake_2.required_fields.set([
        fields_by_name["description"],
        fields_by_name["reservee_email"],
        fields_by_name["reservee_first_name"],
        fields_by_name["reservee_identifier"],
        fields_by_name["reservee_last_name"],
        fields_by_name["reservee_organisation_name"],
        fields_by_name["reservee_phone"],
        fields_by_name["reservee_type"],
    ])
    lomake_3.supported_fields.set([
        fields_by_name["description"],
        fields_by_name["municipality"],
        fields_by_name["name"],
        fields_by_name["num_persons"],
        fields_by_name["purpose"],
        fields_by_name["reservee_email"],
        fields_by_name["reservee_first_name"],
        fields_by_name["reservee_identifier"],
        fields_by_name["reservee_is_unregistered_association"],
        fields_by_name["reservee_last_name"],
        fields_by_name["reservee_organisation_name"],
        fields_by_name["reservee_phone"],
        fields_by_name["reservee_type"],
    ])
    lomake_3.required_fields.set([
        fields_by_name["description"],
        fields_by_name["municipality"],
        fields_by_name["num_persons"],
        fields_by_name["purpose"],
        fields_by_name["reservee_email"],
        fields_by_name["reservee_first_name"],
        fields_by_name["reservee_identifier"],
        fields_by_name["reservee_last_name"],
        fields_by_name["reservee_organisation_name"],
        fields_by_name["reservee_phone"],
        fields_by_name["reservee_type"],
    ])
    lomake_4.supported_fields.set([
        fields_by_name["age_group"],
        fields_by_name["description"],
        fields_by_name["municipality"],
        fields_by_name["name"],
        fields_by_name["num_persons"],
        fields_by_name["purpose"],
        fields_by_name["reservee_email"],
        fields_by_name["reservee_first_name"],
        fields_by_name["reservee_identifier"],
        fields_by_name["reservee_is_unregistered_association"],
        fields_by_name["reservee_last_name"],
        fields_by_name["reservee_organisation_name"],
        fields_by_name["reservee_phone"],
        fields_by_name["reservee_type"],
    ])
    lomake_4.required_fields.set([
        fields_by_name["age_group"],
        fields_by_name["description"],
        fields_by_name["municipality"],
        fields_by_name["num_persons"],
        fields_by_name["purpose"],
        fields_by_name["reservee_email"],
        fields_by_name["reservee_first_name"],
        fields_by_name["reservee_identifier"],
        fields_by_name["reservee_last_name"],
        fields_by_name["reservee_organisation_name"],
        fields_by_name["reservee_phone"],
        fields_by_name["reservee_type"],
    ])
    lomake_3_sub.supported_fields.set([
        fields_by_name["applying_for_free_of_charge"],
        fields_by_name["description"],
        fields_by_name["free_of_charge_reason"],
        fields_by_name["municipality"],
        fields_by_name["name"],
        fields_by_name["num_persons"],
        fields_by_name["purpose"],
        fields_by_name["reservee_email"],
        fields_by_name["reservee_first_name"],
        fields_by_name["reservee_identifier"],
        fields_by_name["reservee_is_unregistered_association"],
        fields_by_name["reservee_last_name"],
        fields_by_name["reservee_organisation_name"],
        fields_by_name["reservee_phone"],
        fields_by_name["reservee_type"],
    ])
    lomake_3_sub.required_fields.set([
        fields_by_name["description"],
        fields_by_name["municipality"],
        fields_by_name["num_persons"],
        fields_by_name["purpose"],
        fields_by_name["reservee_email"],
        fields_by_name["reservee_first_name"],
        fields_by_name["reservee_identifier"],
        fields_by_name["reservee_last_name"],
        fields_by_name["reservee_organisation_name"],
        fields_by_name["reservee_phone"],
        fields_by_name["reservee_type"],
    ])
    lomake_4_sub.supported_fields.set([
        fields_by_name["age_group"],
        fields_by_name["applying_for_free_of_charge"],
        fields_by_name["description"],
        fields_by_name["free_of_charge_reason"],
        fields_by_name["municipality"],
        fields_by_name["name"],
        fields_by_name["num_persons"],
        fields_by_name["purpose"],
        fields_by_name["reservee_email"],
        fields_by_name["reservee_first_name"],
        fields_by_name["reservee_identifier"],
        fields_by_name["reservee_is_unregistered_association"],
        fields_by_name["reservee_last_name"],
        fields_by_name["reservee_organisation_name"],
        fields_by_name["reservee_phone"],
        fields_by_name["reservee_type"],
    ])
    lomake_4_sub.required_fields.set([
        fields_by_name["age_group"],
        fields_by_name["description"],
        fields_by_name["municipality"],
        fields_by_name["num_persons"],
        fields_by_name["purpose"],
        fields_by_name["reservee_email"],
        fields_by_name["reservee_first_name"],
        fields_by_name["reservee_identifier"],
        fields_by_name["reservee_last_name"],
        fields_by_name["reservee_organisation_name"],
        fields_by_name["reservee_phone"],
        fields_by_name["reservee_type"],
    ])

    peruutus_alkuun_asti, _ = ReservationUnitCancellationRule.objects.get_or_create(
        name="Varauksen alkuun asti",
        defaults={
            "name_fi": "Varauksen alkuun asti",
            "name_en": "Varauksen alkuun asti",
            "name_sv": "Varauksen alkuun asti",
            "can_be_cancelled_time_before": datetime.timedelta(seconds=1),
        },
    )
    peruutus_kaksi_viikkoa, _ = ReservationUnitCancellationRule.objects.get_or_create(
        name="14 vrk ennen alkamista",
        defaults={
            "name_fi": "14 vrk ennen alkamista",
            "name_en": "14 vrk ennen alkamista",
            "name_sv": "14 vrk ennen alkamista",
            "can_be_cancelled_time_before": datetime.timedelta(days=14),
        },
    )

    maksuton_maksuehto, _ = TermsOfUse.objects.get_or_create(
        id="pay0",
        defaults={
            "name_fi": "Maksuehto - maksuton",
            "name_en": "Maksuehto - maksuton",
            "name_sv": "Maksuehto - maksuton",
            "text_fi": "",
            "text_en": "",
            "text_sv": "",
            "terms_type": TermsOfUseTypeChoices.PAYMENT,
        },
    )
    verkkokauppa_vain_maksuehto, _ = TermsOfUse.objects.get_or_create(
        id="pay1",
        defaults={
            "name_fi": "Maksuehto 1 - vain verkkomaksaminen",
            "name_en": "Term of payment 1: online payment only",
            "name_sv": "Betalningsvillkor 1 - endast onlinebetalning",
            "text_fi": (
                "Varaus maksetaan kokonaisuudessaan etukäteen varauksenteon yhteydessä. "
                "Palvelussa ilmoitetut hinnat sisältävät arvolisäveron. "
                "Mahdolliset lisäpalvelut eivät sisälly hintaan."
            ),
            "text_en": (
                "The reservation is paid in full in advance in connection with booking. "
                "The prices indicated in the service include VAT. "
                "Any additional services are not included in the price."
            ),
            "text_sv": (
                "Bokningen betalas till fullt belopp när den görs. "
                "Priserna som anges i tjänsten innehåller moms. "
                "Eventuella tilläggsavgifter ingår inte i priset."
            ),
            "terms_type": TermsOfUseTypeChoices.PAYMENT,
        },
    )
    verkkokauppa_alennus_maksuehto, _ = TermsOfUse.objects.get_or_create(
        id="pay3",
        defaults={
            "name_fi": "Maksuehto 2 - verkkomaksu + lasku, kiinteä hinta",
            "name_en": "Term of payment 2: online payment + invoice, fixed price",
            "name_sv": "Betalningsvillkor 2 - onlinebetalning + faktura, fast pris",
            "text_fi": (
                "Varaus maksetaan kokonaisuudessaan etukäteen varauksenteon yhteydessä. "
                "Jos valitset maksutavaksi laskun, varaus tulee maksaa eräpäivään mennessä. "
                "Lasku maksutapana edellyttää vähintään 18 vuoden ikää. "
                "Palvelussa ilmoitetut hinnat sisältävät arvolisäveron. "
                "Mahdolliset lisäpalvelut eivät sisälly hintaan."
            ),
            "text_en": (
                "The reservation is paid in full in advance in connection with booking. "
                "If you choose the invoice payment method, the reservation must be paid by the due date. "
                "The invoice payment method is only available to those who are 18 or older. "
                "The prices indicated in the service include VAT. "
                "Any additional services are not included in the price."
            ),
            "text_sv": (
                "Bokningen betalas till fullt belopp när den görs. "
                "Om du väljer faktura som betalmetod ska bokningen betalas senast på förfallodagen. "
                "För att välja faktura som betalmetod ska man vara minst 18 år. "
                "Priserna som anges i tjänsten innehåller moms. "
                "Eventuella tilläggsavgifter ingår inte i priset."
            ),
            "terms_type": TermsOfUseTypeChoices.PAYMENT,
        },
    )
    verkkokauppa_kasittely_maksuehto, _ = TermsOfUse.objects.get_or_create(
        id="pay4",
        defaults={
            "name_fi": "Maksuehto 3 - verkkomaksu + lasku, alennus",
            "name_en": "Term of payment 3: online payment + invoice, discount",
            "name_sv": "Betalningsvillkor 3 - onlinebetalning + faktura, rabatt",
            "text_fi": (
                "Varaus maksetaan kokonaisuudessaan etukäteen varauksenteon yhteydessä. "
                "Maksutonta käyttöä tai alennusta on haettava varaamisen yhteydessä. "
                "Jälkikäteen tehtyjä alennus- tai maksuttomuuspyyntöjä ei käsitellä. "
                "Jos haet maksutonta tai alennettua käyttöä, varauksesi siirtyy käsittelyyn. "
                "Palvelussa ilmoitetut hinnat sisältävät arvolisäveron. "
                "Mahdolliset lisäpalvelut eivät sisälly hintaan."
            ),
            "text_en": (
                "The reservation is paid in full in advance in connection with booking. "
                "You must apply for free use or discount in connection with booking. "
                "Requests for free use or discount submitted later will not be processed. "
                "If you apply for free use or discount, your reservation will be transferred to processing. "
                "The prices indicated in the service include VAT. "
                "Any additional services are not included in the price."
            ),
            "text_sv": (
                "Bokningen betalas till fullt belopp när den görs. "
                "Avgiftsfri användning eller rabatt ska ansökas i samband med bokningen. "
                "Begäran om rabatt eller avgiftsfrihet som ställs i efterhand behandlas inte. "
                "Om du ansöker om avgiftsfri användning eller rabatt förflyttas din bokning till handläggning. "
                "Priserna som anges i tjänsten innehåller moms. "
                "Eventuella tilläggsavgifter ingår inte i priset."
            ),
            "terms_type": TermsOfUseTypeChoices.PAYMENT,
        },
    )
    varauksen_alkuun_asti_peruutusehto, _ = TermsOfUse.objects.get_or_create(
        id="cancel0days",
        defaults={
            "name_fi": "Peruttavissa alkamiseen asti",
            "name_en": "Cancellable until reservation starts",
            "name_sv": "Kan avbokas fram till bokningens starttid",
            "text_fi": (
                "Varauksen voi perua Varaamossa veloituksetta ennen varauksen alkamista. "
                "Myöhästyessäsi yli 15 minuuttia varaus vapautetaan muiden käyttöön."
            ),
            "text_en": (
                "The reservation can be cancelled free of charge in Varaamo before the reservation starts. "
                "If you are more than 15 minutes late for your reservation, "
                "it will be cancelled and made available to others."
            ),
            "text_sv": (
                "Bokningen kan avbokas vid Varaamo utan kostnad före bokningens starttid. "
                "Vid en försening på över 15 minuter släpps bokningen och passet kan nyttjas av andra."
            ),
            "terms_type": TermsOfUseTypeChoices.CANCELLATION,
        },
    )
    alkuun_asti_ei_peruutusta_peruutusehto, _ = TermsOfUse.objects.get_or_create(
        id="cancel0days_delayok",
        defaults={
            "name_fi": "Peruttavissa alkamiseen asti (ei vapauteta)",
            "name_en": "Cancellable until reservation starts (ei vapauteta)",
            "name_sv": "Kan avbokas fram till bokningens starttid (ei vapauteta)",
            "text_fi": "Varauksen voi perua Varaamossa veloituksetta ennen varauksen alkamista.",
            "text_en": "The reservation can be cancelled free of charge in Varaamo before the reservation starts.",
            "text_sv": "Bokningen kan avbokas vid Varaamo utan kostnad före bokningens starttid.",
            "terms_type": TermsOfUseTypeChoices.CANCELLATION,
        },
    )
    kaksi_viikkoa_peruutusehto, _ = TermsOfUse.objects.get_or_create(
        id="cancel2weeks",
        defaults={
            "name_fi": "Peruutusehto 2 vko (14vrk)",
            "name_en": "cancellation policy Two-weeks",
            "name_sv": "Avbokningsvillkor 2 veckor",
            "text_fi": (
                "Varauksen voi perua veloituksetta kaksi viikkoa (14 vrk) ennen varauksen alkamista. "
                "Myöhemmin tehdyistä peruutuksista peritään täysi hinta."
            ),
            "text_en": (
                "A reservation can be cancelled free of charge two weeks (14 days) before the reservation starts. "
                "A full fee will be charged of cancellations made after that time."
            ),
            "text_sv": (
                "Bokningen kan avbokas utan kostnad fram till två veckor (14 dagar) före bokningens starttid. "
                "Senare avbokningar debiteras till fullt belopp."
            ),
            "terms_type": TermsOfUseTypeChoices.CANCELLATION,
        },
    )
    laitteet_palveluehto, _ = TermsOfUse.objects.get_or_create(
        id="KUVAlaite",
        defaults={
            "name_fi": "Laitteet ja soittimet",
            "name_en": "Devices and musical instruments",
            "name_sv": "Utrustning och instrument",
            "text_fi": (
                "Mikäli työsi ei valmistu varaamasi ajan sisällä, työ keskeytetään seuraavan varauksen alkaessa. "
                "Laite tai soitin on tarkoitettu omaan luovaan toimintaan. "
                "Tilaustöiden tekeminen korvausta vastaan tai ammattimainen tulonhankinta ei ole sallittua."
            ),
            "text_en": (
                "If your work is not completed within the reserved time, "
                "the work will be discontinued when the following reservation starts. "
                "A device or musical instrument is intended for your own creative activities only. "
                "You are not allowed to make bespoke work for compensation or to earn a professional income."
            ),
            "text_sv": (
                "Om ditt arbete inte blir färdigt inom den tid som du har "
                "bokat avbryts ditt arbete när nästa bokning börjar. "
                "Utrustning och instrument är avsedda för egen kreativ verksamhet. "
                "Det är inte tillåtet att producera beställningsmaterial mot "
                "betalning eller att utöva yrkesverksamhet i inkomstsyfte."
            ),
            "terms_type": TermsOfUseTypeChoices.SERVICE,
        },
    )
    maksulliset_palveluehto, _ = TermsOfUse.objects.get_or_create(
        id="KUVA_oodi",
        defaults={
            "name_fi": "KUVA - Oodi, maksulliset",
            "name_en": "KUVA - Oodi, maksulliset",
            "name_sv": "KUVA - Oodi, maksulliset",
            "text_fi": (
                "Varaajan tulee olla täysi-ikäinen. "
                "Tilassa järjestettävä tilaisuus ei saa häiritä muuta kirjaston toimintaa, asiakkaita tai käyttäjiä."
            ),
            "text_en": (
                "The lessee must be 18 or older. "
                "Events held in the rented facilities must not disrupt the other "
                "library operations or disturb the library's customers and users."
            ),
            "text_sv": (
                "Hyrestagaren ska vara myndig. Ett evenemang som arrangeras i en hyrd lokal "
                "får inte störa den övriga verksamheten på biblioteket eller bibliotekets kunder eller användare."
            ),
            "terms_type": TermsOfUseTypeChoices.SERVICE,
        },
    )
    nupa_palveluehto, _ = TermsOfUse.objects.get_or_create(
        id="KUVA_nupa",
        defaults={
            "name_fi": "KUVA - Nuorisopalvelut",
            "name_en": "KUVA - Nuorisopalvelut",
            "name_sv": "KUVA - Nuorisopalvelut",
            "text_fi": (
                "TÄYDENTÄVÄT SOPIMUSEHDOT Nuorisotilat ovat päihteettömiä. "
                "Nuorisotiloja ei luovuteta yksittäisen puolueen, "
                "ehdokkaan tai valitsijayhdistyksen vaalitilaisuuksia varten. "
                "Yöpyminen on sallittu vain nuorisopalveluiden leirikeskuksissa tai vastaavissa tiloissa, "
                "jotka on tarkoitettu yöpymiseen."
            ),
            "text_en": (
                "Youth spaces are intoxicant-free. "
                "Election rallies of individual parties, candidates or "
                "constituency associations are not allowed in youth spaces. "
                "Overnight stays are only allowed in Youth Services' "
                "camp centres or similar premises intended for overnight stays."
            ),
            "text_sv": (
                "KOMPLETTERANDE AVTALSVILLKOR Ungdomsgårdarna är rusmedelsfria. "
                "Ungdomsgårdar överlåts inte för ett enskilt partis, "
                "en enskild kandidats eller en enskild valmansförenings valmöten. "
                "Övernattning är endast tillåten i ungdomstjänsternas lägercenter "
                "eller liknande lokaler som är avsedda för övernattning."
            ),
            "terms_type": TermsOfUseTypeChoices.SERVICE,
        },
    )
    maksuton_palveluehto, _ = TermsOfUse.objects.get_or_create(
        id="KUVA_oodi_maksuton",
        defaults={
            "name_fi": "KUVA - Oodi, maksuton",
            "name_en": "KUVA - Oodi, maksuton",
            "name_sv": "KUVA - Oodi, maksuton",
            "text_fi": (
                "Tila on tarkoitettu ei-kaupalliseen toimintaan. "
                "Sitä ei ole tarkoitettu pääsy- tai osallistumismaksullisiin kursseihin tai tilaisuuksiin. "
                "Tilassa järjestettävä tilaisuus ei saa häiritä muuta kirjaston toimintaa, "
                "asiakkaita tai käyttäjiä. Huom! Asiakastiloja ei ole tarkoitettu kaupungin sisäisiin kokouksiin."
            ),
            "text_en": (
                "The facility is intended for non-commercial activity. "
                "It is not intended for courses or events that charge an entrance or a participation fee. "
                "Events held in the facility must not disrupt the other library operations or "
                "disturb the library's customers and users. "
                "Huom! Asiakastiloja ei ole tarkoitettu kaupungin sisäisiin kokouksiin."
            ),
            "text_sv": (
                "Lokalen är avsedd för icke-kommersiell verksamhet. "
                "Den är inte avsedd för kurser eller evenemang för vilka inträdes- eller deltagaravgifter tas ut. "
                "Ett evenemang som arrangeras i en hyrd lokal får inte störa den "
                "övriga verksamheten på biblioteket eller bibliotekets kunder eller användare. "
                "Huom! Asiakastiloja ei ole tarkoitettu kaupungin sisäisiin kokouksiin."
            ),
            "terms_type": TermsOfUseTypeChoices.SERVICE,
        },
    )
    kausi_palveluehto, _ = TermsOfUse.objects.get_or_create(
        id="KUVA_nupakausi",
        defaults={
            "name_fi": "KUVA - Nuorisopalvelut, kausi",
            "name_en": "KUVA - Youth Services' conditions, kausi",
            "name_sv": "KUVA - Ungdomstjänsternas betingelser, kausi",
            "text_fi": "",
            "text_en": "",
            "text_sv": "",
            "terms_type": TermsOfUseTypeChoices.SERVICE,
        },
    )
    nupa_hinnoitteluehto, _ = TermsOfUse.objects.get_or_create(
        id="pricing_nupa",
        defaults={
            "name_fi": "KUVA - Nuorisopalveluiden alennusperusteet",
            "name_en": "KUVA - Nuorisopalveluiden alennusperusteet",
            "name_sv": "KUVA - Nuorisopalveluiden alennusperusteet",
            "text_fi": "",
            "text_en": "",
            "text_sv": "",
            "terms_type": TermsOfUseTypeChoices.PRICING,
        },
    )

    harrasta_yhdessa_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Harrasta yhdessä",
        defaults={
            "name_fi": "Harrasta yhdessä",
            "name_en": "Engage in hobbies together",
            "name_sv": "Utöva hobbyer tillsammans",
        },
    )
    jarjesta_tapahtuma_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Järjestä tapahtuma",
        defaults={
            "name_fi": "Järjestä tapahtuma",
            "name_en": "Organise an event",
            "name_sv": "Arrangera evenemang",
        },
    )
    kauta_laitteita_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Käytä laitteita",
        defaults={
            "name_fi": "Käytä laitteita",
            "name_en": "Use equipment",
            "name_sv": "Använd utrustning",
        },
    )
    liiku_ja_rentoudu_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Liiku ja rentoudu",
        defaults={
            "name_fi": "Liiku ja rentoudu",
            "name_en": "Exercise and relax",
            "name_sv": "Motionera och koppla av",
        },
    )
    loyda_juhlatila_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Löydä juhlatila",
        defaults={
            "name_fi": "Löydä juhlatila",
            "name_en": "Find a party venue",
            "name_sv": "Hitta festlokal",
        },
    )
    pida_kokous_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Pidä kokous",
        defaults={
            "name_fi": "Pidä kokous",
            "name_en": "Hold a meeting",
            "name_sv": "Håll möte",
        },
    )
    tee_musiikkia_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Tee musiikkia tai äänitä",
        defaults={
            "name_fi": "Tee musiikkia tai äänitä",
            "name_en": "Make music or record",
            "name_sv": "Gör musik eller spela in",
        },
    )
    yksin_tai_ryhma_tarkoitus, _ = IntendedUse.objects.get_or_create(
        name="Työskentele yksin tai ryhmässä",
        defaults={
            "name_fi": "Työskentele yksin tai ryhmässä",
            "name_en": "Work alone or in a group",
            "name_sv": "Arbeta enskilt eller i grupp",
        },
    )

    esitystekniikka_category, _ = EquipmentCategory.objects.get_or_create(
        name="Esitystekniikka ja AV-laitteet",
        defaults={
            "name_fi": "Esitystekniikka ja AV-laitteet",
            "name_en": "",
            "name_sv": "",
        },
    )
    keittiovalineet_category, _ = EquipmentCategory.objects.get_or_create(
        name="Keittiövälineet",
        defaults={
            "name_fi": "Keittiövälineet",
            "name_en": "",
            "name_sv": "",
        },
    )
    liikuntavalineet_category, _ = EquipmentCategory.objects.get_or_create(
        name="Liikuntavälineet",
        defaults={
            "name_fi": "Liikuntavälineet",
            "name_en": "",
            "name_sv": "",
        },
    )
    kaluesteet_category, _ = EquipmentCategory.objects.get_or_create(
        name="Kalusteet",
        defaults={
            "name_fi": "Kalusteet",
            "name_en": "",
            "name_sv": "",
        },
    )
    liittimet_category, _ = EquipmentCategory.objects.get_or_create(
        name="Liittimet",
        defaults={
            "name_fi": "Liittimet",
            "name_en": "",
            "name_sv": "",
        },
    )
    soittimet_category, _ = EquipmentCategory.objects.get_or_create(
        name="Soittimet",
        defaults={
            "name_fi": "Soittimet",
            "name_en": "",
            "name_sv": "",
        },
    )

    aani_laite, _ = Equipment.objects.get_or_create(
        name="Äänitekniikka",
        defaults={
            "name_fi": "Äänitekniikka",
            "name_en": "Sound system",
            "name_sv": "Ljudteknik",
            "category": esitystekniikka_category,
        },
    )
    astianpesukone_laite, _ = Equipment.objects.get_or_create(
        name="Astianpesukone",
        defaults={
            "name_fi": "Astianpesukone",
            "name_en": "Dishwasher",
            "name_sv": "Diskmaskin",
            "category": keittiovalineet_category,
        },
    )
    astiasto_laite, _ = Equipment.objects.get_or_create(
        name="Perusastiasto ja -keittiövälineet",
        defaults={
            "name_fi": "Perusastiasto ja -keittiövälineet",
            "name_en": "Basic set of dishes and kitchen equipment",
            "name_sv": "Standardservis och -köksredskap",
            "category": keittiovalineet_category,
        },
    )
    biljardi_laite, _ = Equipment.objects.get_or_create(
        name="Biljardipöytä",
        defaults={
            "name_fi": "Biljardipöytä",
            "name_en": "Billiard",
            "name_sv": "Biljard",
            "category": liikuntavalineet_category,
        },
    )
    click_share_laite, _ = Equipment.objects.get_or_create(
        name="ClickShare",
        defaults={
            "name_fi": "ClickShare",
            "name_en": "ClickShare",
            "name_sv": "ClickShare",
            "category": esitystekniikka_category,
        },
    )
    esiintymislava_laite, _ = Equipment.objects.get_or_create(
        name="Esiintymislava",
        defaults={
            "name_fi": "Esiintymislava",
            "name_en": "Stage",
            "name_sv": "Scen",
            "category": kaluesteet_category,
        },
    )
    hdmi_laite, _ = Equipment.objects.get_or_create(
        name="HDMI",
        defaults={
            "name_fi": "HDMI",
            "name_en": "HDMI",
            "name_sv": "HDMI",
            "category": liittimet_category,
        },
    )
    internet_laite, _ = Equipment.objects.get_or_create(
        name="Muu internet-yhteys",
        defaults={
            "name_fi": "Muu internet-yhteys",
            "name_en": "Other internet connection",
            "name_sv": "Annan internetuppkoppling",
            "category": esitystekniikka_category,
        },
    )
    istumapaikka_laite, _ = Equipment.objects.get_or_create(
        name="Istumapaikkoja",
        defaults={
            "name_fi": "Istumapaikkoja",
            "name_en": "Seats",
            "name_sv": "Sittplatser",
            "category": kaluesteet_category,
        },
    )
    jaakaappi_laite, _ = Equipment.objects.get_or_create(
        name="Jääkaappi",
        defaults={
            "name_fi": "Jääkaappi",
            "name_en": "Fridge",
            "name_sv": "Kylskåp",
            "category": keittiovalineet_category,
        },
    )
    jatkojohto_laite, _ = Equipment.objects.get_or_create(
        name="Jatkojohto",
        defaults={
            "name_fi": "Jatkojohto",
            "name_en": "Extension cord",
            "name_sv": "Kkarvsladd",
            "category": liittimet_category,
        },
    )
    kahvinkeitin_laite, _ = Equipment.objects.get_or_create(
        name="Kahvinkeitin",
        defaults={
            "name_fi": "Kahvinkeitin",
            "name_en": "Coffee maker",
            "name_sv": "Kaffekokare",
            "category": keittiovalineet_category,
        },
    )
    liesi_laite, _ = Equipment.objects.get_or_create(
        name="Liesi",
        defaults={
            "name_fi": "Liesi",
            "name_en": "Stove",
            "name_sv": "Spis",
            "category": keittiovalineet_category,
        },
    )
    liikuntavaline_laite, _ = Equipment.objects.get_or_create(
        name="Liikuntavälineitä",
        defaults={
            "name_fi": "Liikuntavälineitä",
            "name_en": "Exercise equipment",
            "name_sv": "Motionsredskap",
            "category": liikuntavalineet_category,
        },
    )
    mikro_laite, _ = Equipment.objects.get_or_create(
        name="Mikroaaltouuni",
        defaults={
            "name_fi": "Mikroaaltouuni",
            "name_en": "Microwave oven",
            "name_sv": "Mikrovågsugn",
            "category": keittiovalineet_category,
        },
    )
    naytto_laite, _ = Equipment.objects.get_or_create(
        name="Näyttö",
        defaults={
            "name_fi": "Näyttö",
            "name_en": "Display",
            "name_sv": "Skärm",
            "category": esitystekniikka_category,
        },
    )
    pakastin_laite, _ = Equipment.objects.get_or_create(
        name="Pakastin",
        defaults={
            "name_fi": "Pakastin",
            "name_en": "Freezer",
            "name_sv": "Frys",
            "category": keittiovalineet_category,
        },
    )
    peiliseina_laite, _ = Equipment.objects.get_or_create(
        name="Peiliseinä",
        defaults={
            "name_fi": "Peiliseinä",
            "name_en": "Mirror wall",
            "name_sv": "Spegelvägg",
            "category": kaluesteet_category,
        },
    )
    piano_laite, _ = Equipment.objects.get_or_create(
        name="Piano",
        defaults={
            "name_fi": "Piano",
            "name_en": "Piano",
            "name_sv": "Piano",
            "category": soittimet_category,
        },
    )
    poyta_laite, _ = Equipment.objects.get_or_create(
        name="Pöytä tai pöytiä",
        defaults={
            "name_fi": "Pöytä tai pöytiä",
            "name_en": "Table or tables",
            "name_sv": "Ett eller flera bord",
            "category": kaluesteet_category,
        },
    )
    rummut_laite, _ = Equipment.objects.get_or_create(
        name="Sähkörummut",
        defaults={
            "name_fi": "Sähkörummut",
            "name_en": "Electric drums",
            "name_sv": "e-trummor",
            "category": soittimet_category,
        },
    )
    scart_laite, _ = Equipment.objects.get_or_create(
        name="SCART",
        defaults={
            "name_fi": "SCART",
            "name_en": "SCART",
            "name_sv": "SCART",
            "category": liittimet_category,
        },
    )
    sohva_laite, _ = Equipment.objects.get_or_create(
        name="Sohvaryhmä",
        defaults={
            "name_fi": "Sohvaryhmä",
            "name_en": "Sofa set",
            "name_sv": "Soffgrupp",
            "category": kaluesteet_category,
        },
    )
    studio_laite, _ = Equipment.objects.get_or_create(
        name="Studiolaitteisto",
        defaults={
            "name_fi": "Studiolaitteisto",
            "name_en": "Studio equipment",
            "name_sv": "Studioutrustning",
            "category": esitystekniikka_category,
        },
    )
    tietokone_laite, _ = Equipment.objects.get_or_create(
        name="Tietokone",
        defaults={
            "name_fi": "Tietokone",
            "name_en": "Computer",
            "name_sv": "Dator",
            "category": esitystekniikka_category,
        },
    )
    uuni_laite, _ = Equipment.objects.get_or_create(
        name="Uuni",
        defaults={
            "name_fi": "Uuni",
            "name_en": "Oven",
            "name_sv": "Ugn",
            "category": keittiovalineet_category,
        },
    )
    valkotaulu_laite, _ = Equipment.objects.get_or_create(
        name="Valkotaulu, tussitaulu",
        defaults={
            "name_fi": "Valkotaulu, tussitaulu",
            "name_en": "Whiteboard",
            "name_sv": "Skrivtavla, tuschtavla",
            "category": esitystekniikka_category,
        },
    )
    vedenkeitin_laite, _ = Equipment.objects.get_or_create(
        name="Vedenkeitin",
        defaults={
            "name_fi": "Vedenkeitin",
            "name_en": "Electric kettle",
            "name_sv": "Vattenkokare",
            "category": keittiovalineet_category,
        },
    )
    vesipiste_laite, _ = Equipment.objects.get_or_create(
        name="Vesipiste",
        defaults={
            "name_fi": "Vesipiste",
            "name_en": "Water point",
            "name_sv": "Tappställe",
            "category": keittiovalineet_category,
        },
    )

    nolla_veroprosentti, _ = TaxPercentage.objects.get_or_create(value=Decimal("0.0"))
    uusi_veroprosentti, _ = TaxPercentage.objects.get_or_create(value=Decimal("25.5"))

    harakka_hauki_resource, _ = OriginHaukiResource.objects.get_or_create(id="2952865")
    mankeli_hauki_resource, _ = OriginHaukiResource.objects.get_or_create(id="2956668")
    aitio_hauki_resource, _ = OriginHaukiResource.objects.get_or_create(id="2958620")
    kellarikerros_hauki_resource, _ = OriginHaukiResource.objects.get_or_create(id="2956344")
    aula_hauki_resource, _ = OriginHaukiResource.objects.get_or_create(id="2959295")
    aina_varattu_resource, _ = OriginHaukiResource.objects.get_or_create(id="2965986")
    ovikoodi_kasiteltava_resource, _ = OriginHaukiResource.objects.get_or_create(id="2965985")
    tuple_resource, _ = OriginHaukiResource.objects.get_or_create(id="2965987")
    parveke_hauki_resource, _ = OriginHaukiResource.objects.get_or_create(id="2959623")
    malmi_hauki_resource, _ = OriginHaukiResource.objects.get_or_create(id="2964786")
    keskusta_hauki_resource, _ = OriginHaukiResource.objects.get_or_create(id="2964787")
    yrjo_hauki_resource, _ = OriginHaukiResource.objects.get_or_create(id="2959579")
    kalevi_hauki_resource, _ = OriginHaukiResource.objects.get_or_create(id="2959580")
    piitu_hauki_resource, _ = OriginHaukiResource.objects.get_or_create(id="2959581")

    harakka_merchant, _ = PaymentMerchant.objects.get_or_create(
        id="c9acaa73-b582-471c-b002-b038a8c00fb1",
        defaults={
            "name": "Pihlajasaarten testikirjasto",
        },
    )
    kellarikerros_payment_merchant, _ = PaymentMerchant.objects.get_or_create(
        id="9be158db-8e3a-4560-8e68-f3214b207d6c",
        defaults={
            "name": "Esimerkki Merchant",
        },
    )

    kellarikerros_payment_product, _ = PaymentProduct.objects.get_or_create(
        id="630dcc27-1ff1-3e12-b1ea-9df2571a36bc",
        defaults={
            "merchant": kellarikerros_payment_merchant,
        },
    )
    aitio_payment_product, _ = PaymentProduct.objects.get_or_create(
        id="eee7a1a4-b309-3919-aa7b-6d7eb675f9f4",
        defaults={
            "merchant": harakka_merchant,
        },
    )
    aula_payment_product, _ = PaymentProduct.objects.get_or_create(
        id="19161df6-9f1c-3a0f-a953-d013ca2e3c0c",
        defaults={
            "merchant": harakka_merchant,
        },
    )
    kalevi_payment_product, _ = PaymentProduct.objects.get_or_create(
        id="3cc8c05f-78cc-391c-b442-4f1b251697d3",
        defaults={
            "merchant": harakka_merchant,
        },
    )
    piitu_payment_product, _ = PaymentProduct.objects.get_or_create(
        id="db9cb2d4-0a72-3e5e-a5b6-9479ef59e256",
        defaults={
            "merchant": harakka_merchant,
        },
    )

    pihlajasarten_accounting, _ = PaymentAccounting.objects.get_or_create(
        name="Pihlajasaarten testikirjasto",
        defaults={
            "company_code": "2900",
            "main_ledger_account": "340025",
            "vat_code": "44",
            "internal_order": "2941505900",
            "profit_center": "",
            "project": "",
            "operation_area": "290017",
            "balance_profit_center": "2983300",
            "product_invoicing_sales_org": "2900",
            "product_invoicing_sales_office": "2911",
            "product_invoicing_material": "10003360",
            "product_invoicing_order_type": "ZTY1",
        },
    )

    # ------------------------------------------------------------------------------------------------------------
    # HARAKKA
    # ------------------------------------------------------------------------------------------------------------

    harakka = Unit.objects.create(
        name="Harakka, piilokoju",
        description=(
            "Luonnonsuojelualueen laidalla sijaitsevassa piilokojussa on lintuopasteita ja istuinpenkkejä. "
            "Kojusta voi tarkkailla saaren pesimälinnustoa lähietäisyydeltä. Piilokoju ei ole esteetön."
        ),
        tprek_id="71677",
        tprek_department_id="db5dbae8-93bb-4248-bfe6-e237b59eec12",
        address_street="Harakka",
        address_zip="00140",
        address_city="Helsinki",
        allow_permissions_from_ad_groups=False,
        coordinates=Point(x=2778530.371378948912024, y=8433140.38941946811974),
        origin_hauki_resource=harakka_hauki_resource,
        payment_merchant=harakka_merchant,
        payment_accounting=pihlajasarten_accounting,
    )

    # ------------------------------------------------------------------------------------------------------------
    # DESKTOP
    # ------------------------------------------------------------------------------------------------------------

    _maksuton_mankeli = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="7bbd9b47-ad06-495a-a530-b094574208d6",
        #
        # Strings
        name="Maksuton Mankeli (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="Maksuton Mankeli (AUTOMAATIOTESTI ÄLÄ POISTA) EN",
        name_sv="Maksuton Mankeli (AUTOMAATIOTESTI ÄLÄ POISTA) SV",
        description=(
            "Käytä tätä varausyksikköä, kun haluan varata suorimman ja yksinkertaisimman prosessin mukaan. "
            "Varaaminen on maksutonta ja kaikki varaukset hyväksytään. "
            "Varauksen voi tehdä 30 min välein, aikaslotti 0vrk-3kk. "
            "Peruutusaikaa ei ole, joten varauksen voi perua sen alkuun asti. "
            "Käytössä yksinkertaisin lomake 1. "
            "Tämä varausyksikkö vastaa kirjaston laitteita."
            "\n"
            "Tämä on esimerkkitekstiä eikä liity varaukseen. "
            "Mankeli Bernina 1008 sijaitsee kirjaston kaupunkiverstaalla sisääntulokerroksessa."
            "\n"
            "Kirjastossa on mustaa ja valkoista lankaa, nuppineuloja, saksia ja muita perusompelutarvikkeita. "
            "Koneella ei voi ommella parkkinahkaa tai hyvin paksuja kankaita. "
            "Ilmoittaudu henkilökunnalle ennen varausaikasi alkamista. "
            "Ennen kuin saat laitteen käyttöösi, sinun on esitettävä kirjastokortti, "
            "jossa on voimassa oleva lainausoikeus."
            "\n"
            "Laitetta voi käyttää omaan luovaan toimintaan. "
            "Tilaustöiden tekeminen korvausta vastaan tai ammattimainen tulonhankinta esimerkiksi "
            "myymällä kirjastossa tuotettuja tuotteita ei ole sallittua."
        ),
        description_en=(
            "Käytä tätä varausyksikköä, kun haluan varata suorimman ja yksinkertaisimman prosessin mukaan. "
            "Varaaminen on maksutonta ja kaikki varaukset hyväksytään. "
            "Varauksen voi tehdä 30 min välein, aikaslotti 0vrk-3kk. "
            "Peruutusaikaa ei ole, joten varauksen voi perua sen alkuun asti. "
            "Käytössä yksinkertaisin lomake 1. "
            "Tämä varausyksikkö vastaa kirjaston laitteita."
            "\n"
            "This is an example text and is not related to the reservation. "
            "Mankeli Bernina 1008 is located in the library's urban workshop on the entrance floor."
            "\n"
            "The library has black and white thread, button needles, scissors and other basic sewing supplies. "
            "The machine cannot sew leather or very thick fabrics. "
            "Report to the staff before the start of your reservation time. "
            "Before you can use the device, you must present a library card with a valid borrowing right."
            "\n"
            "You can use the device for your own creative activities. "
            "Making commissioned works for compensation or professional income generation, "
            "for example by selling products produced in the library, is not allowed."
        ),
        description_sv=(
            "Käytä tätä varausyksikköä, kun haluan varata suorimman ja yksinkertaisimman prosessin mukaan. "
            "Varaaminen on maksutonta ja kaikki varaukset hyväksytään. "
            "Varauksen voi tehdä 30 min välein, aikaslotti 0vrk-3kk. "
            "Peruutusaikaa ei ole, joten varauksen voi perua sen alkuun asti. "
            "Käytössä yksinkertaisin lomake 1. "
            "Tämä varausyksikkö vastaa kirjaston laitteita."
            "\n"
            "Detta är en exempeltext och är inte relaterad till reservationen. "
            "Mankeli Bernina 1008 ligger i bibliotekets stadsverkstad på entréplan."
            "\n"
            "Biblioteket har svartvit tråd, knappnålar, saxar och andra grundläggande sömnadstillbehör. "
            "Maskinen kan inte sy läder eller mycket tjocka tyger. "
            "Rapportera till personalen innan din bokningstid börjar. "
            "Innan du kan använda enheten måste du visa upp ett lånekort med giltig lånerätt."
            "\n"
            "Du kan använda enheten för dina egna kreativa aktiviteter. "
            "Att göra beställningsverk mot ersättning eller yrkesmässig inkomstgenerering, "
            "till exempel genom att sälja produkter producerade i biblioteket, är inte tillåtet."
        ),
        contact_information="",
        notes_when_applying="lisätiedot fi 123",
        notes_when_applying_en="lisätiedot eng 789",
        notes_when_applying_sv="lisätiedot sv 456",
        reservation_pending_instructions="Varausvahvistuksen lisäohjeteksti suomeksi 123",
        reservation_pending_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi 789",
        reservation_pending_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi 456",
        reservation_confirmed_instructions="Hyväksytty varausvahvistuksen lisäohjeteksti suomeksi 123",
        reservation_confirmed_instructions_en="Hyväksytty varausvahvistuksen lisäohjeteksti englanniksi 789",
        reservation_confirmed_instructions_sv="Hyväksytty varausvahvistuksen lisäohjeteksti ruotsiksi 456",
        reservation_cancelled_instructions="Peruttu varausvahvistuksen lisäohjeteksti suomeksi 123",
        reservation_cancelled_instructions_en="Peruttu varausvahvistuksen lisäohjeteksti englanniksi 789",
        reservation_cancelled_instructions_sv="Peruttu varausvahvistuksen lisäohjeteksti ruotsiksi 456",
        #
        # Integers
        surface_area=100,
        min_persons=0,
        max_persons=1,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=90,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(minutes=15),
        max_reservation_duration=datetime.timedelta(hours=2),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        can_apply_free_of_charge=False,
        allow_reservations_without_opening_hours=False,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.DIRECT,
        reservation_form=ReservationFormType.CONTACT_INFO_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=harakka,
        origin_hauki_resource=mankeli_hauki_resource,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        metadata_set=lomake_1,
        cancellation_terms=varauksen_alkuun_asti_peruutusehto,
        service_specific_terms=laitteet_palveluehto,
        pricing_terms=None,
        payment_terms=maksuton_maksuehto,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
    )
    _maksuton_mankeli_space = Space.objects.create(
        name="Maksuton Mankeli (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="Maksuton Mankeli (AUTOMAATIOTESTI ÄLÄ POISTA) EN",
        name_sv="Maksuton Mankeli (AUTOMAATIOTESTI ÄLÄ POISTA) SV",
        surface_area=100,
        max_persons=1,
        unit=harakka,
    )
    _maksuton_mankeli.spaces.set([
        _maksuton_mankeli_space,
    ])
    _maksuton_mankeli.intended_uses.set([
        kauta_laitteita_tarkoitus,
    ])
    _maksuton_mankeli.equipments.set([
        click_share_laite,
    ])
    _maksuton_mankeli_pricing = ReservationUnitPricing.objects.create(
        reservation_unit=_maksuton_mankeli,
        begins=local_date(2023, 9, 25),
        price_unit=PriceUnit.PER_15_MINS,
        payment_type=None,
        is_activated_on_begins=False,
        lowest_price=0,
        highest_price=0,
        tax_percentage=nolla_veroprosentti,
    )
    _maksuton_mankeli_access_type = ReservationUnitAccessType.objects.create(
        reservation_unit=_maksuton_mankeli,
        begin_date=local_date(2025, 6, 6),
        access_type=AccessType.UNRESTRICTED,
    )

    _aina_maksullinen_aitio = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="f34b4c81-5b1b-4311-9f03-1c45e67ab45a",
        #
        # Strings
        name="Aina maksullinen Aitio (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="Aina maksullinen Aitio (AUTOMAATIOTESTI ÄLÄ POISTA) EN",
        name_sv="Aina maksullinen Aitio (AUTOMAATIOTESTI ÄLÄ POISTA) SV",
        description=(
            "Käytä tätä varausyksikköä, kun haluan varata maksullisen tilan suorimman prosessin mukaan. "
            "Varaaja voi olla yhdistys, yritys tai yksityishenkilö. "
            "Varaaminen on maksullista ja varaus tulee maksaa verkkokaupassa. "
            "Kaikki maksetut varaukset hyväksytään. "
            "Varauksen voi tehdä 30 min välein, aikaslotti 0vrk-3kk. "
            "Peruutusaika on varauksen alkuun asti. "
            "Kun perut varauksen ennen sen alkamista, maksu tulisi hyvittää automaattisesti. "
            "Käytössä lomake 3. "
            "Tämä varausyksikkö vastaa asetuksiltaan esim. Oodin keittiötä, mutta peruutusaika on joustavampi."
            "\n"
            "Tämä on esimerkkitekstiä eikä liity varaukseen."
            "Mankeli Bernina 1008 sijaitsee kirjaston kaupunkiverstaalla sisääntulokerroksessa."
            "\n"
            "Kirjastossa on mustaa ja valkoista lankaa, nuppineuloja, saksia ja muita perusompelutarvikkeita."
            "Koneella ei voi ommella parkkinahkaa tai hyvin paksuja kankaita."
            "Ilmoittaudu henkilökunnalle ennen varausaikasi alkamista."
            "Ennen kuin saat laitteen käyttöösi, sinun on esitettävä kirjastokortti,"
            "jossa on voimassa oleva lainausoikeus."
            "\n"
            "Laitetta voi käyttää omaan luovaan toimintaan."
            "Tilaustöiden tekeminen korvausta vastaan tai ammattimainen tulonhankinta esimerkiksi"
            "myymällä kirjastossa tuotettuja tuotteita ei ole sallittua."
        ),
        description_en=(
            "Käytä tätä varausyksikköä, kun haluan varata maksullisen tilan suorimman prosessin mukaan. "
            "Varaaja voi olla yhdistys, yritys tai yksityishenkilö. "
            "Varaaminen on maksullista ja varaus tulee maksaa verkkokaupassa. "
            "Kaikki maksetut varaukset hyväksytään. "
            "Varauksen voi tehdä 30 min välein, aikaslotti 0vrk-3kk. "
            "Peruutusaika on varauksen alkuun asti. "
            "Kun perut varauksen ennen sen alkamista, maksu tulisi hyvittää automaattisesti. "
            "Käytössä lomake 3. "
            "Tämä varausyksikkö vastaa asetuksiltaan esim. Oodin keittiötä, mutta peruutusaika on joustavampi."
            "\n"
            "This is an example text and is not related to the reservation."
            "Mankeli Bernina 1008 is located in the library's urban workshop on the entrance floor."
            "\n"
            "The library has black and white thread, button needles, scissors and other basic sewing supplies."
            "The machine cannot sew leather or very thick fabrics."
            "Report to the staff before the start of your reservation time."
            "Before you can use the device, you must present a library card with a valid borrowing right."
            "\n"
            "You can use the device for your own creative activities."
            "Making commissioned works for compensation or professional income generation,"
            "for example by selling products produced in the library, is not allowed."
        ),
        description_sv=(
            "Käytä tätä varausyksikköä, kun haluan varata maksullisen tilan suorimman prosessin mukaan. "
            "Varaaja voi olla yhdistys, yritys tai yksityishenkilö. "
            "Varaaminen on maksullista ja varaus tulee maksaa verkkokaupassa. "
            "Kaikki maksetut varaukset hyväksytään. "
            "Varauksen voi tehdä 30 min välein, aikaslotti 0vrk-3kk. "
            "Peruutusaika on varauksen alkuun asti. "
            "Kun perut varauksen ennen sen alkamista, maksu tulisi hyvittää automaattisesti. "
            "Käytössä lomake 3. "
            "Tämä varausyksikkö vastaa asetuksiltaan esim. Oodin keittiötä, mutta peruutusaika on joustavampi."
            "\n"
            "Detta är en exempeltext och är inte relaterad till reservationen."
            "Mankeli Bernina 1008 ligger i bibliotekets stadsverkstad på entréplan."
            "\n"
            "Biblioteket har svartvit tråd, knappnålar, saxar och andra grundläggande sömnadstillbehör."
            "Maskinen kan inte sy läder eller mycket tjocka tyger."
            "Rapportera till personalen innan din bokningstid börjar."
            "Innan du kan använda enheten måste du visa upp ett lånekort med giltig lånerätt."
            "\n"
            "Du kan använda enheten för dina egna kreativa aktiviteter."
            "Att göra beställningsverk mot ersättning eller yrkesmässig inkomstgenerering,"
            "till exempel genom att sälja produkter producerade i biblioteket, är inte tillåtet."
        ),
        contact_information="",
        notes_when_applying="Varaus tulee maksaa verkkokaupassa.",
        notes_when_applying_en="The reservation must be paid for in the online store.",
        notes_when_applying_sv="Bokningen måste betalas i webbutiken.",
        reservation_pending_instructions="",
        reservation_pending_instructions_en="",
        reservation_pending_instructions_sv="",
        reservation_confirmed_instructions="",
        reservation_confirmed_instructions_en="",
        reservation_confirmed_instructions_sv="",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=50,
        min_persons=0,
        max_persons=6,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=90,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(minutes=15),
        max_reservation_duration=datetime.timedelta(hours=2),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        can_apply_free_of_charge=False,
        allow_reservations_without_opening_hours=False,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.DIRECT,
        reservation_form=ReservationFormType.PURPOSE_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=harakka,
        origin_hauki_resource=aitio_hauki_resource,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        metadata_set=lomake_3,
        cancellation_terms=varauksen_alkuun_asti_peruutusehto,
        service_specific_terms=maksulliset_palveluehto,
        pricing_terms=None,
        payment_terms=verkkokauppa_vain_maksuehto,
        payment_product=aitio_payment_product,
        payment_merchant=None,
        payment_accounting=None,
    )
    _aina_maksullinen_aitio_space = Space.objects.create(
        name="Aina maksullinen aitio (AUTOMAATIO TESTI ÄLÄ POISTA)",
        name_en="Aina maksullinen aitio (AUTOMAATIO TESTI ÄLÄ POISTA) EN",
        name_sv="Aina maksullinen aitio (AUTOMAATIO TESTI ÄLÄ POISTA) SV",
        surface_area=50,
        max_persons=6,
        unit=harakka,
    )
    _aina_maksullinen_aitio.spaces.set([
        _aina_maksullinen_aitio_space,
    ])
    _aina_maksullinen_aitio.intended_uses.set([
        pida_kokous_tarkoitus,
        loyda_juhlatila_tarkoitus,
        yksin_tai_ryhma_tarkoitus,
        kauta_laitteita_tarkoitus,
    ])
    _aina_maksullinen_aitio.equipments.set([
        liesi_laite,
        kahvinkeitin_laite,
        biljardi_laite,
        liikuntavaline_laite,
    ])
    _aina_maksullinen_aitio_pricing = ReservationUnitPricing.objects.create(
        reservation_unit=_aina_maksullinen_aitio,
        begins=local_date(2024, 9, 1),
        price_unit=PriceUnit.PER_HOUR,
        payment_type=PaymentType.ONLINE,
        is_activated_on_begins=False,
        lowest_price=0,
        highest_price=40,
        tax_percentage=uusi_veroprosentti,
    )
    _aina_maksullinen_aitio_access_type = ReservationUnitAccessType.objects.create(
        reservation_unit=_aina_maksullinen_aitio,
        begin_date=local_date(2025, 6, 6),
        access_type=AccessType.UNRESTRICTED,
    )

    _aina_kasiteltava_kellarikerros = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="2b6ed117-b53d-45b7-b931-94ac0a617743",
        #
        # Strings
        name="Aina käsiteltävä kellarikerros (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="Aina käsiteltävä kellarikerros (AUTOMAATIOTESTI ÄLÄ POISTA) EN",
        name_sv="Aina käsiteltävä kellarikerros (AUTOMAATIOTESTI ÄLÄ POISTA) SV",
        description=(
            "Käytä tätä varausyksikköä, kun haluan varata varausyksikön, "
            "jonka kaikki varaukset siirtyvät käsittelyyn. "
            "Varaus tulee hyväksyä tai hyläytä käsittelijän puolelta. "
            "Varauksen voi tehdä 30 min välein, aikaslotti 3vrk-3kk. "
            "Peruutusaika on 14 vrk, tämän jälkeen varausta ei voi perua. "
            "Käytössä lomake 3 maksuttomuuspyyntösallittu. "
            "Tämä varausyksikkö vastaa nuorisopalvelun tiloja."
            "\n"
            "Tämä on esimerkkitekstiä eikä liity varaukseen."
            "Mankeli Bernina 1008 sijaitsee kirjaston kaupunkiverstaalla sisääntulokerroksessa."
            "\n"
            "Kirjastossa on mustaa ja valkoista lankaa, nuppineuloja, saksia ja muita perusompelutarvikkeita."
            "Koneella ei voi ommella parkkinahkaa tai hyvin paksuja kankaita."
            "Ilmoittaudu henkilökunnalle ennen varausaikasi alkamista."
            "Ennen kuin saat laitteen käyttöösi, sinun on esitettävä kirjastokortti,"
            "jossa on voimassa oleva lainausoikeus."
            "\n"
            "Laitetta voi käyttää omaan luovaan toimintaan."
            "Tilaustöiden tekeminen korvausta vastaan tai ammattimainen tulonhankinta esimerkiksi"
            "myymällä kirjastossa tuotettuja tuotteita ei ole sallittua."
        ),
        description_en=(
            "Käytä tätä varausyksikköä, kun haluan varata varausyksikön, "
            "jonka kaikki varaukset siirtyvät käsittelyyn. "
            "Varaus tulee hyväksyä tai hyläytä käsittelijän puolelta. "
            "Varauksen voi tehdä 30 min välein, aikaslotti 3vrk-3kk. "
            "Peruutusaika on 14 vrk, tämän jälkeen varausta ei voi perua. "
            "Käytössä lomake 3 maksuttomuuspyyntösallittu. "
            "Tämä varausyksikkö vastaa nuorisopalvelun tiloja."
            "\n"
            "This is an example text and is not related to the reservation."
            "Mankeli Bernina 1008 is located in the library's urban workshop on the entrance floor."
            "\n"
            "The library has black and white thread, button needles, scissors and other basic sewing supplies."
            "The machine cannot sew leather or very thick fabrics."
            "Report to the staff before the start of your reservation time."
            "Before you can use the device, you must present a library card with a valid borrowing right."
            "\n"
            "You can use the device for your own creative activities."
            "Making commissioned works for compensation or professional income generation,"
            "for example by selling products produced in the library, is not allowed."
        ),
        description_sv=(
            "Käytä tätä varausyksikköä, kun haluan varata varausyksikön, "
            "jonka kaikki varaukset siirtyvät käsittelyyn. "
            "Varaus tulee hyväksyä tai hyläytä käsittelijän puolelta. "
            "Varauksen voi tehdä 30 min välein, aikaslotti 3vrk-3kk. "
            "Peruutusaika on 14 vrk, tämän jälkeen varausta ei voi perua. "
            "Käytössä lomake 3 maksuttomuuspyyntösallittu. "
            "Tämä varausyksikkö vastaa nuorisopalvelun tiloja."
            "\n"
            "Detta är en exempeltext och är inte relaterad till reservationen."
            "Mankeli Bernina 1008 ligger i bibliotekets stadsverkstad på entréplan."
            "\n"
            "Biblioteket har svartvit tråd, knappnålar, saxar och andra grundläggande sömnadstillbehör."
            "Maskinen kan inte sy läder eller mycket tjocka tyger."
            "Rapportera till personalen innan din bokningstid börjar."
            "Innan du kan använda enheten måste du visa upp ett lånekort med giltig lånerätt."
            "\n"
            "Du kan använda enheten för dina egna kreativa aktiviteter."
            "Att göra beställningsverk mot ersättning eller yrkesmässig inkomstgenerering,"
            "till exempel genom att sälja produkter producerade i biblioteket, är inte tillåtet."
        ),
        contact_information="",
        notes_when_applying=(
            "Tässä varausyksikössä kaikki varaukset siirtyvät käsittelyyn. "
            "Varaus tulee hyväksyä tai hylätä käsittelijän puolelta."
        ),
        notes_when_applying_en=(
            "In this reservation unit, all reservations are transferred to processing. "
            "The reservation must be accepted or rejected by the handler."
        ),
        notes_when_applying_sv=(
            "I denna reservationsenhet överförs alla reservationer till behandling. "
            "Reservationen måste accepteras eller avvisas av hanteraren."
        ),
        reservation_pending_instructions="",
        reservation_pending_instructions_en="",
        reservation_pending_instructions_sv="",
        reservation_confirmed_instructions="Hyväksytty varaus",
        reservation_confirmed_instructions_en="Hyväksytty varaus EN",
        reservation_confirmed_instructions_sv="Hyväksytty varaus SV",
        reservation_cancelled_instructions="Peruttu varaus",
        reservation_cancelled_instructions_en="Peruttu varaus EN",
        reservation_cancelled_instructions_sv="Peruttu varaus SV",
        #
        # Integers
        surface_area=100,
        min_persons=0,
        max_persons=50,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=90,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(minutes=30),
        max_reservation_duration=datetime.timedelta(hours=6),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=True,
        reservation_block_whole_day=False,
        can_apply_free_of_charge=True,
        allow_reservations_without_opening_hours=False,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_30_MINUTES,
        reservation_kind=ReservationKind.DIRECT,
        reservation_form=ReservationFormType.PURPOSE_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=harakka,
        origin_hauki_resource=kellarikerros_hauki_resource,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        metadata_set=lomake_3_sub,
        cancellation_terms=kaksi_viikkoa_peruutusehto,
        service_specific_terms=nupa_palveluehto,
        pricing_terms=nupa_hinnoitteluehto,
        payment_terms=verkkokauppa_kasittely_maksuehto,
        payment_product=kellarikerros_payment_product,
        payment_merchant=kellarikerros_payment_merchant,
        payment_accounting=pihlajasarten_accounting,
    )
    _aina_kasiteltava_kellarikerros_space = Space.objects.create(
        name="Aina käsiteltävä kellarikerros (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="Aina käsiteltävä kellarikerros (AUTOMAATIOTESTI ÄLÄ POISTA) EN",
        name_sv="Aina käsiteltävä kellarikerros (AUTOMAATIOTESTI ÄLÄ POISTA) SV",
        surface_area=100,
        max_persons=50,
        unit=harakka,
    )
    _aina_kasiteltava_kellarikerros.spaces.set([
        _aina_kasiteltava_kellarikerros_space,
    ])
    _aina_kasiteltava_kellarikerros.intended_uses.set([
        loyda_juhlatila_tarkoitus,
        jarjesta_tapahtuma_tarkoitus,
        harrasta_yhdessa_tarkoitus,
    ])
    _aina_kasiteltava_kellarikerros.equipments.set([
        poyta_laite,
        sohva_laite,
        istumapaikka_laite,
        aani_laite,
        hdmi_laite,
        jaakaappi_laite,
        naytto_laite,
        jatkojohto_laite,
    ])
    _aina_kasiteltava_kellarikerros_pricing = ReservationUnitPricing.objects.create(
        reservation_unit=_aina_kasiteltava_kellarikerros,
        begins=local_date(2024, 8, 23),
        price_unit=PriceUnit.PER_HOUR,
        payment_type=PaymentType.ONLINE_OR_INVOICE,
        is_activated_on_begins=False,
        lowest_price=0,
        highest_price=40,
        tax_percentage=uusi_veroprosentti,
    )
    _aina_kasiteltava_kellarikerros_access_type = ReservationUnitAccessType.objects.create(
        reservation_unit=_aina_kasiteltava_kellarikerros,
        begin_date=local_date(2025, 5, 28),
        access_type=AccessType.UNRESTRICTED,
    )

    _alennuskelpoinen_aula = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="d2c6c5c3-6024-4ff1-9275-73a4025501e9",
        #
        # Strings
        name="Alennuskelpoinen aula (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="Alennuskelpoinen aula (AUTOMAATIOTESTI ÄLÄ POISTA) EN",
        name_sv="Alennuskelpoinen aula (AUTOMAATIOTESTI ÄLÄ POISTA) SV",
        description=(
            "Käytä tätä varausyksikköä, kun haluan varata joko maksullisen tilan tai hakea hinnan alennusta. "
            "Alennusta haettaessa varaus siirtyy aina käsittelyyn. "
            "Varaaja voi olla yhdistys, yritys tai yksityishenkilö. "
            "Jos et hae alennusta, varaaminen on maksullista ja varaus tulee maksaa verkkokaupassa. "
            "Kaikki maksetut varaukset hyväksytään. "
            "Varauksen voi tehdä 30 min välein, aikaslotti 0vrk-3kk. "
            "Peruutusaika on 14 vrk ennen varausta. "
            "Kun perut varauksen ennen sen alkamista, maksu tulisi hyvittää automaattisesti. "
            "Käytössä lomake 4 maksullisuuspyyntö sallittu. "
            "Tämä varausyksikkö vastaa asetuksiltaan esim. nuorisopalvelun tiloja."
            "\n"
            "Tämä on esimerkkitekstiä eikä liity varaukseen."
            "Mankeli Bernina 1008 sijaitsee kirjaston kaupunkiverstaalla sisääntulokerroksessa."
            "\n"
            "Kirjastossa on mustaa ja valkoista lankaa, nuppineuloja, saksia ja muita perusompelutarvikkeita."
            "Koneella ei voi ommella parkkinahkaa tai hyvin paksuja kankaita."
            "Ilmoittaudu henkilökunnalle ennen varausaikasi alkamista."
            "Ennen kuin saat laitteen käyttöösi, sinun on esitettävä kirjastokortti,"
            "jossa on voimassa oleva lainausoikeus."
            "\n"
            "Laitetta voi käyttää omaan luovaan toimintaan."
            "Tilaustöiden tekeminen korvausta vastaan tai ammattimainen tulonhankinta esimerkiksi"
            "myymällä kirjastossa tuotettuja tuotteita ei ole sallittua."
        ),
        description_en=(
            "Käytä tätä varausyksikköä, kun haluan varata joko maksullisen tilan tai hakea hinnan alennusta. "
            "Alennusta haettaessa varaus siirtyy aina käsittelyyn. "
            "Varaaja voi olla yhdistys, yritys tai yksityishenkilö. "
            "Jos et hae alennusta, varaaminen on maksullista ja varaus tulee maksaa verkkokaupassa. "
            "Kaikki maksetut varaukset hyväksytään. "
            "Varauksen voi tehdä 30 min välein, aikaslotti 0vrk-3kk. "
            "Peruutusaika on 14 vrk ennen varausta. "
            "Kun perut varauksen ennen sen alkamista, maksu tulisi hyvittää automaattisesti. "
            "Käytössä lomake 4 maksullisuuspyyntö sallittu. "
            "Tämä varausyksikkö vastaa asetuksiltaan esim. nuorisopalvelun tiloja."
            "\n"
            "This is an example text and is not related to the reservation."
            "Mankeli Bernina 1008 is located in the library's urban workshop on the entrance floor."
            "\n"
            "The library has black and white thread, button needles, scissors and other basic sewing supplies."
            "The machine cannot sew leather or very thick fabrics."
            "Report to the staff before the start of your reservation time."
            "Before you can use the device, you must present a library card with a valid borrowing right."
            "\n"
            "You can use the device for your own creative activities."
            "Making commissioned works for compensation or professional income generation,"
            "for example by selling products produced in the library, is not allowed."
        ),
        description_sv=(
            "Käytä tätä varausyksikköä, kun haluan varata joko maksullisen tilan tai hakea hinnan alennusta. "
            "Alennusta haettaessa varaus siirtyy aina käsittelyyn. "
            "Varaaja voi olla yhdistys, yritys tai yksityishenkilö. "
            "Jos et hae alennusta, varaaminen on maksullista ja varaus tulee maksaa verkkokaupassa. "
            "Kaikki maksetut varaukset hyväksytään. "
            "Varauksen voi tehdä 30 min välein, aikaslotti 0vrk-3kk. "
            "Peruutusaika on 14 vrk ennen varausta. "
            "Kun perut varauksen ennen sen alkamista, maksu tulisi hyvittää automaattisesti. "
            "Käytössä lomake 4 maksullisuuspyyntö sallittu. "
            "Tämä varausyksikkö vastaa asetuksiltaan esim. nuorisopalvelun tiloja."
            "\n"
            "Detta är en exempeltext och är inte relaterad till reservationen."
            "Mankeli Bernina 1008 ligger i bibliotekets stadsverkstad på entréplan."
            "\n"
            "Biblioteket har svartvit tråd, knappnålar, saxar och andra grundläggande sömnadstillbehör."
            "Maskinen kan inte sy läder eller mycket tjocka tyger."
            "Rapportera till personalen innan din bokningstid börjar."
            "Innan du kan använda enheten måste du visa upp ett lånekort med giltig lånerätt."
            "\n"
            "Du kan använda enheten för dina egna kreativa aktiviteter."
            "Att göra beställningsverk mot ersättning eller yrkesmässig inkomstgenerering,"
            "till exempel genom att sälja produkter producerade i biblioteket, är inte tillåtet."
        ),
        contact_information="",
        notes_when_applying="",
        notes_when_applying_en="",
        notes_when_applying_sv="",
        reservation_pending_instructions="",
        reservation_pending_instructions_en="",
        reservation_pending_instructions_sv="",
        reservation_confirmed_instructions="",
        reservation_confirmed_instructions_en="",
        reservation_confirmed_instructions_sv="",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=10,
        min_persons=0,
        max_persons=182,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=90,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(minutes=30),
        max_reservation_duration=datetime.timedelta(hours=4),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        can_apply_free_of_charge=True,
        allow_reservations_without_opening_hours=False,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.DIRECT,
        reservation_form=ReservationFormType.AGE_GROUP_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=harakka,
        origin_hauki_resource=aula_hauki_resource,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_kaksi_viikkoa,
        metadata_set=lomake_4_sub,
        cancellation_terms=kaksi_viikkoa_peruutusehto,
        service_specific_terms=nupa_palveluehto,
        pricing_terms=nupa_hinnoitteluehto,
        payment_terms=verkkokauppa_alennus_maksuehto,
        payment_product=aula_payment_product,
        payment_merchant=None,
        payment_accounting=None,
    )
    _alennuskelpoinen_aula_space = Space.objects.create(
        name="Alennuskelpoinen aula (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="Alennuskelpoinen aula (AUTOMAATIOTESTI ÄLÄ POISTA) EN",
        name_sv="Alennuskelpoinen aula (AUTOMAATIOTESTI ÄLÄ POISTA) SV",
        surface_area=10,
        max_persons=5,
        unit=harakka,
    )
    _alennuskelpoinen_aula.spaces.set([
        _alennuskelpoinen_aula_space,
    ])
    _alennuskelpoinen_aula.intended_uses.set([
        jarjesta_tapahtuma_tarkoitus,
        harrasta_yhdessa_tarkoitus,
        yksin_tai_ryhma_tarkoitus,
    ])
    _alennuskelpoinen_aula.equipments.set([
        sohva_laite,
        scart_laite,
        studio_laite,
    ])
    _alennuskelpoinen_aula_pricing = ReservationUnitPricing.objects.create(
        reservation_unit=_alennuskelpoinen_aula,
        begins=local_date(2024, 9, 1),
        price_unit=PriceUnit.PER_HOUR,
        payment_type=PaymentType.ONLINE,
        is_activated_on_begins=False,
        lowest_price=0,
        highest_price=30,
        tax_percentage=uusi_veroprosentti,
    )
    _alennuskelpoinen_aula_access_type = ReservationUnitAccessType.objects.create(
        reservation_unit=_alennuskelpoinen_aula,
        begin_date=local_date(2025, 7, 15),
        access_type=AccessType.UNRESTRICTED,
    )

    _perumiskelvoton_parveke = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="e645a464-af29-41ee-a483-3163b7c9867a",
        #
        # Strings
        name="Perumiskelvoton parveke, maksuton (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="Perumiskelvoton parveke, maksuton (AUTOMAATIOTESTI ÄLÄ POISTA) EN",
        name_sv="Perumiskelvoton parveke, maksuton (AUTOMAATIOTESTI ÄLÄ POISTA) SV",
        description="Perumiskelvoton parveke, maksuton (AUTOMAATIOTESTI ÄLÄ POISTA)",
        description_en="Perumiskelvoton parveke, maksuton (AUTOMAATIOTESTI ÄLÄ POISTA) EN",
        description_sv="Perumiskelvoton parveke, maksuton (AUTOMAATIOTESTI ÄLÄ POISTA) SV",
        contact_information="",
        notes_when_applying="Varausyksikkökohtaiset lisätiedot",
        notes_when_applying_en="Varausyksikkökohtaiset lisätiedot EN",
        notes_when_applying_sv="Varausyksikkökohtaiset lisätiedot SV",
        reservation_pending_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_pending_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_pending_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_confirmed_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_confirmed_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_confirmed_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=35,
        min_persons=None,
        max_persons=4,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=365,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(minutes=30),
        max_reservation_duration=datetime.timedelta(hours=3),
        buffer_time_before=datetime.timedelta(minutes=30),
        buffer_time_after=datetime.timedelta(minutes=30),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        can_apply_free_of_charge=True,
        allow_reservations_without_opening_hours=False,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_30_MINUTES,
        reservation_kind=ReservationKind.DIRECT,
        reservation_form=ReservationFormType.RESERVEE_INFO_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=harakka,
        origin_hauki_resource=parveke_hauki_resource,
        reservation_unit_type=kokoustila,
        cancellation_rule=None,
        metadata_set=lomake_2,
        cancellation_terms=varauksen_alkuun_asti_peruutusehto,
        service_specific_terms=nupa_palveluehto,
        pricing_terms=None,
        payment_terms=maksuton_maksuehto,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
    )
    _perumiskelvoton_parveke_space = Space.objects.create(
        name="Perumiskelvoton parveke, maksuton (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="Perumiskelvoton parveke, maksuton (AUTOMAATIOTESTI ÄLÄ POISTA) EN",
        name_sv="Perumiskelvoton parveke, maksuton (AUTOMAATIOTESTI ÄLÄ POISTA) SV",
        surface_area=35,
        max_persons=4,
        unit=harakka,
    )
    _perumiskelvoton_parveke.spaces.set([
        _perumiskelvoton_parveke_space,
    ])
    _perumiskelvoton_parveke.intended_uses.set([
        pida_kokous_tarkoitus,
    ])
    _perumiskelvoton_parveke.equipments.set([])
    _perumiskelvoton_parveke_pricing = ReservationUnitPricing.objects.create(
        reservation_unit=_perumiskelvoton_parveke,
        begins=local_date(2024, 3, 1),
        price_unit=PriceUnit.PER_HOUR,
        payment_type=None,
        is_activated_on_begins=False,
        lowest_price=0,
        highest_price=0,
        tax_percentage=nolla_veroprosentti,
    )
    _perumiskelvoton_parveke_access_type = ReservationUnitAccessType.objects.create(
        reservation_unit=_perumiskelvoton_parveke,
        begin_date=local_date(2025, 7, 15),
        access_type=AccessType.UNRESTRICTED,
    )

    _aina_varattu_yksikko = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="c7d460b3-4157-44d7-a324-81d789c7b9b0",
        #
        # Strings
        name="Aina varattu yksikkö (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="Aina varattu yksikkö (AUTOMAATIOTESTI ÄLÄ POISTA) EN",
        name_sv="Aina varattu yksikkö (AUTOMAATIOTESTI ÄLÄ POISTA) SV",
        description="admin test",
        description_en="admin test EN",
        description_sv="admin test SV",
        contact_information="",
        notes_when_applying="admin test",
        notes_when_applying_en="admin test EN",
        notes_when_applying_sv="admin test SV",
        reservation_pending_instructions="",
        reservation_pending_instructions_en="",
        reservation_pending_instructions_sv="",
        reservation_confirmed_instructions="",
        reservation_confirmed_instructions_en="",
        reservation_confirmed_instructions_sv="",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=40,
        min_persons=None,
        max_persons=20,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=182,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(minutes=15),
        max_reservation_duration=datetime.timedelta(hours=2),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        can_apply_free_of_charge=False,
        allow_reservations_without_opening_hours=False,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.DIRECT,
        reservation_form=ReservationFormType.CONTACT_INFO_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=harakka,
        origin_hauki_resource=aina_varattu_resource,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        metadata_set=lomake_1,
        cancellation_terms=varauksen_alkuun_asti_peruutusehto,
        service_specific_terms=nupa_palveluehto,
        pricing_terms=None,
        payment_terms=maksuton_maksuehto,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
    )
    _aina_varattu_yksikko_space = Space.objects.create(
        name="Aina varattu yksikkö (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="Aina varattu yksikkö (AUTOMAATIOTESTI ÄLÄ POISTA) EN",
        name_sv="Aina varattu yksikkö (AUTOMAATIOTESTI ÄLÄ POISTA) SV",
        surface_area=40,
        max_persons=20,
        unit=harakka,
    )
    _aina_varattu_yksikko.spaces.set([
        _aina_varattu_yksikko_space,
    ])
    _aina_varattu_yksikko.intended_uses.set([
        loyda_juhlatila_tarkoitus,
    ])
    _aina_varattu_yksikko.equipments.set([
        rummut_laite,
    ])
    _aina_varattu_yksikko_pricing = ReservationUnitPricing.objects.create(
        reservation_unit=_aina_varattu_yksikko,
        begins=local_date(2024, 3, 1),
        price_unit=PriceUnit.PER_HOUR,
        payment_type=PaymentType.ONLINE,
        is_activated_on_begins=False,
        lowest_price=0,
        highest_price=0,
        tax_percentage=nolla_veroprosentti,
    )
    _aina_varattu_yksikko_access_type = ReservationUnitAccessType.objects.create(
        reservation_unit=_aina_varattu_yksikko,
        begin_date=local_date(2025, 7, 15),
        access_type=AccessType.UNRESTRICTED,
    )

    _ovikoodi_maksuton_kasiteltava_yksikko = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="307e84e4-b226-480d-bc3a-57d67c884048",
        #
        # Strings
        name="Ovikoodi maksuton käsiteltävä (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="Ovikoodi maksuton käsiteltävä (AUTOMAATIOTESTI ÄLÄ POISTA) EN",
        name_sv="Ovikoodi maksuton käsiteltävä (AUTOMAATIOTESTI ÄLÄ POISTA) SV",
        description=(
            "Tällä varausyksiköllä testataan avaimetonta kulkua."
            "\n"
            "Tervetuloa viihtyisään olohuoneeseemme, joka tarjoaa täydellisen paikan rentoutumiseen ja ajanviettoon. "
            "Tilaan pääsee kätevästi ovikoodilla, joka takaa yksityisyyden ja turvallisuuden. "
            "Olohuoneessa on mukavat istuimet, moderni sisustus ja runsaasti luonnonvaloa. "
            "Varustukseen kuuluu myös suuri televisio, äänentoistojärjestelmä ja nopea Wi-Fi-yhteys. "
            "Tämä tila sopii erinomaisesti niin rentoutumiseen kuin pienten kokousten "
            "tai illanviettojen järjestämiseen."
            "\n"
            "Katso tilojen käytön perehdytysvideo ja tutustu asukaskäytön turvallisuusohjeisiin "
            "ennen kun varaat tilan. "
            "Varatessasi tilan vastaat itse tilan valvonnasta. Tilan henkilökunta ei ole paikalla. "
            "Ota yhteys toimipisteeseen (puh. 09 310 41613) ja sovi avaimen noudosta."
            "Luovutamme sinulle tilan avaimet tai kulkutunnisteen varausta edeltävänä arkipäivänä klo 9-16."
            "\n"
            "Kehitämme tässä kohteessa tilojen sujuvaa asukaskäyttöä ja saatamme olla varauksen "
            "jälkeen yhteydessä tilankäyttäjään palautteen keräämiseksi."
        ),
        description_en=(
            "This reservation unit is meant for testing keyless entry."
            "\n"
            "Welcome to our cozy living room, the perfect place for relaxation and socializing. "
            "Access to the room is conveniently secured with a door code, ensuring privacy and safety. "
            "The living room features comfortable seating, modern decor, and plenty of natural light. "
            "It is equipped with a large TV, sound system, and high-speed Wi-Fi. "
            "This space is ideal for both unwinding and hosting small meetings or gatherings."
            "\n"
            "Watch the introductory video on the use of the spaces (select the subtitle language from the settings) "
            "and familiarize yourself with the safety instructions for resident use before you reserve a space. "
            "When you reserve the space, you are responsible for monitoring it yourself. "
            "The staff of the space is not present. "
            "Please contact the staff (p. 09 310 41613) and arrange to pick up the key. "
            "We will hand over the keys or access pass to the space to you on the weekday "
            "before the reservation from 9 am to 4 pm."
            "\n"
            "We are developing the resident use of this space and in order to collect feedback, "
            "we may be in contact with the user after the reservation."
            "\n"
            "Kehitämme tässä kohteessa tilojen sujuvaa asukaskäyttöä ja saatamme olla "
            "varauksen jälkeen yhteydessä tilankäyttäjään palautteen keräämiseksi."
        ),
        description_sv=(
            "Denna bokningsenhet testar nyckelfri åtkomst."
            "\n"
            "Välkommen till vårt mysiga vardagsrum, den perfekta platsen för avkoppling och umgänge. "
            "Tillträde till rummet sker smidigt med en dörrkod, vilket garanterar integritet och säkerhet. "
            "Vardagsrummet har bekväma sittplatser, modern inredning och gott om naturligt ljus. "
            "Det är utrustat med en stor TV, ljudsystem och snabb Wi-Fi. "
            "Detta utrymme är idealiskt för både avkoppling och för att hålla små möten eller sammankomster."
            "\n"
            "Se introduktionsfilmen om användningen av lokaler (välj undertextspråk från inställningarna) "
            "och bekanta dig med säkerhetsanvisningar för invånarandvändningen innan du boka lokalen. "
            "När du bokar lokalen ansvarar du själv för övervakning av den. Personalen är inte på plats. "
            "Kontakta personalen (tel. 09 310 41613) och ordna med att hämta nyckeln. "
            "Vi kommer att överlämna nycklarna eller tillträdespasset till dig på arbetsdagen "
            "före bokningen, mellan kl. 9 och 16."
            "\n"
            "Vi utvecklar en smidig användning av anläggningarna på denna destination och vi kan vara "
            "i kontakt med anläggningens användare efter bokning för att samla in feedback."
        ),
        contact_information="",
        notes_when_applying=(
            "Perusteet maksuttomalle käytölle tai hinnan alennukselle on ilmoitettava varausta tehtäessä. "
            "Jälkikäteen ilmoitettuja hinnoitteluperusteisiin liittyviä tietoja ei käsitellä eikä maksua hyvitetä."
            "\n"
            "Katso tilojen käytön perehdytysvideo ja tutustu asukaskäytön turvallisuusohjeisiin ennen kun varaat tilan."
            "\n"
            "Tilan loppusiivous on varaajan vastuulla. Alkuvalmistelut ja loppusiivous sisältyvät varausaikaan."
        ),
        notes_when_applying_en=(
            "Justifications for free-of-charge use or a price reduction must be indicated when "
            "making the reservation. Any details related to the pricing basis provided afterwards "
            "will not be processed and the payment will not be refunded."
            "\n"
            "Watch the introductory video on the use of the spaces (select the subtitle language from the settings) "
            "and familiarize yourself with the safety instructions for resident use before you reserve a space."
            "\n"
            "Final cleaning of the space is the responsibility of the person who made the reservation. "
            "Initial preparations and the final cleaning are included in the reserved time."
        ),
        notes_when_applying_sv=(
            "Motiveringar för kostnadsfri användning eller en prissänkning måste anges vid bokningen. "
            "Detaljer relaterade till prissättningen som tillhandahålls efteråt kommer inte att "
            "behandlas och betalningen återbetalas inte."
            "\n"
            "Se introduktionsfilmen om användningen av lokaler (välj undertextspråk från inställningarna) "
            "och bekanta dig med säkerhetsanvisningar för invånarandvändningen innan du boka lokalen."
            "\n"
            "Personen som har gjort bokningen ansvarar för slutstädning av lokalen. "
            "Förberedelser och slutstädning ingår i bokningstiden."
        ),
        reservation_pending_instructions="Käsittelemme varauksen pääsääntöisesti kolmen arkipäivän kuluessa.",
        reservation_pending_instructions_en="We generally process your reservation within three working days.",
        reservation_pending_instructions_sv="Vi behandlar i allmänhet bokningen inom tre arbetsdagar.",
        reservation_confirmed_instructions=(
            "Varatessasi tilan vastaat itse tilan valvonnasta. Tilan henkilökunta ei ole paikalla."
            "\n"
            "Katso tilojen käytön perehdytysvideo ja tutustu asukaskäytön turvallisuusohjeisiin "
            "ennen kun varaat tilan. Varatessasi tilan vastaat itse tilan valvonnasta. "
            "Tilan henkilökunta ei ole paikalla."
            "\n"
            "Kehitämme tässä kohteessa tilojen sujuvaa asukaskäyttöä ja saatamme olla varauksen "
            "jälkeen yhteydessä tilankäyttäjään palautteen keräämiseksi."
            "\n"
            "Tilan loppusiivous on varaajan vastuulla. Alkuvalmistelut ja loppusiivous sisältyvät varausaikaan."
        ),
        reservation_confirmed_instructions_en=(
            "When you reserve the space, you are responsible for monitoring it yourself. "
            "The staff of the space is not present."
            "\n"
            "Watch the introductory video on the use of the spaces and familiarize yourself with "
            "the safety instructions for resident use before you reserve a space. "
            "When you reserve the space, you are responsible for monitoring it yourself. "
            "The staff of the space is not present."
            "\n"
            "We are developing the resident use of this space and in order to collect feedback, "
            "we may be in contact with the user after the reservation."
        ),
        reservation_confirmed_instructions_sv=(
            "När du bokar lokalen ansvarar du själv för övervakning av den. I princip är ingen personal på plats."
            "\n"
            "Se introduktionsfilmen om användningen av lokaler och bekanta dig med säkerhetsanvisningar "
            "för invånarandvändningen innan du boka lokalen. När du bokar lokalen ansvarar du själv för "
            "övervakning av den. Personalen är inte på plats."
            "\n"
            "Vi utvecklar en smidig användning av anläggningarna på denna destination och vi kan vara "
            "i kontakt med anläggningens användare efter bokning för att samla in feedback."
        ),
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=40,
        min_persons=None,
        max_persons=20,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=30,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(minutes=15),
        max_reservation_duration=datetime.timedelta(hours=2),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        can_apply_free_of_charge=False,
        allow_reservations_without_opening_hours=False,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.DIRECT,
        reservation_form=ReservationFormType.AGE_GROUP_FORM,
        #
        # Lists
        search_terms=["ovikoodi"],
        #
        # Many-to-One related
        unit=harakka,
        origin_hauki_resource=ovikoodi_kasiteltava_resource,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        metadata_set=lomake_4,
        cancellation_terms=varauksen_alkuun_asti_peruutusehto,
        service_specific_terms=nupa_palveluehto,
        pricing_terms=None,
        payment_terms=maksuton_maksuehto,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
    )
    _ovikoodi_maksuton_kasiteltava_yksikko_space = Space.objects.create(
        name="Ovikoodi maksuton käsiteltävä (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="Ovikoodi maksuton käsiteltävä (AUTOMAATIOTESTI ÄLÄ POISTA) EN",
        name_sv="Ovikoodi maksuton käsiteltävä (AUTOMAATIOTESTI ÄLÄ POISTA) SV",
        surface_area=40,
        max_persons=20,
        unit=harakka,
    )
    _ovikoodi_maksuton_kasiteltava_yksikko.spaces.set([
        _ovikoodi_maksuton_kasiteltava_yksikko_space,
    ])
    _ovikoodi_maksuton_kasiteltava_yksikko.intended_uses.set([
        loyda_juhlatila_tarkoitus,
    ])
    _ovikoodi_maksuton_kasiteltava_yksikko.equipments.set([])
    _ovikoodi_maksuton_kasiteltava_yksikko_pricing = ReservationUnitPricing.objects.create(
        reservation_unit=_ovikoodi_maksuton_kasiteltava_yksikko,
        begins=local_date(2024, 3, 1),
        price_unit=PriceUnit.PER_HOUR,
        payment_type=PaymentType.ONLINE,
        is_activated_on_begins=False,
        lowest_price=0,
        highest_price=0,
        tax_percentage=nolla_veroprosentti,
    )
    _ovikoodi_maksuton_kasiteltava_yksikko_access_type = ReservationUnitAccessType.objects.create(
        reservation_unit=_ovikoodi_maksuton_kasiteltava_yksikko,
        begin_date=local_date(2025, 7, 15),
        access_type=AccessType.ACCESS_CODE,
    )

    _tuplabuukattu_tupla = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="c30a8f17-f675-4a21-8fc3-b8c7afffa96e",
        #
        # Strings
        name="Tuplabuukattu tupa (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="Tuplabuukattu tupa (AUTOMAATIOTESTI ÄLÄ POISTA) EN",
        name_sv="Tuplabuukattu tupa (AUTOMAATIOTESTI ÄLÄ POISTA) SV",
        description="tuplabuukkaus",
        description_en="tuplabuukkaus EN",
        description_sv="tuplabuukkaus SV",
        contact_information="",
        notes_when_applying="",
        notes_when_applying_en="",
        notes_when_applying_sv="",
        reservation_pending_instructions="",
        reservation_pending_instructions_en="",
        reservation_pending_instructions_sv="",
        reservation_confirmed_instructions="",
        reservation_confirmed_instructions_en="",
        reservation_confirmed_instructions_sv="",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=40,
        min_persons=None,
        max_persons=60,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=182,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(minutes=15),
        max_reservation_duration=datetime.timedelta(hours=2),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        can_apply_free_of_charge=False,
        allow_reservations_without_opening_hours=False,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.DIRECT,
        reservation_form=ReservationFormType.CONTACT_INFO_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=harakka,
        origin_hauki_resource=tuple_resource,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        metadata_set=lomake_1,
        cancellation_terms=varauksen_alkuun_asti_peruutusehto,
        service_specific_terms=nupa_palveluehto,
        pricing_terms=None,
        payment_terms=maksuton_maksuehto,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
    )
    _tuplabuukattu_tupla_space = Space.objects.create(
        name="Tuplabuukattu tupa (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="Tuplabuukattu tupa (AUTOMAATIOTESTI ÄLÄ POISTA) EN",
        name_sv="Tuplabuukattu tupa (AUTOMAATIOTESTI ÄLÄ POISTA) SV",
        surface_area=60,
        max_persons=40,
        unit=harakka,
    )
    _tuplabuukattu_tupla.spaces.set([
        _tuplabuukattu_tupla_space,
    ])
    _tuplabuukattu_tupla.intended_uses.set([
        loyda_juhlatila_tarkoitus,
    ])
    _tuplabuukattu_tupla.equipments.set([
        rummut_laite,
    ])
    _tuplabuukattu_tupla_pricing = ReservationUnitPricing.objects.create(
        reservation_unit=_tuplabuukattu_tupla,
        begins=local_date(2024, 3, 1),
        price_unit=PriceUnit.PER_HOUR,
        payment_type=PaymentType.ONLINE,
        is_activated_on_begins=False,
        lowest_price=0,
        highest_price=0,
        tax_percentage=nolla_veroprosentti,
    )
    _tuplabuukattu_tupla_access_type = ReservationUnitAccessType.objects.create(
        reservation_unit=_tuplabuukattu_tupla,
        begin_date=local_date(2025, 7, 15),
        access_type=AccessType.UNRESTRICTED,
    )

    # ------------------------------------------------------------------------------------------------------------
    # DESKTOP / KAUSIVARAUS
    # ------------------------------------------------------------------------------------------------------------

    _kausivarausyksikko_malmi = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="52f16e97-4986-4c4e-8fc5-8fab4ab66933",
        #
        # Strings
        name="KAUSIVARAUS yksikkö Malmi (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="KAUSIVARAUS yksikkö Malmi (AUTOMAATIOTESTI ÄLÄ POISTA) EN",
        name_sv="KAUSIVARAUS yksikkö Malmi (AUTOMAATIOTESTI ÄLÄ POISTA) SV",
        description="Kuvaus",
        description_en="Kuvaus EN",
        description_sv="Kuvaus SV",
        contact_information="",
        notes_when_applying="",
        notes_when_applying_en="",
        notes_when_applying_sv="",
        reservation_pending_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_pending_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_pending_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_confirmed_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_confirmed_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_confirmed_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=50,
        min_persons=1,
        max_persons=10,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=0,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(),
        max_reservation_duration=datetime.timedelta(),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        can_apply_free_of_charge=False,
        allow_reservations_without_opening_hours=False,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.SEASON,
        reservation_form=ReservationFormType.CONTACT_INFO_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=harakka,
        origin_hauki_resource=malmi_hauki_resource,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        metadata_set=lomake_1,
        cancellation_terms=None,
        service_specific_terms=None,
        pricing_terms=None,
        payment_terms=None,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
    )
    _kausivarausyksikko_malmi_space = Space.objects.create(
        name="KAUSIVARAUS yksikkö Malmi (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="KAUSIVARAUS yksikkö Malmi (AUTOMAATIOTESTI ÄLÄ POISTA) EN",
        name_sv="KAUSIVARAUS yksikkö Malmi (AUTOMAATIOTESTI ÄLÄ POISTA) SV",
        surface_area=100,
        max_persons=1,
        unit=harakka,
    )
    _kausivarausyksikko_malmi.spaces.set([
        _kausivarausyksikko_malmi_space,
    ])
    _kausivarausyksikko_malmi.intended_uses.set([
        jarjesta_tapahtuma_tarkoitus,
        harrasta_yhdessa_tarkoitus,
        liiku_ja_rentoudu_tarkoitus,
    ])
    _kausivarausyksikko_malmi.equipments.set([
        istumapaikka_laite,
        piano_laite,
        rummut_laite,
    ])
    _kausivarausyksikko_malmi_pricing = ReservationUnitPricing.objects.create(
        reservation_unit=_kausivarausyksikko_malmi,
        begins=local_date(2025, 6, 12),
        price_unit=PriceUnit.PER_HOUR,
        payment_type=None,
        is_activated_on_begins=False,
        lowest_price=0,
        highest_price=0,
        tax_percentage=nolla_veroprosentti,
    )
    _kausivarausyksikko_malmi_access_type = ReservationUnitAccessType.objects.create(
        reservation_unit=_kausivarausyksikko_malmi,
        begin_date=local_date(2025, 6, 12),
        access_type=AccessType.UNRESTRICTED,
    )
    for weekday in Weekday:  # type: ignore[attr-defined]
        ApplicationRoundTimeSlot.objects.create(
            reservation_unit=_kausivarausyksikko_malmi,
            weekday=weekday,
            is_closed=False,
            reservable_times=[TimeSlotDB(begin="09:00:00", end="21:00:00")],
        )

    _kausivarausyksikko_keskusta = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="99c2f30e-40ad-4aca-aa78-01ac92a0b1ff",
        #
        # Strings
        name="KAUSIVARAUS yksikkö Keskusta (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="KAUSIVARAUS yksikkö Keskusta (AUTOMAATIOTESTI ÄLÄ POISTA) EN",
        name_sv="KAUSIVARAUS yksikkö Keskusta (AUTOMAATIOTESTI ÄLÄ POISTA) SV",
        description="Kuvaus fi",
        description_en="Kuvaus EN",
        description_sv="Kuvaus SV",
        contact_information="",
        notes_when_applying="",
        notes_when_applying_en="",
        notes_when_applying_sv="",
        reservation_pending_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_pending_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_pending_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_confirmed_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_confirmed_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_confirmed_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=100,
        min_persons=1,
        max_persons=20,
        max_reservations_per_user=None,
        reservations_min_days_before=0,
        reservations_max_days_before=0,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(),
        max_reservation_duration=datetime.timedelta(),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        can_apply_free_of_charge=False,
        allow_reservations_without_opening_hours=False,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.SEASON,
        reservation_form=ReservationFormType.CONTACT_INFO_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=harakka,
        origin_hauki_resource=keskusta_hauki_resource,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        metadata_set=lomake_1,
        cancellation_terms=None,
        service_specific_terms=None,
        pricing_terms=None,
        payment_terms=None,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
    )
    _kausivarausyksikko_keskusta_space = Space.objects.create(
        name="KAUSIVARAUS yksikkö Keskusta (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="KAUSIVARAUS yksikkö Keskusta (AUTOMAATIOTESTI ÄLÄ POISTA) EN",
        name_sv="KAUSIVARAUS yksikkö Keskusta (AUTOMAATIOTESTI ÄLÄ POISTA) SV",
        surface_area=100,
        max_persons=1,
        unit=harakka,
    )
    _kausivarausyksikko_keskusta.spaces.set([
        _kausivarausyksikko_keskusta_space,
    ])
    _kausivarausyksikko_keskusta.intended_uses.set([
        loyda_juhlatila_tarkoitus,
        jarjesta_tapahtuma_tarkoitus,
        harrasta_yhdessa_tarkoitus,
    ])
    _kausivarausyksikko_keskusta.equipments.set([
        sohva_laite,
        istumapaikka_laite,
        piano_laite,
        rummut_laite,
    ])
    _kausivarausyksikko_keskusta_pricing = ReservationUnitPricing.objects.create(
        reservation_unit=_kausivarausyksikko_keskusta,
        begins=local_date(2025, 6, 12),
        price_unit=PriceUnit.PER_HOUR,
        payment_type=None,
        is_activated_on_begins=False,
        lowest_price=0,
        highest_price=0,
        tax_percentage=nolla_veroprosentti,
    )
    _kausivarausyksikko_keskusta_access_type = ReservationUnitAccessType.objects.create(
        reservation_unit=_kausivarausyksikko_keskusta,
        begin_date=local_date(2025, 6, 12),
        access_type=AccessType.UNRESTRICTED,
    )
    for weekday in Weekday:  # type: ignore[attr-defined]
        ApplicationRoundTimeSlot.objects.create(
            reservation_unit=_kausivarausyksikko_keskusta,
            weekday=weekday,
            is_closed=False,
            reservable_times=[TimeSlotDB(begin="09:00:00", end="21:00:00")],
        )

    _kausivarausyksikko_yrjo = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="1ba828f9-620f-4dea-ba60-c86ea5487648",
        #
        # Strings
        name="KAUSIVARAUS yksikkö OVIKOODI Yrjö (Manuaalitestaus)",
        name_en="KAUSIVARAUS yksikkö OVIKOODI Yrjö (Manuaalitestaus) EN",
        name_sv="KAUSIVARAUS yksikkö OVIKOODI Yrjö (Manuaalitestaus) SV",
        description="Kausivaraus yksikkö Yrjö \nAukiolo \nMa - pe 10:00-22:00 Varauksella \n12:00-13:00 Suljettu",
        description_en="Kuvaus EN",
        description_sv="Kuvaus SV",
        contact_information="",
        notes_when_applying="",
        notes_when_applying_en="",
        notes_when_applying_sv="",
        reservation_pending_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_pending_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_pending_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_confirmed_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_confirmed_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_confirmed_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=50,
        min_persons=5,
        max_persons=10,
        max_reservations_per_user=10,
        reservations_min_days_before=0,
        reservations_max_days_before=182,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(),
        max_reservation_duration=datetime.timedelta(),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        can_apply_free_of_charge=True,
        allow_reservations_without_opening_hours=False,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.SEASON,
        reservation_form=ReservationFormType.AGE_GROUP_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=harakka,
        origin_hauki_resource=yrjo_hauki_resource,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        metadata_set=lomake_4_sub,
        cancellation_terms=varauksen_alkuun_asti_peruutusehto,
        service_specific_terms=maksuton_palveluehto,
        pricing_terms=nupa_hinnoitteluehto,
        payment_terms=verkkokauppa_vain_maksuehto,
        payment_product=None,
        payment_merchant=None,
        payment_accounting=None,
    )
    _kausivarausyksikko_yrjo_space = Space.objects.create(
        name="KAUSIVARAUS yksikkö Yrjö (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="KAUSIVARAUS yksikkö Yrjö (AUTOMAATIOTESTI ÄLÄ POISTA) EN",
        name_sv="KAUSIVARAUS yksikkö Yrjö (AUTOMAATIOTESTI ÄLÄ POISTA) SV",
        surface_area=50,
        max_persons=10,
        unit=harakka,
    )
    _kausivarausyksikko_yrjo.spaces.set([
        _kausivarausyksikko_yrjo_space,
    ])
    _kausivarausyksikko_yrjo.intended_uses.set([
        harrasta_yhdessa_tarkoitus,
        liiku_ja_rentoudu_tarkoitus,
    ])
    _kausivarausyksikko_yrjo.equipments.set([
        poyta_laite,
        sohva_laite,
        esiintymislava_laite,
        peiliseina_laite,
        liikuntavaline_laite,
    ])
    _kausivarausyksikko_yrjo_pricing = ReservationUnitPricing.objects.create(
        reservation_unit=_kausivarausyksikko_yrjo,
        begins=local_date(2024, 8, 27),
        price_unit=PriceUnit.FIXED,
        payment_type=PaymentType.ONLINE,
        is_activated_on_begins=False,
        lowest_price=Decimal("12.40"),
        highest_price=Decimal("50.00"),
        tax_percentage=nolla_veroprosentti,
    )
    _kausivarausyksikko_yrjo_access_type = ReservationUnitAccessType.objects.create(
        reservation_unit=_kausivarausyksikko_yrjo,
        begin_date=local_date(2025, 8, 1),
        access_type=AccessType.ACCESS_CODE,
    )
    ApplicationRoundTimeSlot.objects.create(
        reservation_unit=_kausivarausyksikko_yrjo,
        weekday=Weekday.MONDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="10:00:00", end="19:00:00")],
    )
    ApplicationRoundTimeSlot.objects.create(
        reservation_unit=_kausivarausyksikko_yrjo,
        weekday=Weekday.TUESDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="11:00:00", end="18:00:00")],
    )
    ApplicationRoundTimeSlot.objects.create(
        reservation_unit=_kausivarausyksikko_yrjo,
        weekday=Weekday.WEDNESDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="09:00:00", end="21:00:00")],
    )
    ApplicationRoundTimeSlot.objects.create(
        reservation_unit=_kausivarausyksikko_yrjo,
        weekday=Weekday.THURSDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="12:00:00", end="18:00:00")],
    )
    ApplicationRoundTimeSlot.objects.create(
        reservation_unit=_kausivarausyksikko_yrjo,
        weekday=Weekday.FRIDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="10:00:00", end="18:00:00")],
    )
    ApplicationRoundTimeSlot.objects.create(
        reservation_unit=_kausivarausyksikko_yrjo,
        weekday=Weekday.SATURDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="09:00:00", end="12:00:00"), TimeSlotDB(begin="15:00:00", end="23:00:00")],
    )
    ApplicationRoundTimeSlot.objects.create(
        reservation_unit=_kausivarausyksikko_yrjo,
        weekday=Weekday.SUNDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="12:00:00", end="14:00:00")],
    )

    _kausivarausyksikko_kalevi = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="b0dc03b7-19ef-4130-b0a2-b6f5827b0eb3",
        #
        # Strings
        name="KAUSIVARAUS yksikkö Kalevi (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="KAUSIVARAUS yksikkö Kalevi (AUTOMAATIOTESTI ÄLÄ POISTA) EN",
        name_sv="KAUSIVARAUS yksikkö Kalevi (AUTOMAATIOTESTI ÄLÄ POISTA) SV",
        description="Kuvaus fi\nAukioloaika\nMa - pe 10:00-22:00 Varauksella\n13:00 - 14:00 Suljettu",
        description_en="Kuvaus EN",
        description_sv="Kuvaus SV",
        contact_information="",
        notes_when_applying="",
        notes_when_applying_en="",
        notes_when_applying_sv="",
        reservation_pending_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_pending_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_pending_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_confirmed_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_confirmed_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_confirmed_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=60,
        min_persons=3,
        max_persons=20,
        max_reservations_per_user=20,
        reservations_min_days_before=0,
        reservations_max_days_before=182,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(minutes=15),
        max_reservation_duration=datetime.timedelta(hours=5),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        can_apply_free_of_charge=True,
        allow_reservations_without_opening_hours=False,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.SEASON,
        reservation_form=ReservationFormType.PURPOSE_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=harakka,
        origin_hauki_resource=kalevi_hauki_resource,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        metadata_set=lomake_3_sub,
        cancellation_terms=alkuun_asti_ei_peruutusta_peruutusehto,
        service_specific_terms=kausi_palveluehto,
        pricing_terms=nupa_hinnoitteluehto,
        payment_terms=verkkokauppa_vain_maksuehto,
        payment_product=kalevi_payment_product,
        payment_merchant=None,
        payment_accounting=None,
    )
    _kausivarausyksikko_kalevi_space = Space.objects.create(
        name="KAUSIVARAUS yksikkö Kalevi (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="KAUSIVARAUS yksikkö Kalevi (AUTOMAATIOTESTI ÄLÄ POISTA) EN",
        name_sv="KAUSIVARAUS yksikkö Kalevi (AUTOMAATIOTESTI ÄLÄ POISTA) SV",
        surface_area=60,
        max_persons=20,
        unit=harakka,
    )
    _kausivarausyksikko_kalevi.spaces.set([
        _kausivarausyksikko_kalevi_space,
    ])
    _kausivarausyksikko_kalevi.intended_uses.set([
        pida_kokous_tarkoitus,
        jarjesta_tapahtuma_tarkoitus,
        harrasta_yhdessa_tarkoitus,
        tee_musiikkia_tarkoitus,
        kauta_laitteita_tarkoitus,
    ])
    _kausivarausyksikko_kalevi.equipments.set([
        poyta_laite,
        sohva_laite,
        internet_laite,
        aani_laite,
        tietokone_laite,
        studio_laite,
        naytto_laite,
    ])
    _kausivarausyksikko_kalevi_pricing = ReservationUnitPricing.objects.create(
        reservation_unit=_kausivarausyksikko_kalevi,
        begins=local_date(2024, 8, 27),
        price_unit=PriceUnit.PER_15_MINS,
        payment_type=PaymentType.ONLINE,
        is_activated_on_begins=False,
        lowest_price=Decimal("24.80"),
        highest_price=Decimal("60.00"),
        tax_percentage=nolla_veroprosentti,
    )
    _kausivarausyksikko_kalevi_access_type = ReservationUnitAccessType.objects.create(
        reservation_unit=_kausivarausyksikko_kalevi,
        begin_date=local_date(2025, 8, 1),
        access_type=AccessType.UNRESTRICTED,
    )
    ApplicationRoundTimeSlot.objects.create(
        reservation_unit=_kausivarausyksikko_kalevi,
        weekday=Weekday.MONDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="14:00:00", end="18:00:00")],
    )
    ApplicationRoundTimeSlot.objects.create(
        reservation_unit=_kausivarausyksikko_kalevi,
        weekday=Weekday.TUESDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="10:00:00", end="22:00:00")],
    )
    ApplicationRoundTimeSlot.objects.create(
        reservation_unit=_kausivarausyksikko_kalevi,
        weekday=Weekday.WEDNESDAY,
        is_closed=True,
        reservable_times=[],
    )
    ApplicationRoundTimeSlot.objects.create(
        reservation_unit=_kausivarausyksikko_kalevi,
        weekday=Weekday.THURSDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="07:00:00", end="23:00:00")],
    )
    ApplicationRoundTimeSlot.objects.create(
        reservation_unit=_kausivarausyksikko_kalevi,
        weekday=Weekday.FRIDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="03:00:00", end="20:00:00")],
    )
    ApplicationRoundTimeSlot.objects.create(
        reservation_unit=_kausivarausyksikko_kalevi,
        weekday=Weekday.SUNDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="12:00:00", end="23:00:00")],
    )

    _kausivarausyksikko_piitu = ReservationUnit.objects.create(
        #
        # IDs
        ext_uuid="d9085bea-4998-4b9b-a8b1-72c8069c6f63",
        #
        # Strings
        name="KAUSIVARAUS yksikkö Piitu (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="KAUSIVARAUS yksikkö Piitu (AUTOMAATIOTESTI ÄLÄ POISTA) EN",
        name_sv="KAUSIVARAUS yksikkö Piitu (AUTOMAATIOTESTI ÄLÄ POISTA) SV",
        description="Kuvaus fi\nAukioloaika\nMa - pe 10:00-22:00 Varauksella\n14:00 - 15:00 Suljettu",
        description_en="Kuvaus EN",
        description_sv="Kuvaus SV",
        contact_information="Vastuuhenkilön yhteystiedot",
        notes_when_applying="",
        notes_when_applying_en="",
        notes_when_applying_sv="",
        reservation_pending_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_pending_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_pending_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_confirmed_instructions="Varausvahvistuksen lisäohjeteksti suomeksi",
        reservation_confirmed_instructions_en="Varausvahvistuksen lisäohjeteksti englanniksi",
        reservation_confirmed_instructions_sv="Varausvahvistuksen lisäohjeteksti ruotsiksi",
        reservation_cancelled_instructions="",
        reservation_cancelled_instructions_en="",
        reservation_cancelled_instructions_sv="",
        #
        # Integers
        surface_area=70,
        min_persons=0,
        max_persons=30,
        max_reservations_per_user=20,
        reservations_min_days_before=0,
        reservations_max_days_before=182,
        #
        # Datetime
        reservation_begins_at=None,
        reservation_ends_at=None,
        publish_begins_at=None,
        publish_ends_at=None,
        min_reservation_duration=datetime.timedelta(minutes=15),
        max_reservation_duration=datetime.timedelta(hours=7),
        buffer_time_before=datetime.timedelta(minutes=30),
        buffer_time_after=datetime.timedelta(hours=1),
        #
        # Booleans
        is_draft=False,
        is_archived=False,
        require_adult_reservee=False,
        require_reservation_handling=False,
        reservation_block_whole_day=False,
        can_apply_free_of_charge=True,
        allow_reservations_without_opening_hours=False,
        #
        # Enums
        authentication=AuthenticationType.WEAK,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES,
        reservation_kind=ReservationKind.SEASON,
        reservation_form=ReservationFormType.AGE_GROUP_FORM,
        #
        # Lists
        search_terms=[],
        #
        # Many-to-One related
        unit=harakka,
        origin_hauki_resource=piitu_hauki_resource,
        reservation_unit_type=kokoustila,
        cancellation_rule=peruutus_alkuun_asti,
        metadata_set=lomake_4_sub,
        cancellation_terms=alkuun_asti_ei_peruutusta_peruutusehto,
        service_specific_terms=kausi_palveluehto,
        pricing_terms=nupa_hinnoitteluehto,
        payment_terms=verkkokauppa_vain_maksuehto,
        payment_product=piitu_payment_product,
        payment_merchant=None,
        payment_accounting=None,
    )
    _kausivarausyksikko_piitu_space = Space.objects.create(
        name="KAUSIVARAUS yksikkö Piitu (AUTOMAATIOTESTI ÄLÄ POISTA)",
        name_en="KAUSIVARAUS yksikkö Piitu (AUTOMAATIOTESTI ÄLÄ POISTA) EN",
        name_sv="KAUSIVARAUS yksikkö Piitu (AUTOMAATIOTESTI ÄLÄ POISTA) SV",
        surface_area=60,
        max_persons=20,
        unit=harakka,
    )
    _kausivarausyksikko_piitu.spaces.set([
        _kausivarausyksikko_piitu_space,
    ])
    _kausivarausyksikko_piitu.intended_uses.set([
        pida_kokous_tarkoitus,
        yksin_tai_ryhma_tarkoitus,
    ])
    _kausivarausyksikko_piitu.equipments.set([
        poyta_laite,
        valkotaulu_laite,
        vesipiste_laite,
        astiasto_laite,
        liesi_laite,
        uuni_laite,
        jaakaappi_laite,
        pakastin_laite,
        mikro_laite,
        kahvinkeitin_laite,
        vedenkeitin_laite,
        astianpesukone_laite,
    ])
    _kausivarausyksikko_piitu_pricing = ReservationUnitPricing.objects.create(
        reservation_unit=_kausivarausyksikko_piitu,
        begins=local_date(2024, 2, 23),
        price_unit=PriceUnit.PER_HOUR,
        payment_type=PaymentType.ONLINE,
        is_activated_on_begins=False,
        lowest_price=Decimal("30.00"),
        highest_price=Decimal("80.00"),
        tax_percentage=nolla_veroprosentti,
    )
    _kausivarausyksikko_piitu_access_type = ReservationUnitAccessType.objects.create(
        reservation_unit=_kausivarausyksikko_piitu,
        begin_date=local_date(2025, 8, 1),
        access_type=AccessType.UNRESTRICTED,
    )
    ApplicationRoundTimeSlot.objects.create(
        reservation_unit=_kausivarausyksikko_piitu,
        weekday=Weekday.MONDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="12:00:00", end="18:00:00")],
    )
    ApplicationRoundTimeSlot.objects.create(
        reservation_unit=_kausivarausyksikko_piitu,
        weekday=Weekday.TUESDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="10:00:00", end="20:00:00")],
    )
    ApplicationRoundTimeSlot.objects.create(
        reservation_unit=_kausivarausyksikko_piitu,
        weekday=Weekday.WEDNESDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="11:00:00", end="22:00:00")],
    )
    ApplicationRoundTimeSlot.objects.create(
        reservation_unit=_kausivarausyksikko_piitu,
        weekday=Weekday.THURSDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="15:00:00", end="19:00:00")],
    )
    ApplicationRoundTimeSlot.objects.create(
        reservation_unit=_kausivarausyksikko_piitu,
        weekday=Weekday.FRIDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="07:00:00", end="23:00:00")],
    )
    ApplicationRoundTimeSlot.objects.create(
        reservation_unit=_kausivarausyksikko_piitu,
        weekday=Weekday.SATURDAY,
        is_closed=False,
        reservable_times=[TimeSlotDB(begin="16:00:00", end="18:00:00")],
    )

    # ------------------------------------------------------------------------------------------------------------
    # ANDROID
    # ------------------------------------------------------------------------------------------------------------

    copy_reservation_unit(_maksuton_mankeli, kind="android")
    copy_reservation_unit(_aina_maksullinen_aitio, kind="android")
    copy_reservation_unit(_aina_kasiteltava_kellarikerros, kind="android")
    copy_reservation_unit(_alennuskelpoinen_aula, kind="android")
    copy_reservation_unit(_perumiskelvoton_parveke, kind="android")

    # ------------------------------------------------------------------------------------------------------------
    # IPHONE
    # ------------------------------------------------------------------------------------------------------------

    copy_reservation_unit(_maksuton_mankeli, kind="iphone")
    copy_reservation_unit(_aina_maksullinen_aitio, kind="iphone")
    copy_reservation_unit(_aina_kasiteltava_kellarikerros, kind="iphone")
    copy_reservation_unit(_alennuskelpoinen_aula, kind="iphone")
    copy_reservation_unit(_perumiskelvoton_parveke, kind="iphone")


def copy_reservation_unit(original: ReservationUnit, *, kind: Literal["android", "iphone"]) -> ReservationUnit:
    # Fetch again so that the original is not modified
    android_version = ReservationUnit.objects.get(pk=original.pk)

    # See: https://docs.djangoproject.com/en/dev/topics/db/queries/#copying-model-instances
    android_version._state.adding = True  # noqa: SLF001
    android_version.id = None

    android_version.ext_uuid = uuid.uuid4()
    android_version.name += f" ({kind})"
    android_version.name_en += f" ({kind})"
    android_version.name_sv += f" ({kind})"

    android_version.save()

    android_version.resources.set(original.resources.all())
    android_version.intended_uses.set(original.intended_uses.all())
    android_version.equipments.set(original.equipments.all())

    new_spaces: list[Space] = []
    for space in original.spaces.all():
        space._state.adding = True  # noqa: SLF001
        space.id = None

        space.name += f" ({kind})"
        space.name_en += f" ({kind})"
        space.name_sv += f" ({kind})"

        space.save()
        new_spaces.append(space)

    android_version.spaces.set(new_spaces)

    for pricing in original.pricings.all():
        pricing._state.adding = True  # noqa: SLF001
        pricing.id = None

        pricing.reservation_unit = android_version
        pricing.save()

    for access_type in original.access_types.all():
        access_type._state.adding = True  # noqa: SLF001
        access_type.id = None

        access_type.reservation_unit = android_version
        access_type.save()

    return android_version


def create_users() -> None:
    User.objects.update_or_create(
        username="u-5ubvcxgrxzdf5nj7y4sbjnvyeq",
        defaults={
            "first_name": "Ande",
            "last_name": "AutomaatioTesteri",
            "email": "qfaksi+ande@gmail.com",
            "password": make_password("AutomaatioTesteri"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "ed03515c-d1be-465e-b53f-c72414b6b824",  # GDPR UUID
            "tvp_uuid": "e5c391e8-8a6b-49ba-8b91-7c7a50b15b33",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1974, 6, 18),
            "profile_id": "UHJvZmlsZU5vZGU6YmUyMGNmYTQtNTQ3MS00ZjM1LWEwYzctODg5YmQ4MTgzNzA5",
        },
    )
    User.objects.update_or_create(
        username="u-os5gt6upb5echkmmocu6g2ujr4",
        defaults={
            "first_name": "Mikael",
            "last_name": "Virtanen",
            "email": "qfaksi+mikael@gmail.com",
            "password": make_password("Virtanen"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "74ba69fa-8f0f-4823-a98c-70a9e36a898f",  # GDPR UUID
            "tvp_uuid": "0e8fe48b-ee20-4694-bbdc-9bce3d23ea26",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1982, 3, 15),
            "profile_id": "UHJvZmlsZU5vZGU6NGVkNzU2MWItZTJhMy00NTMwLTgwOWYtMjJiYzNlOTU3NDUz",
        },
    )
    User.objects.update_or_create(
        username="u-3fvnhmmwe5hg7alebt4caji7zi",
        defaults={
            "first_name": "Jukka",
            "last_name": "Korhonen",
            "email": "qfaksi+jukka@gmail.com",
            "password": make_password("Korhonen"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "d96ad3b1-9627-4e6f-8164-0cf820251fca",  # GDPR UUID
            "tvp_uuid": "060e2aa4-bbf3-41e5-b0c7-a9b0ef843940",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1990, 10, 22),
            "profile_id": "UHJvZmlsZU5vZGU6OTQ3NWI0ZDctYmMyMi00ZjcwLWFmNGUtNTQyOWI0ZDZmYjg2",
        },
    )
    User.objects.update_or_create(
        username="u-754c5vvdzzbk5jgsjfh5hcfzc4",
        defaults={
            "first_name": "Petri",
            "last_name": "Makinen",
            "email": "qfaksi+petri@gmail.com",
            "password": make_password("Makinen"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "ff782ed6-a3ce-42ae-a4d2-494fd388b917",  # GDPR UUID
            "tvp_uuid": "bce3ecb8-41bd-4372-affb-8bf4fa929c35",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1985, 7, 7),
            "profile_id": "UHJvZmlsZU5vZGU6NTRhNWE1NDctMzRmOS00NjliLWE0NjktNjdmOWExMDdhMDk4",
        },
    )
    User.objects.update_or_create(
        username="u-4ghz53zzivd4bnpo6x7ef57q4q",
        defaults={
            "first_name": "Antti",
            "last_name": "Nieminen",
            "email": "qfaksi+antti@gmail.com",
            "password": make_password("Nieminen"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "e18f9eef-3945-47c0-b5ee-f5fe42f7f0e4",  # GDPR UUID
            "tvp_uuid": "344a7685-c346-4e94-851a-6520c6776d20",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1976, 12, 11),
            "profile_id": "UHJvZmlsZU5vZGU6M2FmODg4NWYtOTkzMy00MjM1LTkyNDktMGU3MTI5ODViMDcx",
        },
    )
    User.objects.update_or_create(
        username="u-crag6mljcfgtthi4y2eflvmk4i",
        defaults={
            "first_name": "Matti",
            "last_name": "Mäkelä",
            "email": "qfaksi+matti@gmail.com",
            "password": make_password("Mäkelä"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "14406f31-6911-4d39-9d1c-c68855d58ae2",  # GDPR UUID
            "tvp_uuid": "bcc347a2-a1f1-4686-bb46-03c840f2de48",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1989, 6, 4),
            "profile_id": "UHJvZmlsZU5vZGU6Y2VlYzZkOTItYjdkNi00NTZhLWI5M2UtYzc4MjI5YjAwMTli",
        },
    )
    User.objects.update_or_create(
        username="u-ie2b7oqmcvdhjd456rcm7x7tuy",
        defaults={
            "first_name": "Anna",
            "last_name": "Korhonen",
            "email": "qfaksi+anna@gmail.com",
            "password": make_password("Korhonen"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "41341fba-0c15-4674-8f9d-f444cfdff3a6",  # GDPR UUID
            "tvp_uuid": "71a34673-620f-41d1-b653-a9e326a490e7",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1976, 5, 5),
            "profile_id": "UHJvZmlsZU5vZGU6YWMxODIyNDMtZWFjOS00YzdkLWFjYTAtZDAzZTllYjJhMzIz",
        },
    )
    User.objects.update_or_create(
        username="u-ggoljyfcwbf27i53qwzjq55rya",
        defaults={
            "first_name": "Mari",
            "last_name": "Leppänen",
            "email": "qfaksi+mari@gmail.com",
            "password": make_password("Leppänen"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "319cb4e0-a2b0-4baf-a3bb-85b29877b1c0",  # GDPR UUID
            "tvp_uuid": "51771b83-b81a-4948-92ff-a03a2e8fb0d2",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1989, 1, 24),
            "profile_id": "UHJvZmlsZU5vZGU6YTNiOGRkMjItMzcyYS00MDUwLTg4NTUtYzUzM2FkODhhNDY5",
        },
    )
    User.objects.update_or_create(
        username="u-uslsa3ewcvcmbcfyub5b26lfmu",
        defaults={
            "first_name": "Päivi",
            "last_name": "Mustonen",
            "email": "qfaksi+paivi@gmail.com",
            "password": make_password("Mustonen"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "a497206c-9615-44c0-88b8-a07a1d796565",  # GDPR UUID
            "tvp_uuid": "e090178e-2b9a-4986-bd90-dacd3cf279f6",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1991, 5, 16),
            "profile_id": "UHJvZmlsZU5vZGU6M2IyZjgzM2YtNTU0ZS00N2NjLWE5NWQtMGVmM2IyZmYyMjA3",
        },
    )
    User.objects.update_or_create(
        username="u-xabra2s6gbgf5nh7ss46gbsblq",
        defaults={
            "first_name": "Kaisa",
            "last_name": "Rantanen",
            "email": "qfaksi+kaisa@gmail.com",
            "password": make_password("Rantanen"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "b803106a-5e30-4c5e-b4ff-94b9e306415c",  # GDPR UUID
            "tvp_uuid": "a8497405-b2e2-4022-8d6e-8b9675fd4883",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1987, 12, 12),
            "profile_id": "UHJvZmlsZU5vZGU6YTkyNTlhMTctZTcxMi00ZWNiLWI0ZWYtZTczODIzNmZkNmY1",
        },
    )
    User.objects.update_or_create(
        username="u-fxwut2vtubfuxpnmbqdjpqmwou",
        defaults={
            "first_name": "Ulla",
            "last_name": "Hakala",
            "email": "qfaksi+ulla@gmail.com",
            "password": make_password("Hakala"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "2ded49ea-b3a0-4b4b-bdac-0c0697c19675",  # GDPR UUID
            "tvp_uuid": "bf954d1f-be58-41bf-b581-b75b94feba70",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1988, 8, 3),
            "profile_id": "UHJvZmlsZU5vZGU6NTAyNzE3MTEtMjA2Ny00YTcxLThmYzQtNWU4ZTA0YTNmY2Q3",
        },
    )
    User.objects.update_or_create(
        username="u-lj6ejffcxbcn3j6lnpjjz2x5oe",
        defaults={
            "first_name": "Riitta",
            "last_name": "Lindström",
            "email": "qfaksi+riitta@gmail.com",
            "password": make_password("Lindström"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "5a7c4494-a2b8-44dd-a7cb-6bd29ceafd71",  # GDPR UUID
            "tvp_uuid": "2766ef5c-124d-48aa-9d22-50df0b0749b1",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1974, 4, 30),
            "profile_id": "UHJvZmlsZU5vZGU6MzdkNGEwMzEtY2RhYy00ZTkzLWI5Y2MtM2JmMjY0YjZmNDE0",
        },
    )
    User.objects.update_or_create(
        username="u-j7tps34mlvhzhkr4zgq5hltxhu",
        defaults={
            "first_name": "Tirehtoori",
            "last_name": "Tötterstrom",
            "email": "qfaksi+tirehtoori@gmail.com",
            "password": make_password("Tötterstrom"),
            "is_staff": True,
            "is_active": True,
            "is_superuser": True,
            "uuid": "4fe6f96f-8c5d-4f93-aa3c-c9a1d3ae773d",  # GDPR UUID
            "tvp_uuid": "1d5cd73a-06aa-4562-9099-2ceb1afc0268",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1969, 8, 12),
            "profile_id": "UHJvZmlsZU5vZGU6NWFhMDAyODEtNmQzMS00YTgwLWI4YjktYWYzN2JmZWI0NWQ1",
        },
    )
    User.objects.update_or_create(
        username="u-smv3dohm6jhf5dt2fpvpqvsitu",
        defaults={
            "first_name": "Pekka",
            "last_name": "Virtanen",
            "email": "qfaksi+pekka@gmail.com",
            "password": make_password("Virtanen"),
            "is_staff": True,
            "is_active": True,
            "is_superuser": True,
            "uuid": "932bb1b8-ecf2-4e5e-8e7a-2beaf856489d",  # GDPR UUID
            "tvp_uuid": "e7b60ed1-fb55-4603-9834-3d4324fd5da9",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1985, 6, 22),
            "profile_id": "UHJvZmlsZU5vZGU6MmVmMTQxYTQtNjIzMy00MTAyLWE2YTQtZGM2Mzk0ZWNmMmFm",
        },
    )
    User.objects.update_or_create(
        username="u-ueeszbvcujh6tehct5qobqdv44",
        defaults={
            "first_name": "Hannu",
            "last_name": "Rantala",
            "email": "qfaksi+hannu@gmail.com",
            "password": make_password("Rantala"),
            "is_staff": True,
            "is_active": True,
            "is_superuser": True,
            "uuid": "a1092c86-a2a2-4fe9-90e2-9f60e0c075e7",  # GDPR UUID
            "tvp_uuid": "06bf3918-b7bc-4174-8cc8-6c1d59544613",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1981, 12, 10),
            "profile_id": "UHJvZmlsZU5vZGU6ZjJlNDhjNTEtZmExOS00N2I5LTg0NmItM2FlYjU0N2I4YTky",
        },
    )
    User.objects.update_or_create(
        username="u-k36o5lcn5rg6db23hqlb6jhxn4",
        defaults={
            "first_name": "Seppo",
            "last_name": "Korhonen",
            "email": "qfaksi+seppo@gmail.com",
            "password": make_password("Korhonen"),
            "is_staff": True,
            "is_active": True,
            "is_superuser": True,
            "uuid": "56fceeac-4dec-4de1-875b-3c161f24f76f",  # GDPR UUID
            "tvp_uuid": "3cc77909-ed84-45eb-b619-175ea6da3ff5",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1977, 6, 28),
            "profile_id": "UHJvZmlsZU5vZGU6MmFkZTBmYzktMDFlOS00ZGM4LWFjNjAtNDNhOTk5ZjJmNzY2",
        },
    )
    User.objects.update_or_create(
        username="u-sdgkcz427jgyxg2gawa7qcy74q",
        defaults={
            "first_name": "Risto",
            "last_name": "Hakkarainen",
            "email": "qfaksi+risto@gmail.com",
            "password": make_password("Hakkarainen"),
            "is_staff": True,
            "is_active": True,
            "is_superuser": True,
            "uuid": "90cca167-9afa-4d8b-9b46-0581f80b1fe4",  # GDPR UUID
            "tvp_uuid": "861923fe-d931-4a81-b03b-0490e1c8b66c",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1993, 10, 5),
            "profile_id": "UHJvZmlsZU5vZGU6ODIwMWRlZmQtMDJlYi00ZjU3LTgxYTMtYTJkOTU1MTA0ZGI1",
        },
    )
    User.objects.update_or_create(
        username="u-khucobukjjh67huofgq4xmcopi",
        defaults={
            "first_name": "Erkki",
            "last_name": "Nieminen",
            "email": "qfaksi+erkki@gmail.com",
            "password": make_password("Nieminen"),
            "is_staff": True,
            "is_active": True,
            "is_superuser": True,
            "uuid": "51e82706-8a4a-4fef-9e8e-29a1cbb04e7a",  # GDPR UUID
            "tvp_uuid": "20489318-7a6f-4650-9d10-b8da675ee31e",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1982, 10, 14),
            "profile_id": "UHJvZmlsZU5vZGU6MjhjZTdhZWMtNTBjYS00MWFiLTkxZTctYjdiOTllYjE5ZjIw",
        },
    )
    User.objects.update_or_create(
        username="u-6gyudis5vrex7eoyoofsyg7e7m",
        defaults={
            "first_name": "Ari",
            "last_name": "Laine",
            "email": "qfaksi+ari@gmail.com",
            "password": make_password("Laine"),
            "is_staff": True,
            "is_active": True,
            "is_superuser": True,
            "uuid": "f1b141a2-5dac-497f-91d8-738b2c1be4fb",  # GDPR UUID
            "tvp_uuid": "6a8fd873-9f35-4afe-9dde-092047c4995b",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1984, 6, 19),
            "profile_id": "UHJvZmlsZU5vZGU6MGE4NmY5YjItYjU4ZC00YzE0LTgwYjItYTE0ZGQ2MTgyM2Ji",
        },
    )
    User.objects.update_or_create(
        username="u-synoynteknhu5f4oky5komlxz4",
        defaults={
            "first_name": "Kari",
            "last_name": "Kekkonen",
            "email": "qfaksi+kari@gmail.com",
            "password": make_password("Kekkonen"),
            "is_staff": True,
            "is_active": True,
            "is_superuser": True,
            "uuid": "961aec36-6453-4f4e-978e-563aa73177cf",  # GDPR UUID
            "tvp_uuid": "061ba9cb-4206-484c-8cbd-fd8533d01741",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1975, 8, 15),
            "profile_id": "UHJvZmlsZU5vZGU6MDQ4ZmRmN2MtMjlhMS00M2U3LTk2MjQtYWNkYTNkNWRkYWNh",
        },
    )
    User.objects.update_or_create(
        username="u-hrxnhfdeurbglo2vcxrqbsa73e",
        defaults={
            "first_name": "Esa",
            "last_name": "Mattila",
            "email": "qfaksi+esa@gmail.com",
            "password": make_password("Mattila"),
            "is_staff": True,
            "is_active": True,
            "is_superuser": True,
            "uuid": "3c6ed394-64a4-4265-bb55-15e300c81fd9",  # GDPR UUID
            "tvp_uuid": "8ad333ad-021d-47e9-a8bc-803c0d6e28fa",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1983, 6, 7),
            "profile_id": "UHJvZmlsZU5vZGU6MGI0NDc4ZjEtNDQ3Ny00YmEwLTg5NjctNDM4MjZmZjI0ZGMx",
        },
    )
    User.objects.update_or_create(
        username="u-j7q3jatunrf2rdria5cjgpcv4u",
        defaults={
            "first_name": "Pertti",
            "last_name": "Kallio",
            "email": "qfaksi+pertti@gmail.com",
            "password": make_password("Kallio"),
            "is_staff": True,
            "is_active": True,
            "is_superuser": True,
            "uuid": "4fe1b482-746c-4ba8-8e28-0744933c55e5",  # GDPR UUID
            "tvp_uuid": "835e2f31-bd26-46c2-a4ac-292218bf654a",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1985, 8, 12),
            "profile_id": "UHJvZmlsZU5vZGU6M2Q1NTczZmMtYTUzMC00ZTgwLWI5MjAtODk0ODNmNmFhOTIy",
        },
    )
    User.objects.update_or_create(
        username="u-5l6cnmgeandejout7uktzsqgim",
        defaults={
            "first_name": "Antero",
            "last_name": "Salonen",
            "email": "qfaksi+antero@gmail.com",
            "password": make_password("Salonen"),
            "is_staff": True,
            "is_active": True,
            "is_superuser": True,
            "uuid": "eafc26b0-c403-4644-ba93-fd153cca0643",  # GDPR UUID
            "tvp_uuid": "0ac0c309-8ebe-4326-94c1-f98b0dba7824",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1975, 11, 22),
            "profile_id": "UHJvZmlsZU5vZGU6Mjk3OGYxZDQtOGYxOS00ZjRlLTk4OGYtMmNkZWI1MTViMzY0",
        },
    )
    User.objects.update_or_create(
        username="u-buahccmtg5dedcvalbogbmiktq",
        defaults={
            "first_name": "Tuula",
            "last_name": "Aaltonen",
            "email": "qfaksi+tuula@gmail.com",
            "password": make_password("Aaltonen"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "0d007109-9337-4641-8aa0-585c60b10a9c",  # GDPR UUID
            "tvp_uuid": "e9c3a265-9f0b-460f-a95a-8a637c31e181",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1985, 6, 18),
            "profile_id": "UHJvZmlsZU5vZGU6MmU0ZTkxMTEtMjMzYS00MWE4LTgxZGMtZWRhM2Q5YjczNmIx",
        },
    )
    User.objects.update_or_create(
        username="u-d7wshr3wqrfsdjcyprfvklq3lu",
        defaults={
            "first_name": "Helena",
            "last_name": "Hiltunen",
            "email": "qfaksi+merja@gmail.com",
            "password": make_password("Hiltunen"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "1fed23c7-7684-4b21-a458-7c4b552e1b5d",  # GDPR UUID
            "tvp_uuid": "ccf8c3fa-15ed-493c-9723-197bc7b86107",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1992, 7, 25),
            "profile_id": "UHJvZmlsZU5vZGU6MDhmZmMyOTctOTU4Zi00YjkyLTliMTYtOTgzNDc1YmJlODQ2",
        },
    )
    User.objects.update_or_create(
        username="u-b6phfq5wmbcjljuqoveb3mqsni",
        defaults={
            "first_name": "Helena",
            "last_name": "Hiltunen",
            "email": "qfaksi+helena@gmail.com",
            "password": make_password("Hiltunen"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "0f9e72c3-b660-4495-a690-75481db2126a",  # GDPR UUID
            "tvp_uuid": "4cd5de1d-0e7a-42e9-a496-87d3c83ee129",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1984, 11, 8),
            "profile_id": "UHJvZmlsZU5vZGU6ZTNlN2I5ZTItMjMwNC00MmIzLWE4Y2UtYTRhMzcyYzIyMjc1",
        },
    )
    User.objects.update_or_create(
        username="u-a73qe2rmajavvmpb2kvwdcjajq",
        defaults={
            "first_name": "Seija",
            "last_name": "Mäenpää",
            "email": "qfaksi+seija@gmail.com",
            "password": make_password("Mäenpää"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "07f7026a-2c02-415a-b1e1-d2ab6189204c",  # GDPR UUID
            "tvp_uuid": "7bf6a12d-11fd-451d-85ef-466d3990f0b6",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1979, 12, 14),
            "profile_id": "UHJvZmlsZU5vZGU6ZDhhYjlmZmItZTg3NC00NTM1LTlmOGUtYmUwZjQ4ZjE1YzVh",
        },
    )
    User.objects.update_or_create(
        username="u-bqawevrs2vbhniuprp3wdfv2gu",
        defaults={
            "first_name": "Maija",
            "last_name": "Peltonen",
            "email": "qfaksi+maija@gmail.com",
            "password": make_password("Peltonen"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "0c016256-32d5-4276-a28f-8bf76196ba35",  # GDPR UUID
            "tvp_uuid": "6a1087f7-cc9a-4ebb-8149-4c1727e19c53",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1986, 10, 23),
            "profile_id": "UHJvZmlsZU5vZGU6ZDRjNGExNzctZjExNy00ZDg3LTlhMTAtNDJjZDEyNWI1MzZm",
        },
    )
    User.objects.update_or_create(
        username="u-jtvjms5shnhpbplyknv7jcac4q",
        defaults={
            "first_name": "Liisa",
            "last_name": "Koivisto",
            "email": "qfaksi+liisa@gmail.com",
            "password": make_password("Koivisto"),
            "is_staff": False,
            "is_active": True,
            "is_superuser": False,
            "uuid": "4cea964b-b23b-4ef0-bd78-536bf48802e4",  # GDPR UUID
            "tvp_uuid": "f7259555-96b3-4ebe-b5d7-3b7ef4ab2895",  # Statistics UUID
            "department_name": None,
            "date_of_birth": local_datetime(1991, 5, 7),
            "profile_id": "UHJvZmlsZU5vZGU6NDEwZjA1ZDgtNzU3MC00NTFmLWIwMmItYjc2ZjIzMTA5ODdi",
        },
    )


def create_application_rounds() -> None:
    nupa_kausivarausehto, _ = TermsOfUse.objects.get_or_create(
        id="KUVAnupa",
        defaults={
            "name_fi": "(vakio_id) KAUSIVARAUS - Ei käytössä",
            "name_en": "(vakio_id) KAUSIVARAUS - Ei käytössä",
            "name_sv": "(vakio_id) KAUSIVARAUS - Ei käytössä",
            "text_fi": "",
            "text_en": "",
            "text_sv": "",
            "terms_type": TermsOfUseTypeChoices.RECURRING,
        },
    )

    harrastustoiminta, _ = ReservationPurpose.objects.get_or_create(
        name="Harrastustoiminta, muu",
        defaults={
            "name_fi": "Harrastustoiminta, muu",
            "name_en": "Hobby or leisure activities, other",
            "name_sv": "Hobby, annat",
        },
    )

    kausivarausyksikko_malmi = ReservationUnit.objects.get(ext_uuid="52f16e97-4986-4c4e-8fc5-8fab4ab66933")
    kausivarausyksikko_keskusta = ReservationUnit.objects.get(ext_uuid="99c2f30e-40ad-4aca-aa78-01ac92a0b1ff")

    _kausivaraus_round = ApplicationRound.objects.create(
        name="Kausivaraus (AUTOMAATIO TESTI ÄLÄ POISTA)",
        name_en="Kausivaraus (AUTOMAATIO TESTI ÄLÄ POISTA) EN",
        name_sv="Kausivaraus (AUTOMAATIO TESTI ÄLÄ POISTA) SV",
        criteria="Hakukriteerit (suomeksi)",
        criteria_en="Hakukriteerit (englanniksi)",
        criteria_sv="Hakukriteerit (ruotsiksi)",
        notes_when_applying="Huomioi hakiessa (Suomeksi)",
        notes_when_applying_en="Huomioi hakiessa (Englanniksi)",
        notes_when_applying_sv="Huomioi hakiessa (Ruotsiksi)",
        application_period_begins_at=local_datetime(2025, 6, 12),
        application_period_ends_at=local_datetime(2026, 6, 13),
        reservation_period_begin_date=local_date(2026, 6, 14),
        reservation_period_end_date=local_date(2029, 6, 10),
        public_display_begins_at=local_datetime(2025, 6, 12),
        public_display_ends_at=local_datetime(2029, 6, 11),
        handled_at=None,
        sent_at=None,
        terms_of_use=nupa_kausivarausehto,
    )
    _kausivaraus_round.purposes.set([
        harrastustoiminta,
    ])
    _kausivaraus_round.reservation_units.set([
        kausivarausyksikko_malmi,
        kausivarausyksikko_keskusta,
    ])


def create_past_reservations() -> None:
    user = User.objects.get(username="u-uslsa3ewcvcmbcfyub5b26lfmu")

    maksuton_mankeli = ReservationUnit.objects.get(ext_uuid="7bbd9b47-ad06-495a-a530-b094574208d6")

    Reservation.objects.create(
        user=user,
        reservation_unit=maksuton_mankeli,
        begins_at=local_datetime(2025, 6, 12, 10),
        ends_at=local_datetime(2025, 6, 12, 12),
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )
