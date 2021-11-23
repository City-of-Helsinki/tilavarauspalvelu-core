from base64 import b32encode
from struct import pack
from time import time
from typing import Optional


def generate_order_number(timestamp: Optional[float] = None) -> str:
    """
    Creates an order number based on the given timestamp.
    The order number scheme is originally from Respa.
    """
    if timestamp is None:
        timestamp = time()
    timestamp_bytes = pack(">Q", int(timestamp * 1_000_000)).lstrip(b"\x00")
    b32 = b32encode(timestamp_bytes).strip(b"=").lower()
    return b32.decode("utf8")
