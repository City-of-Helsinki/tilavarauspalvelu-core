import datetime

import pytest

from config.utils.commons import LanguageType
from email_notification.helpers.email_builder_application import ApplicationEmailContext


@pytest.mark.parametrize("language", ["fi", "en", "sv"])
def test_email_context__from_application(language: LanguageType, settings):
    varaamo_link = settings.EMAIL_VARAAMO_EXT_LINK
    feedback_link = settings.EMAIL_FEEDBACK_EXT_LINK

    context = ApplicationEmailContext.build(language=language)
    assert context.language == language

    lang_part = f"/{language}" if language != "fi" else ""
    assert context.my_applications_ext_link == f"{varaamo_link}{lang_part}/applications"
    assert context.varaamo_ext_link == f"{varaamo_link}{lang_part}"
    assert context.feedback_ext_link == f"{feedback_link}?lang={language}"
    assert context.current_year == datetime.datetime.now().year
