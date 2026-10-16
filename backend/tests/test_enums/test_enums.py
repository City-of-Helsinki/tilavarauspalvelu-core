from __future__ import annotations

from tilavarauspalvelu.enums import AccessType, AccessTypeWithMultivalued, OrderStatus, OrderStatusWithFree


def test_order_status_and_order_status_with_free_match():
    order_statuses = sorted(OrderStatus)
    order_free_statuses = sorted(OrderStatusWithFree)

    assert "FREE" in order_free_statuses
    assert "FREE" not in order_statuses

    order_free_statuses.remove("FREE")

    assert order_statuses == order_free_statuses


def test_access_type_and_access_type_with_multivalued_match():
    access_types = sorted(AccessType)
    access_types_with_multivalued = sorted(AccessTypeWithMultivalued)

    assert "MULTIVALUED" in access_types_with_multivalued
    assert "MULTIVALUED" not in access_types

    access_types_with_multivalued.remove("MULTIVALUED")

    assert access_types == access_types_with_multivalued
