from factory.django import DjangoModelFactory
from factory.fuzzy import FuzzyText


class EmailTemplateFactory(DjangoModelFactory):
    class Meta:
        model = "email_notification.EmailTemplate"

    name = FuzzyText()
