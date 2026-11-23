import random
import string
from rest_framework import serializers
from .models import TableType, Reservation


def generate_booking_code():
    chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    code_body = ''.join(random.choices(chars, k=6))
    return f"CINDRE-{code_body}"


class TableTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TableType
        fields = [
            'id',
            'slug',
            'name',
            'seat_word',
            'min_guests',
            'max_guests',
            'description',
            'image_url',
            'min_table_num',
            'max_table_num',
            'is_active',
        ]


class ReservationSerializer(serializers.ModelSerializer):
    table_type_detail = TableTypeSerializer(source='table_type', read_only=True)
    table_type_slug = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Reservation
        fields = [
            'id',
            'booking_code',
            'name',
            'phone',
            'table_number',
            'table_type',
            'table_type_slug',
            'table_type_detail',
            'date',
            'time_slot',
            'guests',
            'occasion',
            'status',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'booking_code', 'created_at', 'updated_at']

    def validate(self, attrs):
        table_number = attrs.get('table_number')
        date = attrs.get('date')
        time_slot = attrs.get('time_slot')

        # Check unique constraint (table_number, date, time_slot)
        instance_id = self.instance.id if self.instance else None
        conflict = Reservation.objects.filter(
            table_number=table_number,
            date=date,
            time_slot=time_slot
        )
        if instance_id:
            conflict = conflict.exclude(id=instance_id)

        if conflict.exists():
            raise serializers.ValidationError({
                "code": "23505",
                "table_number": "Table already booked for this time."
            })

        return attrs

    def create(self, validated_data):
        table_type_slug = validated_data.pop('table_type_slug', None)
        if table_type_slug and not validated_data.get('table_type'):
            try:
                table_type = TableType.objects.get(slug=table_type_slug)
                validated_data['table_type'] = table_type
            except TableType.DoesNotExist:
                pass

        # If table_type not given, determine from table_number range
        if not validated_data.get('table_type'):
            table_num = validated_data.get('table_number')
            matched_type = TableType.objects.filter(
                min_table_num__lte=table_num,
                max_table_num__gte=table_num
            ).first()
            if matched_type:
                validated_data['table_type'] = matched_type

        # Generate unique booking code if not provided
        if not validated_data.get('booking_code'):
            for _ in range(10):
                code = generate_booking_code()
                if not Reservation.objects.filter(booking_code=code).exists():
                    validated_data['booking_code'] = code
                    break

        return super().create(validated_data)
