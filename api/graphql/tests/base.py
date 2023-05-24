from django.contrib.auth import get_user_model
from graphene_django.utils import GraphQLTestCase

from permissions.models import (
    GeneralRole,
    GeneralRoleChoice,
    ServiceSectorRole,
    ServiceSectorRoleChoice,
    ServiceSectorRolePermission,
    UnitRole,
    UnitRoleChoice,
    UnitRolePermission,
)
from spaces.models import Unit
from spaces.tests.factories import ServiceSectorFactory, UnitFactory, UnitGroupFactory


class GrapheneTestCaseBase(GraphQLTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.general_admin = get_user_model().objects.create(
            username="gen_admin",
            first_name="Admin",
            last_name="General",
            email="amin.general@foo.com",
        )
        GeneralRole.objects.create(
            user=cls.general_admin,
            role=GeneralRoleChoice.objects.get(code="admin"),
        )
        cls.regular_joe = get_user_model().objects.create(
            username="regjoe",
            first_name="joe",
            last_name="regular",
            email="joe.regularl@foo.com",
        )

    def create_service_sector_admin(self, service_sector=None):
        if not service_sector:
            service_sector = ServiceSectorFactory()

        service_sector_admin = get_user_model().objects.create(
            username="ss_admin",
            first_name="Amin",
            last_name="Dee",
            email="amin.dee@foo.com",
        )

        ServiceSectorRole.objects.create(
            user=service_sector_admin,
            role=ServiceSectorRoleChoice.objects.get(code="admin"),
            service_sector=service_sector,
        )
        ServiceSectorRolePermission.objects.create(
            role=ServiceSectorRoleChoice.objects.get(code="admin"),
            permission="can_handle_applications",
        )
        ServiceSectorRolePermission.objects.create(
            role=ServiceSectorRoleChoice.objects.get(code="admin"),
            permission="can_view_reservations",
        )

        return service_sector_admin

    def create_unit_admin(self, unit=None):
        unit_admin = get_user_model().objects.create(
            username="unit_admin",
            first_name="Amin",
            last_name="Dee",
            email="amin.dee@foo.com",
        )

        unit_role = UnitRole.objects.create(
            user=unit_admin,
            role=UnitRoleChoice.objects.get(code="admin"),
        )
        UnitRolePermission.objects.create(
            role=UnitRoleChoice.objects.get(code="admin"),
            permission="can_validate_applications",
        )
        UnitRolePermission.objects.create(
            role=UnitRoleChoice.objects.get(code="admin"),
            permission="can_view_reservations",
        )

        if not unit:
            unit = UnitFactory()

        unit_role.unit.add(unit)

        return unit_admin

    def create_unit_group_admin(self, unit_group=None):
        unit_group_admin = get_user_model().objects.create(
            username="ug_admin",
            first_name="Amin",
            last_name="Dee",
            email="amin.dee@foo.com",
        )

        unit_role = UnitRole.objects.create(
            user=unit_group_admin,
            role=UnitRoleChoice.objects.get(code="admin"),
        )
        UnitRolePermission.objects.create(
            role=UnitRoleChoice.objects.get(code="admin"),
            permission="can_validate_applications",
        )

        if not unit_group:
            unit_group = UnitGroupFactory(units=[UnitFactory()])

        unit_role.unit_group.add(unit_group)

        return unit_group_admin

    def create_staff_reserver_for_unit(self, unit: Unit = None):
        reserver_staff_user = get_user_model().objects.create(
            username="res",
            first_name="res",
            last_name="erver",
            email="res.erver@foo.com",
        )
        UnitRoleChoice.objects.create(
            code="staff",
            verbose_name="staff reserver person",
        )
        unit_role = UnitRole.objects.create(
            user=reserver_staff_user,
            role=UnitRoleChoice.objects.get(code="staff"),
        )
        UnitRolePermission.objects.create(
            role=UnitRoleChoice.objects.get(code="staff"),
            permission="can_create_staff_reservations",
        )

        if not unit:
            unit = UnitFactory()

        unit_role.unit.add(unit)

        return reserver_staff_user
