class SendEmailNotificationError(Exception):
    pass


class EmailNotificationBuilderError(Exception):
    pass


class EmailBuilderConfigError(Exception):
    pass


class EmailTemplateValidationError(Exception):
    def __init__(self, *args, **kwargs) -> None:
        if len(args) > 0:
            self.message = args[0]
