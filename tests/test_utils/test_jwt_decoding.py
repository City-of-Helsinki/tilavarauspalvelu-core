from __future__ import annotations

from tilavarauspalvelu.integrations.helauth.utils import get_jwt_payload


def test_get_jwt_payload():
    encoded_payload = (
        "eyJpc3MiOiJodHRwczovL3R1bm5pc3RhbW8udGVzdC5oZWwubmluamEvb3BlbmlkIiwic3ViIj"
        "oiMjgxNmQ3NmEtNGI3Mi00NTJmLThlZmYtZGUzNWY1YzIwNjJlIiwiYXVkIjoidGlsYXZhcmF1c"
        "y10ZXN0IiwiZXhwIjoxNjk5NTM0MjM3LCJpYXQiOjE2OTk1MzM2MzcsImF1dGhfdGltZSI6MTY5"
        "OTUzMzYzNiwibm9uY2UiOiJTSjBaejlwQ2JJWmRNdjgzZ1FSbUJRek5HamNDMkE5dDBWTHgwMkl"
        "QOWI0aEhTQk83VFc0R0RkMW9Yb1htbGdpIiwiYXRfaGFzaCI6IlRod0xDeU5KbmUxZG9GNXA0NC"
        "01X3ciLCJlbWFpbCI6ImRlc2FkYTIzNTNAc2Flb2lsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjpmY"
        "WxzZSwiYWRfZ3JvdXBzIjpbXSwiYXpwIjoidGlsYXZhcmF1cy10ZXN0Iiwic2lkIjoiZTdlYWUx"
        "MWQtNWFlYi00ZmQ3LWE5MWMtYzQzNjQ3NjllNDBlIiwiYW1yIjoiaGVsdHVubmlzdHVzc3VvbWl"
        "maSIsImxvYSI6InN1YnN0YW50aWFsIn0"
    )
    payload = get_jwt_payload(f"foo.{encoded_payload}.bar")
    assert payload == {
        "ad_groups": [],
        "amr": "heltunnistussuomifi",
        "at_hash": "ThwLCyNJne1doF5p44-5_w",
        "aud": "tilavaraus-test",
        "auth_time": 1699533636,
        "azp": "tilavaraus-test",
        "email": "desada2353@saeoil.com",
        "email_verified": False,
        "exp": 1699534237,
        "iat": 1699533637,
        "iss": "https://tunnistamo.test.hel.ninja/openid",
        "loa": "substantial",
        "nonce": "SJ0Zz9pCbIZdMv83gQRmBQzNGjcC2A9t0VLx02IP9b4hHSBO7TW4GDd1oXoXmlgi",
        "sid": "e7eae11d-5aeb-4fd7-a91c-c4364769e40e",
        "sub": "2816d76a-4b72-452f-8eff-de35f5c2062e",
    }
