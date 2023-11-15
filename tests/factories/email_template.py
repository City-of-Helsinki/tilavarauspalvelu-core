from factory import fuzzy

from email_notification.models import EmailTemplate, EmailType

from ._base import GenericDjangoModelFactory

__all__ = [
    "EmailTemplateFactory",
]


class EmailTemplateFactory(GenericDjangoModelFactory[EmailTemplate]):
    class Meta:
        model = EmailTemplate

    name = fuzzy.FuzzyText(length=255)
    type = fuzzy.FuzzyChoice(choices=EmailType.choices)
    subject = fuzzy.FuzzyText(length=255)
    content = fuzzy.FuzzyText()
    html_content = None
