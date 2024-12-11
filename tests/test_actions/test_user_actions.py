from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import UserRoleChoice

from tests.factories import ADGroupFactory, UnitFactory, UnitRoleFactory, UserFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_user_actions__get_ad_group_roles__single():
    unit = UnitFactory.create(tprek_id="123", allow_permissions_from_ad_groups=True)
    user = UserFactory.create(ad_groups__name="oodi__varaamo__admin__123")
    roles = user.actions.get_ad_group_roles()

    assert roles == {UserRoleChoice.ADMIN: {unit.id}}


def test_user_actions__get_ad_group_roles__single__prefix_has_underscore():
    unit = UnitFactory.create(tprek_id="123", allow_permissions_from_ad_groups=True)
    user = UserFactory.create(ad_groups__name="oodi_new__varaamo__admin__123")
    roles = user.actions.get_ad_group_roles()

    assert roles == {UserRoleChoice.ADMIN: {unit.id}}


def test_user_actions__get_ad_group_roles__single__role_has_underscore():
    unit = UnitFactory.create(tprek_id="123", allow_permissions_from_ad_groups=True)
    user = UserFactory.create(ad_groups__name="oodi__varaamo__notification_manager__123")
    roles = user.actions.get_ad_group_roles()

    assert roles == {UserRoleChoice.NOTIFICATION_MANAGER: {unit.id}}


def test_user_actions__get_ad_group_roles__multiple():
    unit_1 = UnitFactory.create(tprek_id="123", allow_permissions_from_ad_groups=True)
    unit_2 = UnitFactory.create(tprek_id="456", allow_permissions_from_ad_groups=True)
    ad_group_1 = ADGroupFactory.create(name="oodi__varaamo__admin__123")
    ad_group_2 = ADGroupFactory.create(name="oodi__varaamo__reserver__456")
    user = UserFactory.create(ad_groups=[ad_group_1, ad_group_2])
    roles = user.actions.get_ad_group_roles()

    assert roles == {UserRoleChoice.ADMIN: {unit_1.id}, UserRoleChoice.RESERVER: {unit_2.id}}


def test_user_actions__get_ad_group_roles__multiple__same_unit():
    unit = UnitFactory.create(tprek_id="123", allow_permissions_from_ad_groups=True)
    ad_group_1 = ADGroupFactory.create(name="oodi__varaamo__admin__123")
    ad_group_2 = ADGroupFactory.create(name="oodi__varaamo__reserver__123")
    user = UserFactory.create(ad_groups=[ad_group_1, ad_group_2])
    roles = user.actions.get_ad_group_roles()

    assert roles == {UserRoleChoice.ADMIN: {unit.id}, UserRoleChoice.RESERVER: {unit.id}}


def test_user_actions__get_ad_group_roles__multiple__same_role():
    unit_1 = UnitFactory.create(tprek_id="123", allow_permissions_from_ad_groups=True)
    unit_2 = UnitFactory.create(tprek_id="456", allow_permissions_from_ad_groups=True)
    ad_group_1 = ADGroupFactory.create(name="oodi__varaamo__admin__123")
    ad_group_2 = ADGroupFactory.create(name="oodi__varaamo__admin__456")
    user = UserFactory.create(ad_groups=[ad_group_1, ad_group_2])
    roles = user.actions.get_ad_group_roles()

    assert roles == {UserRoleChoice.ADMIN: {unit_1.id, unit_2.id}}


def test_user_actions__get_ad_group_roles__multiple_roles_in_same_ad_group():
    unit = UnitFactory.create(tprek_id="123", allow_permissions_from_ad_groups=True)
    user = UserFactory.create(ad_groups__name="oodi__varaamo__admin__reserver__123")
    roles = user.actions.get_ad_group_roles()

    assert roles == {UserRoleChoice.ADMIN: {unit.id}, UserRoleChoice.RESERVER: {unit.id}}


def test_user_actions__get_ad_group_roles__no_ad_groups():
    user = UserFactory.create()
    roles = user.actions.get_ad_group_roles()

    assert roles == {}


