from django.core.management.base import BaseCommand
from reservations.models import TableType


INITIAL_TABLES = [
    {
        'slug': 'indoor-noir',
        'name': 'Indoor Noir',
        'min_guests': 2,
        'max_guests': 6,
        'seat_word': 'Table',
        'description': 'Candlelit and close to the pass, beneath a charcoal-plastered ceiling.',
        'image_url': '/assets/images/indoor-noir.jpg',
        'min_table_num': 1,
        'max_table_num': 14,
    },
    {
        'slug': 'chefs-counter',
        'name': "Chef's Counter",
        'min_guests': 1,
        'max_guests': 2,
        'seat_word': 'Seat',
        'description': 'Eight seats, one flame — tasting menu only, three-hour seating.',
        'image_url': '/assets/images/chefs-counter.jpg',
        'min_table_num': 1,
        'max_table_num': 8,
    },
    {
        'slug': 'garden-terrace',
        'name': 'Garden Terrace',
        'min_guests': 2,
        'max_guests': 8,
        'seat_word': 'Table',
        'description': 'Open air beneath olive trees and hanging lanterns.',
        'image_url': '/assets/images/garden-terrace.jpg',
        'min_table_num': 15,
        'max_table_num': 24,
    },
    {
        'slug': 'rooftop-private',
        'name': 'Rooftop Private',
        'min_guests': 4,
        'max_guests': 12,
        'seat_word': 'Room',
        'description': 'A glass-enclosed room above the city, held entirely for your party.',
        'image_url': '/assets/images/rooftop-private.jpg',
        'min_table_num': 25,
        'max_table_num': 28,
    },
]


class Command(BaseCommand):
    help = 'Seeds initial seating environments into database'

    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0
        for item in INITIAL_TABLES:
            obj, created = TableType.objects.update_or_create(
                slug=item['slug'],
                defaults=item
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded tables: {created_count} created, {updated_count} updated."
            )
        )
