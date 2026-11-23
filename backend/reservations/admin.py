from django.contrib import admin
from .models import TableType, Reservation


@admin.register(TableType)
class TableTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'seat_word', 'min_guests', 'max_guests', 'min_table_num', 'max_table_num', 'is_active')
    prepopulated_fields = {'slug': ('name',)}
    list_filter = ('is_active',)
    search_fields = ('name', 'description')


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ('booking_code', 'name', 'phone', 'table_number', 'table_type', 'date', 'time_slot', 'guests', 'occasion', 'status', 'created_at')
    list_filter = ('date', 'time_slot', 'status', 'occasion', 'table_type')
    search_fields = ('booking_code', 'name', 'phone', 'table_number')
    date_hierarchy = 'date'
    ordering = ('-date', 'time_slot')
