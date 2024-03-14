class SendReservationEmailNotificationException(Exception):
    pass


class ReservationEmailNotificationBuilderException(Exception):
    pass


class EmailBuilderConfigError(Exception):
    pass


class EmailTemplateValidationError(Exception):
    def __init__(self, *args, **kwargs):
        if len(args) > 0:
            self.message = args[0]
