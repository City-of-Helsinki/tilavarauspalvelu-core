import io
from typing import TYPE_CHECKING

import pytest
from pypdf import PdfReader
from rest_framework.reverse import reverse

from tests.factories import TermsOfUseFactory
from tilavarauspalvelu.enums import TermsOfUseTypeChoices

if TYPE_CHECKING:
    from django.http import FileResponse, JsonResponse

pytestmark = [
    pytest.mark.django_db,
]


def test_terms_pdf(api_client):
    TermsOfUseFactory.create(
        id="booking",
        name_fi="Test Terms of Use",
        name_en="Test Terms of Use English",
        name_sv="Test Terms of Use Swedish",
        text_fi="Test Terms of Use text",
        text_en="Test Terms of Use text English",
        text_sv="Test Terms of Use text Swedish",
        terms_type=TermsOfUseTypeChoices.GENERIC,
    )

    url = reverse("terms_of_use_pdf")

    response: FileResponse = api_client.get(url)

    assert response.status_code == 200
    assert response.headers["Content-Type"] == "application/pdf"
    assert response.headers["Content-Disposition"] == (
        'attachment; filename="Tilavarauspalvelu_yleiset_sopimusehdot.pdf"'
    )

    content = io.BytesIO(b"".join(response.streaming_content))
    pdf = PdfReader(content)

    assert len(pdf.pages) == 3

    assert "Test Terms of Use text" in pdf.pages[0].extract_text()
    assert "Test Terms of Use text Swedish" in pdf.pages[1].extract_text()
    assert "Test Terms of Use text English" in pdf.pages[2].extract_text()


def test_terms_pdf__not_as_attachment(api_client):
    TermsOfUseFactory.create(
        id="booking",
        name_fi="Test Terms of Use",
        name_en="Test Terms of Use English",
        name_sv="Test Terms of Use Swedish",
        text_fi="Test Terms of Use text",
        text_en="Test Terms of Use text English",
        text_sv="Test Terms of Use text Swedish",
        terms_type=TermsOfUseTypeChoices.GENERIC,
    )

    url = reverse("terms_of_use_pdf") + "?as_attachment=False"

    response: FileResponse = api_client.get(url)

    assert response.status_code == 200
    assert response.headers["Content-Disposition"] == 'inline; filename="Tilavarauspalvelu_yleiset_sopimusehdot.pdf"'

    content = io.BytesIO(b"".join(response.streaming_content))
    pdf = PdfReader(content)

    assert len(pdf.pages) == 3

    assert "Test Terms of Use text" in pdf.pages[0].extract_text()
    assert "Test Terms of Use text Swedish" in pdf.pages[1].extract_text()
    assert "Test Terms of Use text English" in pdf.pages[2].extract_text()


def test_terms_pdf__missing_terms(api_client):
    url = reverse("terms_of_use_pdf")

    response: JsonResponse = api_client.get(url)

    assert response.status_code == 404
    assert response.json() == {"detail": "Terms of use with ID 'booking' not found"}
