from collections.abc import Callable
from typing import Literal

from factory.base import BaseFactory

FactoryType = str | type[BaseFactory] | Callable[[], type[BaseFactory]]

# See https://faker.readthedocs.io/en/master/providers.html for explanations of the providers.
type StandardProviders = Literal[
    "aba",
    "am_pm",
    "android_platform_token",
    "ascii_company_email",
    "ascii_email",
    "ascii_free_email",
    "ascii_safe_email",
    "bank_country",
    "bban",
    "binary",
    "boolean",
    "bothify",
    "bs",
    "catch_phrase",
    "century",
    "chrome",
    "color",
    "color_hsl",
    "color_hsv",
    "color_name",
    "color_rgb",
    "color_rgb_float",
    "company",
    "company_email",
    "company_suffix",
    "coordinate",
    "country_calling_code",
    "credit_card_expire",
    "credit_card_full",
    "credit_card_number",
    "credit_card_provider",
    "credit_card_security_code",
    "cryptocurrency",
    "cryptocurrency_code",
    "cryptocurrency_name",
    "csv",
    "currency",
    "currency_code",
    "currency_name",
    "currency_symbol",
    "date",
    "date_between",
    "date_between_dates",
    "date_object",
    "date_of_birth",
    "date_this_century",
    "date_this_decade",
    "date_this_month",
    "date_this_year",
    "date_time",
    "date_time_ad",
    "date_time_between",
    "date_time_between_dates",
    "date_time_this_century",
    "date_time_this_decade",
    "date_time_this_month",
    "date_time_this_year",
    "day_of_month",
    "day_of_week",
    "dga",
    "domain_name",
    "domain_word",
    "dsv",
    "ean",
    "ean8",
    "ean13",
    "email",
    "emoji",
    "enum",
    "file_extension",
    "file_name",
    "file_path",
    "firefox",
    "first_name",
    "first_name_female",
    "first_name_male",
    "first_name_nonbinary",
    "fixed_width",
    "free_email",
    "free_email_domain",
    "future_date",
    "future_datetime",
    "get_words_list",
    "hex_color",
    "hexify",
    "hostname",
    "http_method",
    "http_status_code",
    "iana_id",
    "iban",
    "image",
    "image_url",
    "internet_explorer",
    "ios_platform_token",
    "ipv4",
    "ipv4_network_class",
    "ipv4_private",
    "ipv4_public",
    "ipv6",
    "isbn10",
    "isbn13",
    "iso8601",
    "job",
    "json",
    "json_bytes",
    "language_code",
    "language_name",
    "last_name",
    "last_name_female",
    "last_name_male",
    "last_name_nonbinary",
    "latitude",
    "latlng",
    "lexify",
    "license_plate",
    "linux_platform_token",
    "linux_processor",
    "local_latlng",
    "locale",
    "localized_ean",
    "localized_ean8",
    "localized_ean13",
    "location_on_land",
    "longitude",
    "mac_address",
    "mac_platform_token",
    "mac_processor",
    "md5",
    "mime_type",
    "month",
    "month_name",
    "msisdn",
    "name",
    "name_female",
    "name_male",
    "name_nonbinary",
    "nic_handle",
    "nic_handles",
    "null_boolean",
    "numerify",
    "opera",
    "paragraph",
    "paragraphs",
    "passport_dob",
    "passport_number",
    "passport_owner",
    "password",
    "past_date",
    "past_datetime",
    "phone_number",
    "port_number",
    "prefix",
    "prefix_female",
    "prefix_male",
    "prefix_nonbinary",
    "pricetag",
    "profile",
    "psv",
    "pybool",
    "pydecimal",
    "pydict",
    "pyfloat",
    "pyint",
    "pyiterable",
    "pylist",
    "pyobject",
    "pyset",
    "pystr",
    "pystr_format",
    "pystruct",
    "pytimezone",
    "pytuple",
    "random_choices",
    "random_digit",
    "random_digit_above_two",
    "random_digit_not_null",
    "random_digit_not_null_or_empty",
    "random_digit_or_empty",
    "random_element",
    "random_elements",
    "random_int",
    "random_letter",
    "random_letters",
    "random_lowercase_letter",
    "random_number",
    "random_sample",
    "random_uppercase_letter",
    "randomize_nb_elements",
    "rgb_color",
    "rgb_css_color",
    "ripe_id",
    "safari",
    "safe_color_name",
    "safe_domain_name",
    "safe_email",
    "safe_hex_color",
    "sbn9",
    "sentence",
    "sentences",
    "sha1",
    "sha256",
    "simple_profile",
    "slug",
    "ssn",
    "suffix",
    "suffix_female",
    "suffix_male",
    "suffix_nonbinary",
    "swift",
    "swift8",
    "swift11",
    "tar",
    "text",
    "texts",
    "time",
    "time_delta",
    "time_object",
    "time_series",
    "timezone",
    "tld",
    "topic",
    "tsv",
    "unix_device",
    "unix_partition",
    "unix_time",
    "uri",
    "uri_extension",
    "uri_page",
    "uri_path",
    "url",
    "user_agent",
    "user_name",
    "uuid4",
    "vin",
    "windows_platform_token",
    "word",
    "words",
    "xml",
    "year",
    "zip",
]

# See `tests/factories/providers/__init__.py`.
type CustomProviders = Literal["p_tags"]


# See https://faker.readthedocs.io/en/master/locales/fi_FI.html for explanations of the providers.
type FIProviders = (
    StandardProviders
    | CustomProviders
    | Literal[
        "address",
        "administrative_unit",
        "building_number",
        "city",
        "city_name",
        "city_suffix",
        "company_business_id",
        "company_vat",
        "country",
        "country_code",
        "current_country",
        "current_country_code",
        "postcode",
        "state",
        "street_address",
        "street_name",
        "street_prefix",
        "street_suffix",
        "vat_id",
    ]
)

# See https://faker.readthedocs.io/en/master/locales/sv_SE.html for explanations of the providers.
type SVProviders = (
    StandardProviders
    | CustomProviders
    | Literal[
        "address",
        "administrative_unit",
        "building_number",
        "city",
        "city_name",
        "city_suffix",
        "country",
        "country_code",
        "current_country",
        "current_country_code",
        "org_and_vat_id",
        "org_id",
        "postcode",
        "state",
        "street_address",
        "street_name",
        "street_prefix",
        "street_suffix",
        "vat_id",
    ]
)

# See https://faker.readthedocs.io/en/master/locales/en_US.html for explanations of the providers.
type ENProviders = (
    StandardProviders
    | CustomProviders
    | Literal[
        "address",
        "administrative_unit",
        "basic_phone_number",
        "building_number",
        "city",
        "city_prefix",
        "city_suffix",
        "country",
        "country_code",
        "current_country",
        "current_country_code",
        "ein",
        "invalid_ssn",
        "itin",
        "military_apo",
        "military_dpo",
        "military_ship",
        "military_state",
        "passport_dates",
        "passport_full",
        "passport_gender",
        "postalcode",
        "postalcode_in_state",
        "postalcode_plus4",
        "postcode",
        "postcode_in_state",
        "secondary_address",
        "state",
        "state_abbr",
        "street_address",
        "street_name",
        "street_suffix",
        "upc_a",
        "upc_e",
        "zipcode",
        "zipcode_in_state",
        "zipcode_plus4",
    ]
)
