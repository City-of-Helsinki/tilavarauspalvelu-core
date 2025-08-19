from __future__ import annotations

import pytest
from django.core.exceptions import ValidationError

from tests.factories import EmailMessageFactory
from tests.helpers import exact


@pytest.mark.django_db
def test_email_message__validate_email_attachments():
    email_message = EmailMessageFactory.build(
        attachments=[
            {
                "filename": "file.txt",
                "content": "content",
                "mimetype": "text/plain",
            },
            {
                "filename": "file.txt",
                "content": "content",
                "mimetype": "text/plain",
            },
        ]
    )

    email_message.full_clean()

    email_message.save()


@pytest.mark.django_db
@pytest.mark.parametrize("missing", ["filename", "content", "mimetype"])
def test_email_message__validate_email_attachments__missing_keys(missing):
    attachment = {
        "filename": "file.txt",
        "content": "content",
        "mimetype": "text/plain",
    }
    del attachment[missing]

    email_message = EmailMessageFactory.build(attachments=[attachment])

    msg = {"attachments": ["Not a valid email attachment: dict keys must be ['content', 'filename', 'mimetype']"]}
    with pytest.raises(ValidationError, match=exact(str(msg))):
        email_message.full_clean()


@pytest.mark.django_db
@pytest.mark.parametrize("missing", ["filename", "content", "mimetype"])
def test_email_message__validate_email_attachments__value_not_string(missing):
    attachment = {
        "filename": "file.txt",
        "content": "content",
        "mimetype": "text/plain",
        missing: None,
    }

    email_message = EmailMessageFactory.build(attachments=[attachment])

    msg = {"attachments": [f"Email attachment '{missing}' must be of type 'str', got <class 'NoneType'>"]}
    with pytest.raises(ValidationError, match=exact(str(msg))):
        email_message.full_clean()
