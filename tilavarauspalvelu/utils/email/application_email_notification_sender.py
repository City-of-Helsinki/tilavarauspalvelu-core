from applications.models import Application
from tilavarauspalvelu.enums import EmailType
from tilavarauspalvelu.tasks import send_application_email_task


class ApplicationEmailNotificationSender:
    """Helper class for triggering application email sending tasks."""

    @classmethod
    def send_received_email(cls, application: Application) -> None:
        send_application_email_task.delay(
            application_id=application.id,
            email_type=EmailType.APPLICATION_RECEIVED,
        )
