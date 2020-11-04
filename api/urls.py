from rest_framework import routers
from .resources_api import FixedResourceViewSet, MovableResourceViewSet


router = routers.DefaultRouter()
router.register(r"fixedresources", FixedResourceViewSet)
router.register(r"movableresources", MovableResourceViewSet)
