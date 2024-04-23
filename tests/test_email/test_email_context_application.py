import datetime

import pytest

from email_notification.helpers.email_builder_application import ApplicationEmailContext
from tilavarauspalvelu.utils.commons import LanguageType


@pytest.mark.parametrize("language", ["fi", "en", "sv"])
def test_email_context__from_application(language: LanguageType, settings):
    settings.EMAIL_VARAAMO_EXT_LINK = varaamo_link = "https://varaamo.hel.fi"
    settings.EMAIL_FEEDBACK_EXT_LINK = feedback_link = "https://feedback.hel.fi"

    context = ApplicationEmailContext.build(language=language)
    assert context.language == language

    lang_part = f"/{language}" if language != "fi" else ""
    assert context.my_applications_ext_link == f"{varaamo_link}{lang_part}/applications"
    assert context.varaamo_ext_link == f"{varaamo_link}{lang_part}"
    assert (
        context.feedback_ext_link
        == f"{feedback_link}?site=varaamopalaute&lang={language}&ref=https%3A%2F%2Fvaraamo.hel.fi"
    )
    assert context.current_year == datetime.datetime.now().year
