from django.apps import AppConfig


class ApplicationsConfig(AppConfig):
    name = "applications"

    def ready(self):
        import applications.signals