def test_user_actions__get_ad_group_roles__ad_group_doesnt_match():
    user = UserFactory.create(ad_groups__name="foo")
    roles = user.actions.get_ad_group_roles()

    assert roles == {}


def test_user_actions__get_ad_group_roles__ad_group_doesnt_match__no_prefix():
    UnitFactory.create(tprek_id="123", allow_permissions_from_ad_groups=True)
    user = UserFactory.create(ad_groups__name="varaamo__admin__123")
    roles = user.actions.get_ad_group_roles()

    assert roles == {}


def test_user_actions__get_ad_group_roles__ad_group_doesnt_match__no_tprek_id():
    UnitFactory.create(tprek_id="123", allow_permissions_from_ad_groups=True)
    user = UserFactory.create(ad_groups__name="oodi__varaamo__admin")
    roles = user.actions.get_ad_group_roles()

    assert roles == {}


def test_user_actions__get_ad_group_roles__ad_group_doesnt_match__no_role():
    UnitFactory.create(tprek_id="123", allow_permissions_from_ad_groups=True)
    user = UserFactory.create(ad_groups__name="oodi__varaamo__123")
    roles = user.actions.get_ad_group_roles()

    assert roles == {}


def test_user_actions__get_ad_group_roles__ad_group_doesnt_match__unknown_role():
    UnitFactory.create(tprek_id="123", allow_permissions_from_ad_groups=True)
    user = UserFactory.create(ad_groups__name="oodi__varaamo__new__123")
    roles = user.actions.get_ad_group_roles()

    assert roles == {}


def test_user_actions__get_ad_group_roles__ad_group_doesnt_match__skip_unknown_role():
    unit = UnitFactory.create(tprek_id="123", allow_permissions_from_ad_groups=True)
    user = UserFactory.create(ad_groups__name="oodi__varaamo__admin__new__123")
    roles = user.actions.get_ad_group_roles()

    assert roles == {UserRoleChoice.ADMIN: {unit.id}}


def test_user_actions__get_ad_group_roles__ad_group_doesnt_match__unknown_unit():
    UnitFactory.create(tprek_id="123", allow_permissions_from_ad_groups=True)
    user = UserFactory.create(ad_groups__name="oodi__varaamo__admin__456")
    roles = user.actions.get_ad_group_roles()

    assert roles == {}


def test_user_actions__get_ad_group_roles__ad_group_doesnt_match__dont_allow_permissions_from_ad_groups():
    UnitFactory.create(tprek_id="123", allow_permissions_from_ad_groups=False)
    user = UserFactory.create(ad_groups__name="oodi__varaamo__admin__123")
    roles = user.actions.get_ad_group_roles()

    assert roles == {}


def test_user_actions__update_unit_roles_from_ad_groups__add_new_role():
    unit = UnitFactory.create(tprek_id="123", allow_permissions_from_ad_groups=True)
    user = UserFactory.create(ad_groups__name="oodi__varaamo__admin__123")

    user.actions.update_unit_roles_from_ad_groups()

    unit_roles = list(user.unit_roles.all())

    assert len(unit_roles) == 1
    assert unit_roles[0].role == UserRoleChoice.ADMIN
    assert unit_roles[0].units.first() == unit


def test_user_actions__update_unit_roles_from_ad_groups__remove_old_role():
    unit = UnitFactory.create(tprek_id="123", allow_permissions_from_ad_groups=True)
    user = UserFactory.create()

    UnitRoleFactory.create(user=user, role=UserRoleChoice.ADMIN, units=[unit], from_ad_group=True)

    assert user.unit_roles.count() == 1

    user.actions.update_unit_roles_from_ad_groups()

    assert user.unit_roles.count() == 0


