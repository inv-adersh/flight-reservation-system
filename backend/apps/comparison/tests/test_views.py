from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status

from apps.flights.models import (
    Country, Airport, Airline, AircraftModel, Aircraft,
    FlightRoute, FlightLeg, FlightInstance, Fare, Seat, CabinClass, SeatStatus
)


def create_test_flight_instance(flight_no, src_code="JFK", dst_code="LAX", iata_airline="AA"):
    country, _ = Country.objects.get_or_create(name="United States", iso_code="US")
    src_airport, _ = Airport.objects.get_or_create(
        iata_code=src_code, airport_name=f"{src_code} Airport", city=src_code, country=country
    )
    dst_airport, _ = Airport.objects.get_or_create(
        iata_code=dst_code, airport_name=f"{dst_code} Airport", city=dst_code, country=country
    )
    airline, _ = Airline.objects.get_or_create(
        iata_airline_code=iata_airline, airline_name=f"Airline {iata_airline}"
    )
    ac_model, _ = AircraftModel.objects.get_or_create(manufacturer="Boeing", model_name="737-800")
    aircraft, _ = Aircraft.objects.get_or_create(
        registration=f"N-{flight_no}", airline=airline, aircraft_model=ac_model
    )
    route = FlightRoute.objects.create(flight_no=flight_no, airline=airline, aircraft=aircraft)
    FlightLeg.objects.create(
        flight=route, leg_order=1, departure_airport=src_airport, arrival_airport=dst_airport
    )

    dep = timezone.now() + timedelta(days=1)
    arr = dep + timedelta(hours=5)
    instance = FlightInstance.objects.create(
        flight=route, date=dep.date(), aircraft=aircraft, scheduled_departure=dep, scheduled_arrival=arr
    )
    Fare.objects.create(
        flight_instance=instance, fare_code="ECO_STD", cabin_class=CabinClass.ECONOMY, price=Decimal("250.00")
    )
    Seat.objects.create(
        flight_instance=instance, seat_number="1A", seat_class=CabinClass.ECONOMY, status=SeatStatus.AVAILABLE
    )
    return instance


class FlightCompareViewTests(APITestCase):

    def setUp(self):
        self.url = "/api/comparison/compare/"
        self.inst1 = create_test_flight_instance("FL101", "JFK", "LAX", "AA")
        self.inst2 = create_test_flight_instance("FL102", "JFK", "LAX", "UA")
        self.inst3 = create_test_flight_instance("FL103", "JFK", "LAX", "DL")

    def test_compare_valid_instances_success(self):
        payload = {"flight_instance_ids": [self.inst1.id, self.inst2.id]}
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)
        ids = [item["flight_instance_id"] for item in res.data]
        self.assertIn(self.inst1.id, ids)
        self.assertIn(self.inst2.id, ids)

    def test_compare_invalid_less_than_two_ids(self):
        payload = {"flight_instance_ids": [self.inst1.id]}
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("flight_instance_ids", res.data["errors"])

    def test_compare_invalid_duplicate_ids(self):
        payload = {"flight_instance_ids": [self.inst1.id, self.inst1.id]}
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("flight_instance_ids", res.data["errors"])

    def test_compare_non_existent_instance_id(self):
        payload = {"flight_instance_ids": [self.inst1.id, 99999]}
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("flight_instance_ids", res.data["errors"])

    def test_compare_mismatched_origin_destination_fails(self):
        inst_diff = create_test_flight_instance("FL200", "BOM", "DEL", "AI")
        payload = {"flight_instance_ids": [self.inst1.id, inst_diff.id]}
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("flight_instance_ids", res.data["errors"])
