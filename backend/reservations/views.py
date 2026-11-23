import random
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.db import IntegrityError
from .models import TableType, Reservation
from .serializers import TableTypeSerializer, ReservationSerializer


ALL_TIME_SLOTS = [
    '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM',
    '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM'
]


def has_unique_constraint_error(errors):
    err_str = str(errors)
    return '23505' in err_str or 'already booked' in err_str.lower() or 'unique' in err_str.lower()


class TableTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for listing available seating experiences (Indoor Noir, Chef's Counter, etc.)
    """
    queryset = TableType.objects.filter(is_active=True)
    serializer_class = TableTypeSerializer
    lookup_field = 'slug'


class ReservationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for viewing and managing table reservations.
    Supports Supabase PostgREST array-style payloads or single object payloads.
    """
    queryset = Reservation.objects.all().select_related('table_type')
    serializer_class = ReservationSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        date = self.request.query_params.get('date')
        time_slot = self.request.query_params.get('time_slot')
        phone = self.request.query_params.get('phone')
        table_number = self.request.query_params.get('table_number')
        booking_code = self.request.query_params.get('booking_code')

        if date:
            queryset = queryset.filter(date=date)
        if time_slot:
            queryset = queryset.filter(time_slot=time_slot)
        if phone:
            queryset = queryset.filter(phone=phone)
        if table_number:
            queryset = queryset.filter(table_number=table_number)
        if booking_code:
            queryset = queryset.filter(booking_code=booking_code)

        return queryset

    def create(self, request, *args, **kwargs):
        """
        Custom create to accept either:
        - A single reservation object: {"name": "...", "phone": "...", ...}
        - An array of reservation objects (e.g. Supabase style: [ { name, phone, table_number, date, time_slot } ])
        """
        data = request.data
        is_many = isinstance(data, list)

        serializer = self.get_serializer(data=data, many=is_many)
        if not serializer.is_valid():
            errors = serializer.errors
            err_code = "23505" if has_unique_constraint_error(errors) else "VALIDATION_ERROR"
            return Response({
                "code": err_code,
                "message": "Table already booked for this time." if err_code == "23505" else "Validation failed",
                "details": errors
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            self.perform_create(serializer)
        except IntegrityError:
            return Response({
                "code": "23505",
                "message": "Table already booked for this time."
            }, status=status.HTTP_400_BAD_REQUEST)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['get'])
    def availability(self, request):
        """
        Check availability for a given date and table type / table number.
        Params:
          - date: YYYY-MM-DD
          - table_slug: indoor-noir | chefs-counter | garden-terrace | rooftop-private (optional)
        Returns booked time slots and table statuses.
        """
        date_str = request.query_params.get('date')
        if not date_str:
            return Response({"error": "Missing 'date' query parameter (YYYY-MM-DD)"}, status=status.HTTP_400_BAD_REQUEST)

        table_slug = request.query_params.get('table_slug')
        qs = Reservation.objects.filter(date=date_str, status='confirmed')
        if table_slug:
            qs = qs.filter(table_type__slug=table_slug)

        booked_reservations = list(qs.values('table_number', 'time_slot', 'table_type__slug'))

        return Response({
            "date": date_str,
            "all_slots": ALL_TIME_SLOTS,
            "booked_reservations": booked_reservations,
        })


@api_view(['POST'])
def supabase_rpc_compat(request, function_name=None):
    """
    Optional bridge endpoint if Supabase RPC or function calls are made
    """
    return Response({"status": "ok", "function": function_name, "received": request.data})
