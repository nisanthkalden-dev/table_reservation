from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class TableType(models.Model):
    """
    Seating experience categories:
    - indoor-noir: Indoor Noir (2-6 guests, table numbers 1-14)
    - chefs-counter: Chef's Counter (1-2 guests, seat numbers 1-8)
    - garden-terrace: Garden Terrace (2-8 guests, table numbers 15-24)
    - rooftop-private: Rooftop Private (4-12 guests, room numbers 25-28)
    """
    slug = models.SlugField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    seat_word = models.CharField(max_length=50, default='Table')  # Table, Seat, Room
    min_guests = models.PositiveIntegerField(default=1)
    max_guests = models.PositiveIntegerField(default=10)
    description = models.TextField(blank=True)
    image_url = models.CharField(max_length=255, blank=True)
    min_table_num = models.PositiveIntegerField(default=1)
    max_table_num = models.PositiveIntegerField(default=30)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.seat_word} {self.min_table_num}-{self.max_table_num})"


class Reservation(models.Model):
    OCCASION_CHOICES = [
        ('None in particular', 'None in particular'),
        ('Anniversary', 'Anniversary'),
        ('Birthday', 'Birthday'),
        ('Proposal', 'Proposal'),
        ('Business Dinner', 'Business Dinner'),
        ('Other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
        ('no-show', 'No-show'),
    ]

    # Fields matching frontend expectations:
    # name, phone, table_number, date, time_slot
    booking_code = models.CharField(max_length=32, unique=True, blank=True, db_index=True)
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=50)
    table_type = models.ForeignKey(
        TableType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reservations'
    )
    table_number = models.PositiveIntegerField()
    date = models.DateField(db_index=True)
    time_slot = models.CharField(max_length=20, db_index=True)
    guests = models.PositiveIntegerField(
        default=2,
        validators=[MinValueValidator(1), MaxValueValidator(20)]
    )
    occasion = models.CharField(
        max_length=100,
        choices=OCCASION_CHOICES,
        default='None in particular'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='confirmed'
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', 'time_slot']
        # Unique constraint to prevent double-booking the exact table on the same date and time slot
        constraints = [
            models.UniqueConstraint(
                fields=['table_number', 'date', 'time_slot'],
                name='unique_table_reservation_slot'
            )
        ]

    def __str__(self):
        return f"{self.booking_code or self.id} - {self.name} (Table #{self.table_number} on {self.date} at {self.time_slot})"
