from __future__ import annotations


class VerkkokauppaError(Exception):
    pass


class VerkkokauppaConfigurationError(VerkkokauppaError):
    def __init__(self) -> None:
        super().__init__(
            "One or more Verkkokauppa setting is missing. Check environment variables with VERKKOKAUPPA_* prefix"
        )


class UnsupportedMetaKeyError(VerkkokauppaError):
    pass
