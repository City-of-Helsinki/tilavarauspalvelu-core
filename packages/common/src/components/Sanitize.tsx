import React from "react";
import sanitizeHtml from "sanitize-html";
import styled from "styled-components";

type Props = {
  html: string;
};

const StyledContent = styled.div`
  word-break: normal;
  overflow-wrap: anywhere;
  p:empty {
    display: none;
  }
  a {
    text-decoration: underline;
    color: var(--tilavaraus-link-color);
    :visited {
      color: var(--tilavaraus-link-visited-color);
    }
  }
`;

/// Remove unwanted tags from content
/// Turns all empty content (even with empty tags) to empty string
export function cleanHtmlContent(html: string): string {
  if (html === "") {
    return "";
  }
  if (sanitizeHtml(html, { allowedTags: [] }) === "") {
    return "";
  }
  return sanitizeHtml(html, sanitizeConfig);
}

const sanitizeConfig = {
  allowedTags: [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "br",
    "div",
    "span",
    "ol",
    "ul",
    "li",
    "strong",
    "em",
    "u",
    "a",
    "pre",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    "*": ["style"],
  },
};

export function Sanitize({ html }: Props): JSX.Element | null {
  if (!html) {
    return null;
  }

  // disallow empty HTML content e.g. <p></p> or <p><br></p>
  if (sanitizeHtml(html, { allowedTags: [] }).length === 0) {
    return null;
  }

  return (
    <StyledContent
      /* oxlint-disable-next-line react/no-danger */
      dangerouslySetInnerHTML={{
        __html: sanitizeHtml(html, sanitizeConfig),
      }}
    />
  );
}
