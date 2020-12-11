from rest_framework import serializers

from spaces.models import Building, Space

"""
    This file gives you examples on how to write serializers for related fields.
    Examples covers these four scenarios:
    1. Write with foreign key ID, read as foreign key ID
    2. Write with foreign key ID, read as JSON object
    3. Write with JSON object, read as foreign key ID
    4. Write with JSON object, read as JSON object
"""


class BuildingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Building
        fields = ["id", "name"]


# 1. Write with foreign key ID, read as foreign key ID
class SpaceSerializer(serializers.ModelSerializer):
    building_id = serializers.PrimaryKeyRelatedField(
        queryset=Building.objects.all(), source="building"
    )

    class Meta:
        model = Space
        fields = ["id", "name", "parent", "surface_area", "building_id"]


# 2. Write with foreign key ID, read as JSON object
class SpaceSerializer(serializers.ModelSerializer):
    building = BuildingSerializer(read_only=True)
    building_id = serializers.PrimaryKeyRelatedField(
        queryset=Building.objects.all(), source="building", write_only=True
    )

    class Meta:
        model = Space
        fields = [
            "id",
            "name",
            "parent",
            "building",
            "surface_area",
            "building_id",
            "building",
        ]


# 3. Write with JSON object, read as foreign key ID
class SpaceSerializer(serializers.ModelSerializer):
    building = BuildingSerializer(write_only=True)
    building_id = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Space
        fields = ["id", "name", "parent", "building", "surface_area", "building_id"]

    def create(self, validated_data):
        building_data = validated_data.pop("building")
        building = Building.objects.create(**building_data)
        validated_data["building"] = building

        return super().create(validated_data)

    def update(self, instance, validated_data):
        building_data = validated_data.pop("building")
        building = Building.objects.create(**building_data)
        validated_data["building"] = building

        return super().create(instance, validated_data)


# 4. Write with JSON object, read as JSON object
class SpaceSerializer(serializers.ModelSerializer):
    building = BuildingSerializer()

    class Meta:
        model = Space
        fields = ["id", "name", "parent", "building", "surface_area"]

    def create(self, validated_data):
        building_data = validated_data.pop("building")
        building = Building.objects.create(**building_data)
        validated_data["building"] = building

        return super().create(validated_data)

    def update(self, instance, validated_data):
        building_data = validated_data.pop("building")
        building = Building.objects.create(**building_data)
        validated_data["building"] = building

        return super().create(instance, validated_data)
