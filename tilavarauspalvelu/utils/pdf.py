from __future__ import annotations

from io import BytesIO
from typing import Any

from django.template.loader import get_template
from xhtml2pdf import pisa


def render_to_pdf(template: str, **context: Any) -> bytes:
    """Render given template to a pdf"""
    result = BytesIO()
    template = get_template(template).render(context)
    pdf = pisa.pisaDocument(src=BytesIO(template.encode("UTF-8")), dest=result)
    if pdf.err:
        msg = f"Error while rendering PDF: {pdf.err}"
        raise ValueError(msg)
    return result.getvalue()
