from __future__ import annotations

import os
from typing import Any

from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.status import HTTP_201_CREATED

from tilavarauspalvelu.api.frontend_testing_api.serializers import TestingBaseSerializer, TestingRootSerializer
from tilavarauspalvelu.management.commands.data_creation.main import _clear_database


class TestingBaseViewSet(viewsets.GenericViewSet):
    """
    Base viewset for frontend testing API endpoints.

    When subclassing this viewset, you only need to set the `params_serializer_class`
    """

    serializer_class = TestingRootSerializer
    params_serializer_class = TestingBaseSerializer

    def get_serializer(self, *args: Any, **kwargs: Any) -> TestingRootSerializer:
        """
        Dynamically replace the `params` field with the correct serializer class.
        This method removes the need to create a separate "root" serializer class for each endpoint.
        """
        serializer_class = self.get_serializer_class()

        serializer_class.params = self.params_serializer_class()
        serializer_class._declared_fields["params"] = self.params_serializer_class()  # noqa: SLF001

        kwargs.setdefault("context", self.get_serializer_context())
        return serializer_class(*args, **kwargs)

    def create(self, request, *args: Any, **kwargs: Any) -> Response:
        # Validate request
        serializer: TestingRootSerializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Flush database
        if "PYTEST_CURRENT_TEST" not in os.environ:  # Don't flush database during tests, it will just slow them down
            _clear_database()

        # Create the requested data
        serializer.save()

        return Response(status=HTTP_201_CREATED)
