from rest_framework.test import APITestCase
from rest_framework import status
from apps.comparison.tests.test_views import create_test_flight_instance


class FarePredictionViewTests(APITestCase):

    def setUp(self):
        self.instance = create_test_flight_instance("FP101", "JFK", "LAX", "AA")
        self.url = f"/api/fare-prediction/{self.instance.id}/"

    def test_get_fare_prediction_default_economy_success(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["flight_instance_id"], self.instance.id)
        self.assertEqual(res.data["cabin_class"], "ECONOMY")
        self.assertIn("direction", res.data)
        self.assertIn("confidence", res.data)

    def test_get_fare_prediction_business_cabin_success(self):
        res = self.client.get(self.url, {"cabin_class": "BUSINESS"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["cabin_class"], "BUSINESS")

    def test_get_fare_prediction_invalid_cabin_class_fails(self):
        res = self.client.get(self.url, {"cabin_class": "INVALID_CLASS"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", res.data)

    def test_get_fare_prediction_non_existent_instance_id_404(self):
        url_404 = "/api/fare-prediction/999999/"
        res = self.client.get(url_404)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("error", res.data)
