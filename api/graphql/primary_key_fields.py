from rest_framework import serializers


class IntegerPrimaryKeyField(
    serializers.PrimaryKeyRelatedField,
    serializers.IntegerField,
):
    """A field that refers to foreign keys by an integer primary key."""
