from decimal import Decimal

from rest_framework import serializers


class DecimalField(serializers.FloatField):
    def to_internal_value(self, data):
        return Decimal(str(data))
