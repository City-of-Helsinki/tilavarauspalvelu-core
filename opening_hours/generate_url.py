import hashlib
import hmac
import urllib.parse

secret_key = (
    "d94c278085e49e807b67a58b8fcb92239b3fe881252"
    "f1938e3e0ca09611684b3790df3a22c08a32959309f"
    "dfcf074b4204c2f84a1ef03025621c4cf23a5521f24"
    "299ba857956a1fcf1b61715cb8154baeedba4e0409e"
    "636da9e91d7a618a4403e748c3a2"
)

get_parameters_string = "hsa_source=tprek&hsa_username=liikunnan+p%C3%A4%C3%A4k%C3%A4ytt%C3%A4j%C3%A4&hsa_organization=tprek%3Aa1a3a5ea-39bd-482b-b90d-7dfc436c3afb&hsa_resource=tprek%3A570467&hsa_created_at=2020-10-01T06%3A35%3A00.917Z&hsa_valid_until=2020-10-01T06%3A45%3A00.917Z&hsa_signature=3852119bcdc666da8092b041c1245bcd1ff695df8d1c66dcfdb4e68cfe0ca3f3"

payload = dict(urllib.parse.parse_qsl(get_parameters_string))

data_fields = [
    "hsa_source",
    "hsa_username",
    "hsa_created_at",
    "hsa_valid_until",
    "hsa_organization",
    "hsa_resource",
    "hsa_has_organization_rights",
]

data_string = "".join([payload[field] for field in data_fields if field in payload])

payload_signature = payload["hsa_signature"]

calculated_signature = hmac.new(
    key=secret_key.encode("utf-8"),
    msg=data_string.encode("utf-8"),
    digestmod=hashlib.sha256,
).hexdigest()

print("Payload sig   : ", payload_signature)
print("Calculated sig: ", calculated_signature)

if hmac.compare_digest(payload_signature, calculated_signature):
    print("Payload ok")
else:
    print("Invalid payload")
