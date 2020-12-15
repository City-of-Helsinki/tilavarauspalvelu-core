from django.contrib import admin
from django.urls import include, path
from graphene_django.views import GraphQLView
from rest_framework.schemas import get_schema_view

from api.urls import router as api_router

urlpatterns = [
    path("admin/", admin.site.urls),
    path("v1/", include(api_router.urls)),
    path("openapi/", get_schema_view()),
    path("graphql", GraphQLView.as_view(graphiql=True)),
]
