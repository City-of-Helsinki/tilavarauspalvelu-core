import React from "react";
import sanitizeHtml from "sanitize-html";

type Props = {
  html: string;
};

const config = {
  allowedTags: ["ol", "ul", "li", "b", "i", "p", "em", "strong", "a", "br"],
  allowedAttributes: {
    a: ["href", "target", "rel"],
  },
};
const Sanitize = ({ html }: Props): JSX.Element | null =>
  html ? (
    <span
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        // eslint-disable-next-line @typescript-eslint/naming-convention
        __html: sanitizeHtml(html, config),
      }}
    />
  ) : null;

export default Sanitize;
