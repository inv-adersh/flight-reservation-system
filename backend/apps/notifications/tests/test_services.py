from django.test import TestCase
from django.core import mail
from django.contrib.auth import get_user_model
from apps.bookings.tests.test_seat_hold import _make_flight_fixture
from apps.bookings.models import Booking, BookingStatus
from apps.notifications.models import Notification, NotificationType
from apps.notifications.services import NotificationService
from datetime import timedelta
from django.utils import timezone
import threading

User = get_user_model()

class NotificationServiceTests(TestCase):
    def setUp(self):
        # Run threads synchronously for testing
        self.original_thread_start = threading.Thread.start
        threading.Thread.start = threading.Thread.run

        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123',
            first_name='Test'
        )
        self.flight, self.seat = _make_flight_fixture(departure_offset_days=2)
        self.booking = Booking.objects.create(
            user=self.user,
            flight=self.flight,
            status=BookingStatus.CONFIRMED,
            seat_count=1,
            total_price=self.flight.fares.first().price if self.flight.fares.exists() else 5000
        )

    def tearDown(self):
        threading.Thread.start = self.original_thread_start

    def test_send_booking_confirmation(self):
        NotificationService.send_booking_confirmation(self.booking)
        self.assertEqual(Notification.objects.count(), 1)
        notif = Notification.objects.first()
        self.assertEqual(notif.notification_type, NotificationType.BOOKING_CONFIRMED)
        self.assertEqual(notif.user, self.user)
        self.assertEqual(len(mail.outbox), 1)

    def test_send_booking_cancellation(self):
        NotificationService.send_booking_cancellation(self.booking)
        self.assertEqual(Notification.objects.count(), 1)
        notif = Notification.objects.first()
        self.assertEqual(notif.notification_type, NotificationType.BOOKING_CANCELLED)
        self.assertEqual(len(mail.outbox), 1)

    def test_send_waitlist_allocation(self):
        NotificationService.send_waitlist_allocation(self.booking)
        self.assertEqual(Notification.objects.count(), 1)
        notif = Notification.objects.first()
        self.assertEqual(notif.notification_type, NotificationType.WAITLIST_ALLOCATED)
        self.assertEqual(len(mail.outbox), 1)

    def test_send_flight_cancellation(self):
        NotificationService.send_flight_cancellation(self.flight)
        self.assertEqual(Notification.objects.count(), 1)
        notif = Notification.objects.first()
        self.assertEqual(notif.notification_type, NotificationType.FLIGHT_CANCELLED)
        self.assertEqual(len(mail.outbox), 1)
