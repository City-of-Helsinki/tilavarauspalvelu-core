import React from "react";
import sanitizeHtml from "sanitize-html";

type Props = {
  html: string;
};

const config = {
  allowedTags: ["ol", "ul", "li", "b", "i", "p", "em", "strong", "a", "br"],
  allowedAttributes: {
    a: ["href"],
  },
};
const Sanitize = ({ html }: Props): JSX.Element | null =>
  html ? (
    <div
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        // eslint-disable-next-line @typescript-eslint/naming-convention
        __html: sanitizeHtml(html, config),
      }}
    />
  ) : null;

export default Sanitize;
