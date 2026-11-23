from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TableTypeViewSet, ReservationViewSet, supabase_rpc_compat

router = DefaultRouter()
router.register(r'tables', TableTypeViewSet, basename='table-type')
router.register(r'reservations', ReservationViewSet, basename='reservation')

urlpatterns = [
    path('', include(router.urls)),
    # PostgREST / Supabase compatible path aliasing: /rest/v1/reservations
    path('rest/v1/reservations', ReservationViewSet.as_view({'get': 'list', 'post': 'create'}), name='supabase-reservations'),
    path('rest/v1/rpc/<str:function_name>', supabase_rpc_compat, name='supabase-rpc'),
]
