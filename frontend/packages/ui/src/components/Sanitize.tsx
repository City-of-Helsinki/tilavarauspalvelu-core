import React from "react";
import sanitizeHtml from "sanitize-html";
import styled from "styled-components";
import { sanitizeConfig } from "@ui/modules/helpers";

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
