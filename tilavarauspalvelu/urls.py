from django.contrib import admin
from django.urls import include, path
from graphene_django.views import GraphQLView
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from api.urls import router as api_router

urlpatterns = [
    path("admin/", admin.site.urls),
    path("v1/", include(api_router.urls)),
    path("openapi/", SpectacularAPIView.as_view(), name="schema"),
    path("swagger-ui/", SpectacularSwaggerView.as_view(url_name="schema")),
    path("redoc/", SpectacularRedocView.as_view(url_name="schema")),
    path("graphql", GraphQLView.as_view(graphiql=True)),
]
