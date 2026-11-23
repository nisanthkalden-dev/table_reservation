from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from .models import TableType, Reservation


class ReservationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.table_noir = TableType.objects.create(
            slug='indoor-noir',
            name='Indoor Noir',
            seat_word='Table',
            min_guests=2,
            max_guests=6,
            min_table_num=1,
            max_table_num=14
        )

    def test_create_reservation_single_object(self):
        url = reverse('reservation-list')
        payload = {
            "name": "Julian Casablancas",
            "phone": "+1 (555) 234-5678",
            "table_number": 5,
            "date": "2026-12-01",
            "time_slot": "7:00 PM",
            "guests": 2,
            "occasion": "Anniversary"
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], "Julian Casablancas")
        self.assertTrue(response.data['booking_code'].startswith("CINDRE-"))
        self.assertEqual(Reservation.objects.count(), 1)

    def test_create_reservation_supabase_array_format(self):
        url = reverse('supabase-reservations')
        payload = [{
            "name": "Thom Yorke",
            "phone": "+44 7700 900077",
            "table_number": 3,
            "date": "2026-12-02",
            "time_slot": "8:00 PM"
        }]
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Reservation.objects.count(), 1)
        res = Reservation.objects.first()
        self.assertEqual(res.name, "Thom Yorke")
        self.assertEqual(res.table_type, self.table_noir)

    def test_double_booking_prevention_error_code(self):
        Reservation.objects.create(
            name="Initial Guest",
            phone="1234567890",
            table_number=7,
            date="2026-12-05",
            time_slot="7:30 PM",
            table_type=self.table_noir
        )

        url = reverse('reservation-list')
        payload = [{
            "name": "Second Guest",
            "phone": "9876543210",
            "table_number": 7,
            "date": "2026-12-05",
            "time_slot": "7:30 PM"
        }]
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Should return error code 23505 which the frontend checks
        self.assertEqual(response.data.get('code'), '23505')

    def test_availability_endpoint(self):
        Reservation.objects.create(
            name="Booked Table",
            phone="1234567890",
            table_number=4,
            date="2026-12-10",
            time_slot="6:00 PM",
            table_type=self.table_noir
        )

        url = reverse('reservation-availability')
        response = self.client.get(url, {'date': '2026-12-10'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['booked_reservations']), 1)
        self.assertEqual(response.data['booked_reservations'][0]['table_number'], 4)
