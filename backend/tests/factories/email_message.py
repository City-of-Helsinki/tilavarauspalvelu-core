from __future__ import annotations

import datetime

import factory

from tilavarauspalvelu.models import EmailMessage
from utils.date_utils import local_datetime

from tests.factories._base import FakerFI, GenericDjangoModelFactory

__all__ = [
    "EmailMessageFactory",
]


class EmailMessageFactory(GenericDjangoModelFactory[EmailMessage]):
    class Meta:
        model = EmailMessage

    subject = FakerFI("word")
    recipients = factory.LazyFunction(lambda: ["user@example.com"])

    text_content = FakerFI("sentence")
    html_content = factory.LazyAttribute(lambda i: f"<html>{i.text_content}</html>")

    attachments = factory.LazyFunction(list)

    valid_until = factory.LazyFunction(lambda: local_datetime() + datetime.timedelta(days=1))
    created_at = factory.LazyFunction(local_datetime)
