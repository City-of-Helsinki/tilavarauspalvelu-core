import pytest

from tests.factories import PaymentMerchantFactory, UnitFactory, UnitGroupFactory, UserFactory
from tests.helpers import UserType

from .helpers import units_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_units__filter__only_with_permission__regular_user(graphql):
    UnitFactory.create()
    graphql.login_user_based_on_type(UserType.REGULAR)

    query = units_query(only_with_permission=True)
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 0


def test_units__filter__only_with_permission__general_admin__can_manage_units(graphql):
    UnitFactory.create()

    user = UserFactory.create_with_general_permissions(perms=["can_manage_units"])
    graphql.force_login(user)

    query = units_query(only_with_permission=True)
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1


def test_units__filter__only_with_permission__unit_admin__can_manage_units(graphql):
    unit = UnitFactory.create()
    UnitFactory.create()

    user = UserFactory.create_with_unit_permissions(unit=unit, perms=["can_manage_units"])
    graphql.force_login(user)

    query = units_query(only_with_permission=True)
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": unit.pk}


def test_units__filter__only_with_permission__unit_group_admin__can_manage_units(graphql):
    unit = UnitFactory.create()
    UnitFactory.create()
    unit_group = UnitGroupFactory.create(units=[unit])

    user = UserFactory.create_with_unit_group_permissions(unit_group=unit_group, perms=["can_manage_units"])
    graphql.force_login(user)

    query = units_query(only_with_permission=True)
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": unit.pk}


def test_units__query__hide_payment_merchant_without_permissions(graphql):
    unit = UnitFactory.create(payment_merchant=PaymentMerchantFactory.create())

    graphql.login_user_based_on_type(UserType.REGULAR)
    query = units_query(fields="nameFi paymentMerchant { name }")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {"nameFi": unit.name, "paymentMerchant": None}


def test_units__query__show_payment_merchant_with_permissions(graphql):
    unit = UnitFactory.create(payment_merchant=PaymentMerchantFactory.create())

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    query = units_query(fields="nameFi paymentMerchant { name }")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {"nameFi": unit.name, "paymentMerchant": {"name": unit.payment_merchant.name}}
