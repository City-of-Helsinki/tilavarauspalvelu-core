from applications.models import Address
from common.serializers import TranslatedModelSerializer


class AddressSerializer(TranslatedModelSerializer):
    class Meta:
        model = Address
        fields = [
            "pk",
            "street_address",
            "post_code",
            "city",
        ]
        read_only_fields = [
            "pk",
        ]
