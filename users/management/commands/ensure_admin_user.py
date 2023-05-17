from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Creates an admin user non-interactively if it doesn't exist"

    def add_arguments(self, parser):
        parser.add_argument("--username", help="Admin's username")
        parser.add_argument("--email", help="Admin's email")
        parser.add_argument("--password", help="Admin's password")

    def handle(self, *args, **options):
        User = get_user_model()
        if User.objects.count() == 0:
            User.objects.create_superuser(
                username=options["username"],
                email=options["email"],
                password=options["password"],
            )
            self.stdout.write(
                "  Initial user created! You can log in with username and "
                f"password {options['username']}/{options['password']}."
            )
        else:
            self.stdout.write("  User already exists. Initial user creation skipped.")
