import factory
from factory import fuzzy

from applications.models import Application, ApplicationAggregateData, ApplicationStatus

from ._base import GenericDjangoModelFactory

__all__ = [
    "ApplicationFactory",
    "ApplicationStatusFactory",
    "ApplicationAggregateDataFactory",
]


class ApplicationFactory(GenericDjangoModelFactory[Application]):
    class Meta:
        model = Application

    applicant_type = fuzzy.FuzzyChoice(
        choices=(
            Application.APPLICANT_TYPE_COMPANY,
            Application.APPLICANT_TYPE_ASSOCIATION,
            Application.APPLICANT_TYPE_COMMUNITY,
            Application.APPLICANT_TYPE_INDIVIDUAL,
        )
    )

    organisation = factory.SubFactory("tests.factories.OrganisationFactory")
    contact_person = factory.SubFactory("tests.factories.PersonFactory")
    application_round = factory.SubFactory("tests.factories.ApplicationRoundFactory")
    home_city = factory.SubFactory("tests.factories.CityFactory")


class ApplicationStatusFactory(GenericDjangoModelFactory[ApplicationStatus]):
    class Meta:
        model = ApplicationStatus

    status = fuzzy.FuzzyChoice(
        choices=[
            ApplicationStatus.DRAFT,
            ApplicationStatus.IN_REVIEW,
            ApplicationStatus.REVIEW_DONE,
            ApplicationStatus.CANCELLED,
        ]
    )
    application = factory.SubFactory("tests.factories.ApplicationFactory")


class ApplicationAggregateDataFactory(GenericDjangoModelFactory[ApplicationAggregateData]):
    class Meta:
        model = ApplicationAggregateData

    name = fuzzy.FuzzyText(length=20)
    value = fuzzy.FuzzyFloat(low=0, high=255)
