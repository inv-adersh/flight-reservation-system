from django.test import TestCase
from apps.comparison.services import ComparisonService
from apps.comparison.tests.test_views import create_test_flight_instance


class ComparisonServiceTests(TestCase):

    def setUp(self):
        self.inst1 = create_test_flight_instance("FL101", "JFK", "LAX", "AA")
        self.inst2 = create_test_flight_instance("FL102", "JFK", "LAX", "UA")

    def test_build_comparison_data_structure(self):
        instances = [self.inst1, self.inst2]
        data = ComparisonService.build_comparison_data(instances)

        self.assertEqual(len(data), 2)
        item1 = data[0]
        self.assertEqual(item1["flight_instance_id"], self.inst1.id)
        self.assertEqual(item1["flight_number"], "FL101")
        self.assertEqual(item1["airline_code"], "AA")
        self.assertIn("fares", item1)
        self.assertIn("seat_availability", item1)
        self.assertIn("fare_prediction_direction", item1)
        self.assertGreaterEqual(item1["travel_time_minutes"], 0)
