#/bin/sh
curl http://localhost:8000/v1/application_round/?format=json -o fixtures/v1/application_round.json
curl http://localhost:8000/v1/application_round/1/?format=json -o fixtures/v1/application_round_1.json
curl http://localhost:8000/v1/reservation_unit/?format=json -o fixtures/v1/reservation_unit.json
curl http://localhost:8000/v1/parameters/reservation_unit_type/?format=json -o fixtures/v1/parameters/reservation_unit_type.json
curl http://localhost:8000/v1/parameters/ability_group/?format=json -o fixtures/v1/parameters/ability_group.json
curl http://localhost:8000/v1/parameters/age_group/?format=json -o fixtures/v1/parameters/age_group.json
curl http://localhost:8000/v1/parameters/purpose/?format=json -o fixtures/v1/parameters/purpose.json
curl http://localhost:8000/v1/parameters/city/?format=json -o fixtures/v1/parameters/city.json
curl http://localhost:8000/v1/reservation_unit/2/?format=json -o fixtures/v1/reservation_unit/2.json
