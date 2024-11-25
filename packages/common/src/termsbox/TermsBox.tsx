import { Checkbox, IconLinkExternal } from "hds-react";
import React from "react";
import styled from "styled-components";
import { breakpoints } from "../common/style";
import { H6 } from "../common/typography";
import Link from "next/link";

type LinkT = {
  href: string;
  text: string;
};

export type Props = {
  id?: string;
  heading?: string;
  body?: string | JSX.Element;
  links?: LinkT[];
  acceptLabel?: string;
  accepted?: boolean;
  setAccepted?: (accepted: boolean) => void;
} & React.HTMLAttributes<HTMLDivElement>;

const Wrapper = styled.div`
  --background-color: var(--color-silver-light);
  --border-color: var(--color-bus);
  --margin-bottom-desktop: var(--spacing-layout-m);
  --margin-bottom-mobile: var(--spacing-l);

  background-color: var(--background-color);
  border-top: 8px solid var(--border-color);
  font-size: var(--fontsize-body-m);
  margin-bottom: var(--margin-bottom-mobile);

  @media (min-width: ${breakpoints.m}) {
    margin-bottom: var(--margin-bottom-desktop);
  }
`;

const Content = styled.div`
  max-height: 18.75rem;
  min-height: 7.5rem;
  overflow-y: auto;
  white-space: pre-line;
  padding: var(--spacing-m) var(--spacing-s) var(--spacing-s);
  line-height: var(--lineheight-l);

  @media (min-width: ${breakpoints.m}) {
    padding-right: var(--spacing-3-xl);
  }
`;

const LinkList = styled.ul`
  list-style: none;
  margin-bottom: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2-xs);
`;

const Anchor = styled(Link)`
  color: var(--color-black);
  text-decoration: underline;
  display: inline-flex;
  gap: var(--spacing-2-xs);

  svg {
    min-width: var(--spacing-m);
  }
`;

const Actions = styled.div`
  padding: 0 var(--spacing-s) var(--spacing-s);
`;

const Divider = styled.hr`
  margin-top: 0;
  margin-bottom: var(--spacing-s);
`;

const StyledCheckbox = styled(Checkbox)`
  --lineheight-m: var(--lineheight-l);

  label {
    user-select: none;
  }
`;

function TermsBox({
  id,
  heading,
  body,
  links,
  acceptLabel,
  accepted,
  setAccepted,
  ...rest
}: Props): JSX.Element {
  const canAccept = Boolean(acceptLabel) && Boolean(setAccepted);

  return (
    <Wrapper {...rest} id={id}>
      <Content>
        {heading && (
          <H6 as="h2" $marginTop="none">
            {heading}
          </H6>
        )}
        {typeof body === "string" ? <p>{body}</p> : body}
        {links && links?.length > 0 && (
          <LinkList>
            {links.map((link) => (
              <li key={link.href}>
                <Anchor
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.text}
                  <IconLinkExternal aria-hidden />
                </Anchor>
              </li>
            ))}
          </LinkList>
        )}
      </Content>
      {canAccept && (
        <Actions>
          <Divider />
          <StyledCheckbox
            id={`${id}-terms-accepted`}
            data-testid="terms-box__checkbox--accept-terms"
            label={acceptLabel}
            checked={accepted}
            onChange={() => setAccepted && setAccepted(!accepted)}
          />
        </Actions>
      )}
    </Wrapper>
  );
}

export default TermsBox;
