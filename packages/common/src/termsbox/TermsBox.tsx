import React, { type HTMLAttributes } from "react";
import { Checkbox, IconLinkExternal } from "hds-react";
import styled from "styled-components";
import Link from "next/link";
import { H6 } from "../../styled";
import { breakpoints } from "../const";

type LinkT = {
  href: string;
  text: string;
};

const Wrapper = styled.div`
  --background-color: var(--color-silver-light);
  --border-color: var(--color-bus);

  background-color: var(--background-color);
  border-top: 8px solid var(--border-color);
`;

const Content = styled.div`
  max-height: 18.75rem;
  min-height: 7.5rem;
  overflow-y: auto;
  padding: var(--spacing-m) var(--spacing-s) var(--spacing-s);

  @media (min-width: ${breakpoints.m}) {
    padding-right: var(--spacing-3-xl);
  }

  p:first-of-type {
    margin-top: 0;
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

export interface TermBoxProps extends HTMLAttributes<HTMLDivElement> {
  id?: string;
  heading?: string;
  body: string | JSX.Element;
  links?: LinkT[];
  acceptLabel?: string;
  accepted?: boolean;
  setAccepted?: (accepted: boolean) => void;
}

export function TermsBox({
  id,
  heading,
  body,
  links = [],
  acceptLabel,
  accepted,
  setAccepted,
  ...rest
}: TermBoxProps): JSX.Element {
  const canAccept = Boolean(acceptLabel) && setAccepted != null;

  return (
    <Wrapper {...rest} id={id}>
      <Content>
        {heading && (
          <H6 as="h2" $marginTop="none">
            {heading}
          </H6>
        )}
        {typeof body === "string" ? <p>{body}</p> : body}
        {links.length > 0 && (
          <LinkList>
            {links.map((link) => (
              <li key={link.href}>
                <Anchor href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.text}
                  <IconLinkExternal />
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
            onChange={() => setAccepted(!accepted)}
          />
        </Actions>
      )}
    </Wrapper>
  );
}
