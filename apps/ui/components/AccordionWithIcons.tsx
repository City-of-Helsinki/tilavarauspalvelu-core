import React, { useEffect, useRef } from "react";
import { IconAngleDown, IconAngleUp, useAccordion } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { Flex, toggleButtonCss, truncatedText } from "common/styled";
import { breakpoints } from "common/src/const";

type Props = {
  heading: string;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  initiallyOpen?: boolean;
  children: React.ReactNode;
  icons?: Array<{
    text: string;
    textPostfix?: string;
    icon: React.ReactNode;
  }>;
  id?: string;
  shouldScrollIntoView?: boolean;
};

const Heading = styled.h2<{ as: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" }>`
  grid-column: 1 / -2;
  padding: 0;
  margin: 0;
`;

const ClosedAccordionWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: var(--spacing-s);

  background-color: var(--color-black-10);
  padding: var(--spacing-m);
  @media (min-width: ${breakpoints.m}) {
    padding: var(--spacing-l);
  }
`;

const IconListWrapper = styled.ul`
  display: grid;
  gap: var(--spacing-xs);
  padding: 0;
  margin: 0;

  grid-row: subgrid;
  grid-column: 1 / -1;
  grid-template-columns: auto;
  @media (min-width: ${breakpoints.m}) {
    gap: var(--spacing-s);
    grid-template-columns: auto 1fr 2fr;
  }
`;

const ButtonListWrapper = styled.div`
  display: grid;
  gap: var(--spacing-s);
  align-self: center;
  align-items: end;
  justify-content: end;

  @media (min-width: ${breakpoints.s}) {
    grid-column-start: -1;
    grid-row: 1 / span 2;
  }
  & > button:last-child > span {
    display: none;
  }
  @media (min-width: ${breakpoints.s}) {
    & > button:last-child > span {
      display: inline;
    }
  }
`;

const IconLabel = styled(Flex).attrs({
  $gap: "xs",
  $alignItems: "center",
  $direction: "row",
})`
  /* truncate the first child span while not touch the postfix */
  min-width: 0;
  max-width: 100%;
  span {
    ${truncatedText}
  }
  span:last-child {
    flex-shrink: 0;
  }

  > svg {
    flex-shrink: 0;
  }
`;

const Content = styled.div<{ $open: boolean }>`
  display: ${({ $open }) => ($open ? "block" : "none")};
`;

const ToggleButton = styled.button`
  ${toggleButtonCss}
`;

/// Stylistically different from regular Accordion
/// Regular accordion uses the card title as a button to open/close the card
/// and has no options for other content inside the accordion.
/// Includes internal state
export function AccordionWithIcons({
  heading,
  headingLevel = 2,
  initiallyOpen = false,
  icons = [],
  children,
  shouldScrollIntoView,
  ...rest
}: Props): JSX.Element {
  const { isOpen, openAccordion, closeAccordion } = useAccordion({
    initiallyOpen,
  });
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldScrollIntoView && ref.current) {
      ref.current.scrollIntoView();
    }
  }, [shouldScrollIntoView]);

  const handleToggle = () => {
    if (isOpen) {
      closeAccordion();
    } else {
      openAccordion();
    }
  };

  return (
    <div {...rest} ref={ref}>
      <ClosedAccordionWrapper>
        <Heading as={`h${headingLevel}`}>{heading}</Heading>
        <IconListWrapper>
          {icons.map(({ text, icon, textPostfix }) => (
            <IconLabel key={text} as="li">
              {icon}
              <span>{text}</span>
              <span>{textPostfix}</span>
            </IconLabel>
          ))}
        </IconListWrapper>
        <ButtonListWrapper>
          <ToggleButton
            onClick={handleToggle}
            // we are hiding the text on mobile
            aria-label={isOpen ? t("common:close") : t("common:show")}
          >
            {isOpen ? <IconAngleUp aria-hidden /> : <IconAngleDown aria-hidden />}
            {isOpen ? t("common:close") : t("common:show")}
          </ToggleButton>
        </ButtonListWrapper>
      </ClosedAccordionWrapper>
      <Content $open={isOpen}>{children}</Content>
    </div>
  );
}
