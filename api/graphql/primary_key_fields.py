from rest_framework import serializers
from rest_framework.relations import PKOnlyObject


class IntegerPrimaryKeyField(
    serializers.PrimaryKeyRelatedField,
    serializers.IntegerField,
):
    """A field that refers to foreign keys by an integer primary key."""

    def get_attribute(self, instance):
        attribute = super().get_attribute(instance)
        if isinstance(attribute, PKOnlyObject) and attribute.pk:
            attribute = IntCastablePkOnlyObject(pk=attribute.pk)
            return attribute
        return None


class IntCastablePkOnlyObject(PKOnlyObject):
    def __int__(self):
        return self.pk
