import { Checkbox, IconLinkExternal } from "hds-react";
import React from "react";
import styled from "styled-components";
import { breakpoints } from "../common/style";
import { H6 } from "../common/typography";

type Link = {
  href: string;
  text: string;
};

export type Props = {
  id?: string;
  heading: string;
  body?: string | JSX.Element;
  links?: Link[];
  acceptLabel?: string;
  accepted?: boolean;
  setAccepted?: (accepted: boolean) => void;
};

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

const Heading = styled(H6)`
  margin-top: 0;
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

const Links = styled.ul`
  list-style: none;
  margin-bottom: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2-xs);
`;

const Link = styled.li``;

const Anchor = styled.a`
  color: var(--color-black) !important;
  text-decoration: underline;
  display: flex;
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

const TermsBox = ({
  id,
  heading,
  body,
  links,
  acceptLabel,
  accepted,
  setAccepted,
  ...rest
}: Props): JSX.Element => {
  const canAccept = Boolean(acceptLabel) && Boolean(setAccepted);

  return (
    <Wrapper {...rest}>
      <Content>
        <Heading>{heading}</Heading>
        <p>{body}</p>
        {links?.length > 0 && (
          <Links>
            {links.map((link) => (
              <Link key={link.href}>
                <Anchor
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.text}
                  <IconLinkExternal aria-hidden />
                </Anchor>
              </Link>
            ))}
          </Links>
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
};

export default TermsBox;
