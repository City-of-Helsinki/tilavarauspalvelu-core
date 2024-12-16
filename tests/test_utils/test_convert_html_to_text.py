from __future__ import annotations

from tilavarauspalvelu.integrations.email.template_context.common import create_anchor_tag
from utils.utils import convert_html_to_text


def test_convert_html_to_text__simple_paragraphs():
    html = "<p>Foo</p><p>Bar</p>"
    text = "Foo\n\nBar"

    assert convert_html_to_text(html) == text


def test_convert_html_to_text__anchor__same_text_and_link():
    link = "https://foo.bar"
    html = f"<p>Foo {create_anchor_tag(link=link, text=link)}</p>"
    text = f"Foo {link}"

    assert convert_html_to_text(html) == text


def test_convert_html_to_text__anchor__different_text_and_link():
    link = "http://foo.bar"
    html = f"<p>{create_anchor_tag(link=link, text='Bar')}</p>"
    text = f"Bar <{link}>"

    assert convert_html_to_text(html) == text


def test_convert_html_to_text__anchor__different_and_same_combined():
    link = "https://foo.bar"
    html = f"<p>Foo {create_anchor_tag(link=link, text=link)}</p><p>{create_anchor_tag(link=link, text='Bar')}</p>"
    text = f"Foo {link}\n\nBar <{link}>"

    assert convert_html_to_text(html) == text


def test_convert_html_to_text__anchor__space_added_between_link_and_dot():
    link = "https://foo.bar"
    html = f"<p>Foo {create_anchor_tag(link=link, text=link)}.</p>"
    text = f"Foo {link} ."  # Dot would be directly after the link. Add a space.

    assert convert_html_to_text(html) == text


def test_convert_html_to_text__anchor__space_not_added_between_link_and_dot():
    link = "https://foo.bar"
    html = f"<p>{create_anchor_tag(link=link, text='Bar')}.</p>"
    text = f"Bar <{link}>."  # Dot would be after angle-brackets. No space needed.

    assert convert_html_to_text(html) == text
