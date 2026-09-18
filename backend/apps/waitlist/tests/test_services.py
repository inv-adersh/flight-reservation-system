from django.test import TestCase
from django.contrib.auth.models import User
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch

from apps.bookings.tests.test_seat_hold import _make_flight_fixture
from apps.waitlist.models import WaitlistEntry, WaitlistStatus
from apps.waitlist.services import (
    join_waitlist,
    cancel_waitlist_entry,
    process_waitlist_allocations,
    WaitlistError
)
from apps.bookings.models import Booking, BookingStatus

class WaitlistServicesTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="password")
        self.flight, self.seat = _make_flight_fixture(departure_offset_days=2)
        self.seat.status = "BOOKED"
        self.seat.save()
        
        self.passengers = [
            {"name": "John Doe", "age": 30, "gender": "M"}
        ]

    def test_join_waitlist_success(self):
        entry = join_waitlist(self.user, self.flight.id, self.passengers, cabin_class="ECONOMY")
        self.assertEqual(entry.status, WaitlistStatus.PENDING)
        self.assertEqual(entry.passengers.count(), 1)

    def test_join_waitlist_flight_not_found(self):
        with self.assertRaisesMessage(WaitlistError, "Flight not found"):
            join_waitlist(self.user, 999999, self.passengers, cabin_class="ECONOMY")

    def test_join_waitlist_flight_departed(self):
        self.flight.scheduled_departure = timezone.now() - timedelta(days=1)
        self.flight.save()
        with self.assertRaisesMessage(WaitlistError, "Cannot join the waitlist for a flight that has already departed."):
            join_waitlist(self.user, self.flight.id, self.passengers, cabin_class="ECONOMY")

    def test_cancel_waitlist_entry_success(self):
        entry = join_waitlist(self.user, self.flight.id, self.passengers, cabin_class="ECONOMY")
        result = cancel_waitlist_entry(entry)
        
        entry.refresh_from_db()
        self.assertEqual(entry.status, WaitlistStatus.CANCELLED)
        self.assertEqual(result["status"], WaitlistStatus.CANCELLED)

    def test_cancel_waitlist_entry_not_pending(self):
        entry = join_waitlist(self.user, self.flight.id, self.passengers, cabin_class="ECONOMY")
        entry.status = WaitlistStatus.CONFIRMED
        entry.save()
        
        with self.assertRaisesMessage(WaitlistError, "Only pending waitlist entries can be cancelled."):
            cancel_waitlist_entry(entry)

    def test_process_waitlist_allocations_no_seats(self):
        join_waitlist(self.user, self.flight.id, self.passengers, cabin_class="ECONOMY")
        # Occupy the seat so 0 available
        self.seat.status = "BOOKED"
        self.seat.save()
        promoted_count = process_waitlist_allocations(self.flight)
        self.assertIn(promoted_count, (0, None))
