from applications.models import (
    Application,
    ApplicationEvent,
    ApplicationEventStatus,
    ApplicationRound,
    ApplicationStatus,
)


def handle_applications_on_in_review(application_round: ApplicationRound):
    applications = Application.objects.filter(
        application_round=application_round,
        latest_status__in=[ApplicationStatus.DRAFT, ApplicationStatus.RECEIVED],
    )
    for application in applications:
        if application.status == ApplicationStatus.DRAFT:
            application.set_status(ApplicationStatus.EXPIRED)
        elif application.status == ApplicationStatus.RECEIVED:
            application.set_status(ApplicationStatus.IN_REVIEW)


def handle_applications_on_review_done(application_round: ApplicationRound):
    applications = Application.objects.filter(
        application_round=application_round,
        latest_status=ApplicationStatus.IN_REVIEW,
    )
    for application in applications:
        events = ApplicationEvent.objects.filter(
            application=application,
        )
        declined_event_count = events.filter(latest_status=ApplicationEventStatus.DECLINED).count()
        if events.exists() and declined_event_count == events.count():
            application.set_status(ApplicationStatus.ALLOCATED)
        else:
            application.set_status(ApplicationStatus.REVIEW_DONE)


def handle_applications_on_handled(application_round: ApplicationRound):
    applications = Application.objects.filter(
        application_round=application_round,
        latest_status=ApplicationStatus.ALLOCATED,
    )
    for application in applications:
        application.set_status(ApplicationStatus.HANDLED)

        events = ApplicationEvent.objects.filter(application=application, latest_status=ApplicationEventStatus.APPROVED)
        for event in events:
            event.set_status(ApplicationEventStatus.RESERVED)


def handle_applications_on_sent(application_round: ApplicationRound):
    applications = Application.objects.filter(
        application_round=application_round,
        latest_status=ApplicationStatus.HANDLED,
    )
    for application in applications:
        application.set_status(ApplicationStatus.SENT)
