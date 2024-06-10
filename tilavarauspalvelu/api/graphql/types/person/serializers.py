from graphene_django_extensions import NestingModelSerializer

from applications.models import Person


class PersonSerializer(NestingModelSerializer):
    class Meta:
        model = Person
        fields = [
            "pk",
            "first_name",
            "last_name",
            "email",
            "phone_number",
        ]
