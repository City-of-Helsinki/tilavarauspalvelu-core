from itertools import chain

from django.conf import settings
from django_filters import rest_framework as filters
from modeltranslation.manager import get_translatable_fields_for_model
from rest_framework import serializers

LANGUAGE_CODES = [x[0] for x in settings.LANGUAGES]


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


class HierarchyModelMultipleChoiceFilter(filters.ModelMultipleChoiceFilter):
    """ Filters using the given object and it's children. Use with MPTT models. """

    def filter(self, qs, value):
        # qs is the initial list of objects to be filtered
        # value is a list of objects to be used for filtering
        values_with_children = chain.from_iterable(
            [
                obj.get_descendants(include_self=True)
                if hasattr(obj, "get_descendants")
                else [obj]
                for obj in value
            ]
        )
        return super().filter(qs, list(values_with_children))


class TranslatedModelSerializer(serializers.ModelSerializer):
    """
    A serializer that automatically registers translated model fields
    and nests them in an object under the original field name
    """

    def to_representation(self, obj):
        ret = super().to_representation(obj)
        model = self.Meta.model

        translatable_fields = get_translatable_fields_for_model(model) or []

        if obj is None:
            return ret

        for field_name in translatable_fields:
            if field_name not in self.fields:
                continue
            translations_dict = {}

            for language_code in LANGUAGE_CODES:
                key = f"{field_name}_{language_code}"
                val = getattr(obj, key, None)
                translations_dict[language_code] = val

            # If no text provided, leave the field as null
            translations_dict = translations_dict or None
            ret[field_name] = translations_dict
        return ret
