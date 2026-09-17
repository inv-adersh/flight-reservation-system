from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.analytics import services
from apps.comparison.tests.test_views import create_test_flight_instance
from apps.bookings.models import Booking, BookingStatus

User = get_user_model()


class AnalyticsServiceTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="analytics_user", email="a@test.com", password="password")
        self.inst1 = create_test_flight_instance("AN101", "JFK", "LAX", "AA")
        self.inst2 = create_test_flight_instance("AN102", "BOM", "DEL", "AI")

        # Confirmed bookings
        Booking.objects.create(
            user=self.user, flight=self.inst1, status=BookingStatus.CONFIRMED,
            seat_count=2, total_price=Decimal("500.00")
        )
        Booking.objects.create(
            user=self.user, flight=self.inst2, status=BookingStatus.CONFIRMED,
            seat_count=1, total_price=Decimal("200.00")
        )
        # Cancelled booking
        Booking.objects.create(
            user=self.user, flight=self.inst1, status=BookingStatus.CANCELLED,
            seat_count=1, total_price=Decimal("250.00")
        )

    def test_get_summary_stats_directly(self):
        summary = services.get_summary_stats()
        self.assertEqual(summary["total_bookings"], 3)
        self.assertEqual(summary["confirmed_bookings"], 2)
        self.assertEqual(summary["cancelled_bookings"], 1)
        self.assertAlmostEqual(summary["total_revenue"], 700.0, places=1)

    def test_get_monthly_revenue_directly(self):
        rev = services.get_monthly_revenue(months=6)
        self.assertIsInstance(rev, list)
        self.assertLessEqual(len(rev), 6)

    def test_get_popular_routes_directly(self):
        routes = services.get_popular_routes(top_n=5)
        self.assertIsInstance(routes, list)
        self.assertGreater(len(routes), 0)

    def test_get_flight_occupancy_directly(self):
        occ = services.get_flight_occupancy(top_n=5)
        self.assertIsInstance(occ, list)

    def test_get_peak_booking_hours_directly(self):
        hours = services.get_peak_booking_hours()
        self.assertEqual(len(hours), 24)
        total = sum(h["bookings"] for h in hours)
        self.assertEqual(total, 3)

    def test_get_airline_performance_directly(self):
        perf = services.get_airline_performance(top_n=5)
        self.assertIsInstance(perf, list)

    def test_get_aircraft_utilization_directly(self):
        util = services.get_aircraft_utilization(top_n=5)
        self.assertIsInstance(util, list)
