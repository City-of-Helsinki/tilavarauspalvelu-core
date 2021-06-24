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


class TranslatedFieldSerializer(serializers.Serializer):
    """
    DRF field class for translated fields.
    For a field called `name` this dynamically creates a class with the structure of:
    ```
    class TranslatedFieldSerializer:
        fi = serializers.CharField(source='name')
        en = serializers.CharField(source='name')
        sv = serializers.CharField(source='name')
    ```
    Which, when used as a field in ModelSerializer, is represented in the API as
    ```
    {
        "name": {
            "fi": "foo",
            "en": "foo",
            "sv": "foo",
        }
    }
    ```
    and written to the model as `name_fi`, `name_en`, `name_sv`.
    """

    def __init__(self, **kwargs):
        original_field_name = kwargs.pop("source", None)
        original_field_class = kwargs.pop("field_class", None)
        if original_field_name is None:
            raise AssertionError(
                "Translated fields must specify source field in kwargs"
            )
        for language_code in LANGUAGE_CODES:
            translated_field_name = f"{original_field_name}_{language_code}"
            field_kwargs = kwargs.copy()
            field_kwargs["source"] = translated_field_name
            if original_field_class is not None:
                field_class = original_field_class
            else:
                field_class = serializers.CharField
            translated_field = field_class(**field_kwargs)
            setattr(self, language_code, translated_field)
            # Dynamically add the translated fields to serializer fields.
            # Note; not using _declared_fields since its a class based variable.
            # So it changes the class not the instance, thus fields.
            if language_code not in self.fields:
                self.fields[language_code] = translated_field
        super().__init__(source="*")


class TranslatedModelSerializer(serializers.ModelSerializer):
    """
    A serializer that automatically registers translated model fields
    and nests them in an object under the original field name.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.model_translatable_fields = (
            get_translatable_fields_for_model(self.Meta.model) or []
        )

    def build_field(self, source, *args, **kwargs):
        field_class, field_kwargs = super().build_field(source, *args, **kwargs)
        if source in self.model_translatable_fields:
            field_kwargs["source"] = source
            field_kwargs["field_class"] = field_class
            field_class = TranslatedFieldSerializer
        return field_class, field_kwargs
