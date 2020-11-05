from rest_framework import serializers


class BaseNestedSerializer(serializers.ModelSerializer):
    """
    A `BaseNestedSerializer` is a customized `ModelSerializer`,
    that allows defining two sets of fields: one for details,
    one for stripped down data.

    Usage:
    1. Provide an optional parameter `exclude_detail_fields=True` (default: False)
    when calling `BaseNestedSerializer`.
    2. Define two lists of field in serializers Meta-class: `fields` and `details_only_fields`.

    Example:
    ```
    class FooSerializer(BaseNestedSerializer):
        class Meta:
            fields = ["id", "name", "description"]
            details_only_fields = ["description"]

    class BarSerializer(BaseNestedSerializer):
        some_nested_object = FooSerializer(exclude_detail_fields=True)
        ...
    ```
    In this example, `description` field will be popped from the data, as it's defined in
    `details_only_fields` and `exclude_detail_fields` is set to True
    """

    def __init__(self, *args, **kwargs):
        detail_only_fields = getattr(self.Meta, "detail_only_fields", [])
        exclude_detail_fields = kwargs.pop("exclude_detail_fields", False)
        super().__init__(*args, **kwargs)
        if exclude_detail_fields:
            for field in detail_only_fields:
                del self.fields[field]
