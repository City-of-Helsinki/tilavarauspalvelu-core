from factory import fuzzy

from email_notification.models import EmailTemplate

from ._base import GenericDjangoModelFactory

__all__ = [
    "EmailTemplateFactory",
]


class EmailTemplateFactory(GenericDjangoModelFactory[EmailTemplate]):
    class Meta:
        model = EmailTemplate

    name = fuzzy.FuzzyText()
