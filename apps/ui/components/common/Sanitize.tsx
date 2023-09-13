import React from "react";
import sanitizeHtml from "sanitize-html";
import styled from "styled-components";

type Props = {
  html: string;
  style?: React.CSSProperties;
};

const StyledContent = styled.div`
  p {
    margin-block-start: 0;
    margin-block-end: 0;
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
  allowedTags: ["p", "strong", "a", "br"],
  allowedAttributes: {
    a: ["href", "target", "rel"],
  },
};

const Sanitize = ({ html, style }: Props): JSX.Element | null =>
  html ? (
    <StyledContent
      style={style}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        // eslint-disable-next-line @typescript-eslint/naming-convention
        __html: sanitizeHtml(html, config),
      }}
    />
  ) : null;

export default Sanitize;