def test_user_actions__update_unit_roles_from_ad_groups__add_new_and_remove_old_role():
    unit_1 = UnitFactory.create(tprek_id="123", allow_permissions_from_ad_groups=True)
    unit_2 = UnitFactory.create(tprek_id="456", allow_permissions_from_ad_groups=True)
    user = UserFactory.create(ad_groups__name="oodi__varaamo__admin__123")

    UnitRoleFactory.create(user=user, role=UserRoleChoice.HANDLER, units=[unit_2], from_ad_group=True)

    user.actions.update_unit_roles_from_ad_groups()

    unit_roles = list(user.unit_roles.all())
    assert len(unit_roles) == 1
    assert unit_roles[0].role == UserRoleChoice.ADMIN
    assert unit_roles[0].units.first() == unit_1


def test_user_actions__update_unit_roles_from_ad_groups__add_new_unit():
    unit_1 = UnitFactory.create(tprek_id="123", allow_permissions_from_ad_groups=True)
    unit_2 = UnitFactory.create(tprek_id="456", allow_permissions_from_ad_groups=True)
    ad_group_1 = ADGroupFactory.create(name="oodi__varaamo__admin__123")
    ad_group_2 = ADGroupFactory.create(name="oodi__varaamo__admin__456")
    user = UserFactory.create(ad_groups=[ad_group_1, ad_group_2])

    role = UnitRoleFactory.create(user=user, role=UserRoleChoice.ADMIN, units=[unit_1], from_ad_group=True)

    user.actions.update_unit_roles_from_ad_groups()

    unit_roles = list(user.unit_roles.all())
    assert len(unit_roles) == 1
    assert unit_roles[0] == role

    unit_roles_units = list(unit_roles[0].units.order_by("tprek_id").all())
    assert len(unit_roles_units) == 2
    assert unit_roles_units[0] == unit_1
    assert unit_roles_units[1] == unit_2


def test_user_actions__update_unit_roles_from_ad_groups__add_new_unit__multiple():
    unit_1 = UnitFactory.create(tprek_id="123", allow_permissions_from_ad_groups=True)
    unit_2 = UnitFactory.create(tprek_id="456", allow_permissions_from_ad_groups=True)
    unit_3 = UnitFactory.create(tprek_id="789", allow_permissions_from_ad_groups=True)
    ad_group_1 = ADGroupFactory.create(name="oodi__varaamo__admin__123")
    ad_group_2 = ADGroupFactory.create(name="oodi__varaamo__admin__456")
    ad_group_3 = ADGroupFactory.create(name="oodi__varaamo__admin__789")
    user = UserFactory.create(ad_groups=[ad_group_1, ad_group_2, ad_group_3])

    role = UnitRoleFactory.create(user=user, role=UserRoleChoice.ADMIN, units=[unit_1], from_ad_group=True)

    user.actions.update_unit_roles_from_ad_groups()

    unit_roles = list(user.unit_roles.all())
    assert len(unit_roles) == 1
    assert unit_roles[0] == role

    unit_roles_units = list(unit_roles[0].units.order_by("tprek_id").all())
    assert len(unit_roles_units) == 3
    assert unit_roles_units[0] == unit_1
    assert unit_roles_units[1] == unit_2
    assert unit_roles_units[2] == unit_3


def test_user_actions__update_unit_roles_from_ad_groups__remove_existing_unit():
    unit_1 = UnitFactory.create(tprek_id="123", allow_permissions_from_ad_groups=True)
    unit_2 = UnitFactory.create(tprek_id="456", allow_permissions_from_ad_groups=True)
    user = UserFactory.create(ad_groups__name="oodi__varaamo__admin__123")

    role = UnitRoleFactory.create(user=user, role=UserRoleChoice.ADMIN, units=[unit_1, unit_2], from_ad_group=True)

    user.actions.update_unit_roles_from_ad_groups()

    unit_roles = list(user.unit_roles.all())
    assert len(unit_roles) == 1
    assert unit_roles[0] == role

    unit_roles_units = list(unit_roles[0].units.order_by("tprek_id").all())
    assert len(unit_roles_units) == 1
    assert unit_roles_units[0] == unit_1


