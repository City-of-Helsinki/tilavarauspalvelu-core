import React from "react";
import sanitizeHtml from "sanitize-html";
import styled from "styled-components";

type Props = {
  html: string;
};

const StyledContent = styled.div`
  word-break: break-word;
  p:empty {
    display: none;
  }

  /* old data has extra line-breaks instead of just using <p> */
  p br {
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

const config = {
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

  return (
    <StyledContent
      dangerouslySetInnerHTML={{
        __html: sanitizeHtml(html, config),
      }}
    />
  );
}
