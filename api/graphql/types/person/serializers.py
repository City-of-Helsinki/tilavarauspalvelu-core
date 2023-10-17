from applications.models import Person
from common.serializers import TranslatedModelSerializer


class PersonSerializer(TranslatedModelSerializer):
    class Meta:
        model = Person
        fields = [
            "pk",
            "first_name",
            "last_name",
            "email",
            "phone_number",
        ]