def test_user_actions__update_unit_roles_from_ad_groups__remove_existing_unit__multiple():
    unit_1 = UnitFactory.create(tprek_id="123", allow_permissions_from_ad_groups=True)
    unit_2 = UnitFactory.create(tprek_id="456", allow_permissions_from_ad_groups=True)
    unit_3 = UnitFactory.create(tprek_id="789", allow_permissions_from_ad_groups=True)
    user = UserFactory.create(ad_groups__name="oodi__varaamo__admin__123")

    role = UnitRoleFactory.create(
        user=user,
        role=UserRoleChoice.ADMIN,
        units=[unit_1, unit_2, unit_3],
        from_ad_group=True,
    )

    user.actions.update_unit_roles_from_ad_groups()

    unit_roles = list(user.unit_roles.all())
    assert len(unit_roles) == 1
    assert unit_roles[0] == role

    unit_roles_units = list(unit_roles[0].units.order_by("tprek_id").all())
    assert len(unit_roles_units) == 1
    assert unit_roles_units[0] == unit_1


def test_user_actions__update_unit_roles_from_ad_groups__dont_remove_role_if_not_added_via_ad_group():
    unit = UnitFactory.create(tprek_id="123", allow_permissions_from_ad_groups=True)
    user = UserFactory.create()

    role = UnitRoleFactory.create(user=user, role=UserRoleChoice.ADMIN, units=[unit])

    assert user.unit_roles.first() == role

    user.actions.update_unit_roles_from_ad_groups()

    assert user.unit_roles.first() == role


def test_user_actions__update_unit_roles_from_ad_groups__roles_remain_as_is():
    unit_1 = UnitFactory.create(tprek_id="123", allow_permissions_from_ad_groups=True)
    unit_2 = UnitFactory.create(tprek_id="456", allow_permissions_from_ad_groups=True)
    ad_group_1 = ADGroupFactory.create(name="oodi__varaamo__admin__123")
    ad_group_2 = ADGroupFactory.create(name="oodi__varaamo__admin__456")
    user = UserFactory.create(ad_groups=[ad_group_1, ad_group_2])

    role = UnitRoleFactory.create(user=user, role=UserRoleChoice.ADMIN, units=[unit_1, unit_2], from_ad_group=True)

    user.actions.update_unit_roles_from_ad_groups()

    unit_roles = list(user.unit_roles.all())
    assert len(unit_roles) == 1
    assert unit_roles[0] == role

    unit_roles_units = list(unit_roles[0].units.order_by("tprek_id").all())
    assert len(unit_roles_units) == 2
    assert unit_roles_units[0] == unit_1
    assert unit_roles_units[1] == unit_2


def test_user_actions__update_unit_roles_from_ad_groups__role_changed_units_remain():
    unit_1 = UnitFactory.create(tprek_id="123", allow_permissions_from_ad_groups=True)
    unit_2 = UnitFactory.create(tprek_id="456", allow_permissions_from_ad_groups=True)
    ad_group_1 = ADGroupFactory.create(name="oodi__varaamo__admin__123")
    ad_group_2 = ADGroupFactory.create(name="oodi__varaamo__admin__456")
    user = UserFactory.create(ad_groups=[ad_group_1, ad_group_2])

    UnitRoleFactory.create(user=user, role=UserRoleChoice.HANDLER, units=[unit_1, unit_2], from_ad_group=True)

    user.actions.update_unit_roles_from_ad_groups()

    unit_roles = list(user.unit_roles.all())
    assert len(unit_roles) == 1
    assert unit_roles[0].role == UserRoleChoice.ADMIN

    unit_roles_units = list(unit_roles[0].units.order_by("tprek_id").all())
    assert len(unit_roles_units) == 2
    assert unit_roles_units[0] == unit_1
    assert unit_roles_units[1] == unit_2


def test_user_actions__update_unit_roles_from_ad_groups__ad_roles_no_longer_allowed():
    unit = UnitFactory.create(tprek_id="123", allow_permissions_from_ad_groups=False)
    user = UserFactory.create(ad_groups__name="oodi__varaamo__handler__123")

    UnitRoleFactory.create(user=user, role=UserRoleChoice.HANDLER, units=[unit], from_ad_group=True)

    user.actions.update_unit_roles_from_ad_groups()

    unit_roles = list(user.unit_roles.all())
    assert len(unit_roles) == 0
