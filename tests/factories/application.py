from collections.abc import Iterable
from typing import Any

import factory
from django.utils.timezone import now
from factory import fuzzy

from applications.choices import ApplicantTypeChoice, ApplicationStatusChoice
from applications.models import Application, ApplicationEvent

from ._base import GenericDjangoModelFactory

__all__ = [
    "ApplicationFactory",
]


class ApplicationFactory(GenericDjangoModelFactory[Application]):
    class Meta:
        model = Application

    applicant_type = fuzzy.FuzzyChoice(choices=ApplicantTypeChoice.values)
    application_round = factory.SubFactory("tests.factories.ApplicationRoundFactory")

    organisation = factory.SubFactory("tests.factories.OrganisationFactory")
    contact_person = factory.SubFactory("tests.factories.PersonFactory")
    user = factory.SubFactory("tests.factories.UserFactory")
    billing_address = factory.SubFactory("tests.factories.AddressFactory")
    home_city = factory.SubFactory("tests.factories.CityFactory")

    cancelled_date = None
    sent_date = None
    additional_information = fuzzy.FuzzyText()
    working_memo = fuzzy.FuzzyText()

    @classmethod
    def create_in_status(cls, status: ApplicationStatusChoice, **kwargs: Any) -> Application:
        match status:
            case ApplicationStatusChoice.DRAFT:
                return cls.create_in_status_draft(**kwargs)
            case ApplicationStatusChoice.RECEIVED:
                return cls.create_in_status_received(**kwargs)
            case ApplicationStatusChoice.IN_ALLOCATION:
                return cls.create_in_status_in_allocation(**kwargs)
            case ApplicationStatusChoice.HANDLED:
                return cls.create_in_status_handled(**kwargs)
            case ApplicationStatusChoice.RESULTS_SENT:
                return cls.create_in_status_result_sent(**kwargs)
            case ApplicationStatusChoice.EXPIRED:
                return cls.create_in_status_expired(**kwargs)
            case ApplicationStatusChoice.CANCELLED:
                return cls.create_in_status_cancelled(**kwargs)

    @classmethod
    def create_in_status_draft(cls, **kwargs: Any) -> Application:
        """Create a draft application in an open application round."""
        from .application_round import ApplicationRoundFactory

        kwargs.setdefault("cancelled_date", None)
        kwargs.setdefault("sent_date", None)

        if "application_round" not in kwargs:
            sub_kwargs = cls.pop_sub_kwargs("application_round", kwargs)
            kwargs["application_round"] = ApplicationRoundFactory.create_in_status_open(**sub_kwargs)

        return cls.create(**kwargs)

    @classmethod
    def create_in_status_received(cls, **kwargs: Any) -> Application:
        """
        Create a received application with an unallocated application event
        in an open application round.
        """
        from .application_event import ApplicationEventFactory
        from .application_round import ApplicationRoundFactory

        kwargs.setdefault("cancelled_date", None)
        kwargs.setdefault("sent_date", now())

        if "application_round" not in kwargs:
            sub_kwargs = cls.pop_sub_kwargs("application_round", kwargs)
            kwargs["application_round"] = ApplicationRoundFactory.create_in_status_open(**sub_kwargs)

        event_key = "application_events"
        event_kwargs = cls.pop_sub_kwargs(event_key, kwargs)

        application = cls.create(**kwargs)
        if event_key not in kwargs:
            event_kwargs["application"] = application
            ApplicationEventFactory.create_in_status_unallocated(**event_kwargs)

        return application

    @classmethod
    def create_in_status_in_allocation(cls, **kwargs: Any) -> Application:
        """
        Create an application to be allocated with a single unallocated application event
        in an application round in the allocation stage.
        """
        from .application_event import ApplicationEventFactory
        from .application_round import ApplicationRoundFactory

        kwargs.setdefault("cancelled_date", None)
        kwargs.setdefault("sent_date", now())

        if "application_round" not in kwargs:
            sub_kwargs = cls.pop_sub_kwargs("application_round", kwargs)
            kwargs["application_round"] = ApplicationRoundFactory.create_in_status_in_allocation(**sub_kwargs)

        event_key = "application_events"
        event_kwargs = cls.pop_sub_kwargs(event_key, kwargs)

        application = cls.create(**kwargs)

        if event_key not in kwargs:
            event_kwargs["application"] = application
            ApplicationEventFactory.create_in_status_unallocated(**event_kwargs)

        return application

    @classmethod
    def create_in_status_handled(cls, **kwargs: Any) -> Application:
        """
        Create a handled application with a single approved application event
        in an application round in the handled stage.
        """
        from .application_event import ApplicationEventFactory
        from .application_round import ApplicationRoundFactory

        kwargs.setdefault("cancelled_date", None)
        kwargs.setdefault("sent_date", now())

        if "application_round" not in kwargs:
            sub_kwargs = cls.pop_sub_kwargs("application_round", kwargs)
            kwargs["application_round"] = ApplicationRoundFactory.create_in_status_handled(**sub_kwargs)

        event_key = "application_events"
        event_kwargs = cls.pop_sub_kwargs(event_key, kwargs)

        application = cls.create(**kwargs)

        if event_key not in kwargs:
            event_kwargs["application"] = application
            ApplicationEventFactory.create_in_status_approved(**event_kwargs)

        return application

    @classmethod
    def create_in_status_result_sent(cls, **kwargs: Any) -> Application:
        """
        Create an application, the result of which has been sent to the user,
        with a single reserved application event in an application round in the handled stage.
        """
        from .application_event import ApplicationEventFactory
        from .application_round import ApplicationRoundFactory

        kwargs.setdefault("cancelled_date", None)
        kwargs.setdefault("sent_date", now())

        if "application_round" not in kwargs:
            round_kwargs = cls.pop_sub_kwargs("application_round", kwargs)
            kwargs["application_round"] = ApplicationRoundFactory.create_in_status_result_sent(**round_kwargs)

        event_key = "application_events"
        event_kwargs = cls.pop_sub_kwargs(event_key, kwargs)

        application = cls.create(**kwargs)

        if event_key not in kwargs:
            event_kwargs["application"] = application
            ApplicationEventFactory.create_in_status_reserved(**event_kwargs)

        return application

    @classmethod
    def create_in_status_expired(cls, **kwargs: Any) -> Application:
        """Create an expired application in a handled application round."""
        from .application_round import ApplicationRoundFactory

        kwargs.setdefault("cancelled_date", None)
        kwargs.setdefault("sent_date", None)

        if "application_round" not in kwargs:
            sub_kwargs = cls.pop_sub_kwargs("application_round", kwargs)
            kwargs["application_round"] = ApplicationRoundFactory.create_in_status_handled(**sub_kwargs)

        return cls.create(**kwargs)

    @classmethod
    def create_in_status_cancelled(cls, **kwargs: Any) -> Application:
        """Create a cancelled application."""
        kwargs.setdefault("cancelled_date", now())
        return cls.create(**kwargs)

    @factory.post_generation
    def application_events(
        self,
        create: bool,
        application_events: Iterable[ApplicationEvent] | None,
        **kwargs: Any,
    ):
        if not create:
            return

        if not application_events and kwargs:
            from .application_event import ApplicationEventFactory

            kwargs.setdefault("application", self)
            self.application_events.add(ApplicationEventFactory.create(**kwargs))

        for event in application_events or []:
            self.application_events.add(event)
