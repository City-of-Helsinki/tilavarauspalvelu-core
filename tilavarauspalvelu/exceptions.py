class SendEmailNotificationError(Exception):
    pass


class EmailBuilderConfigurationError(Exception):
    pass


class EmailTemplateValidationError(Exception):
    def __init__(self, *args, **kwargs) -> None:
        if len(args) > 0:
            self.message = args[0]
