import React, { useEffect, useState } from "react";
import { IconAngleDown, IconAngleUp, useAccordion } from "hds-react";
import styled from "styled-components";
import { H4 } from "common/styled";

type Theme = "default" | "thin";

type Props = {
  heading: string;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  open?: boolean;
  children: React.ReactNode;
  onToggle?: () => void;
  id?: string;
  theme?: Theme;
  disableBottomMargin?: boolean;
};

// TODO should we remove the padding all together? having both seems really silly
const AccordionElement = styled.div<{ $noBottomMargin?: boolean }>`
  padding-bottom: var(--spacing-xs);
  margin-bottom: ${({ $noBottomMargin }) =>
    $noBottomMargin ? "0" : "var(--spacing-layout-xs)"};
  margin-left: 0;
  padding-left: 0;
  --accordion-border-color: var(--color-black-50);
`;

const HeadingButton = styled.button<{ theme: Theme }>`
  --color: var(--color-black-90);
  & {
    width: 100%;
    background-color: transparent;
    border: none;
    border-bottom: 1px solid var(--accordion-border-color);
    display: flex;
    gap: var(--spacing-s);
    align-items: center;

    span {
      ${({ theme }) => {
        switch (theme) {
          case "thin":
            return `
              font-size: var(--fontsize-heading-m);
              font-family: var(--font-medium);
              font-weight: 500;
            `;
          case "default":
          default:
            return `
              font-size: var(--fontsize-heading-m);
              font-family: var(--font-bold);
              font-weight: 700;
            `;
        }
      }};

      color: var(--color);
      padding: 0;
      margin: 0;
      margin-right: auto;
    }

    > div {
      margin-right: 0;
    }

    :focus {
      outline: 2px solid var(--color-coat-of-arms);
    }

    :not(:disabled):hover {
      border-bottom-color: var(--color-coat-of-arms);
    }
  }
`;

const Content = styled.div<{ $open: boolean }>`
  display: ${({ $open }) => ($open ? "block" : "none")};
`;

export function Accordion({
  heading,
  headingLevel = 2,
  open = false,
  children,
  onToggle,
  id,
  theme = "default",
  disableBottomMargin,
  ...rest
}: Props): JSX.Element {
  const { isOpen, openAccordion, closeAccordion } = useAccordion({
    initiallyOpen: open,
  });

  useEffect(() => {
    if (open !== isOpen) {
      if (open) {
        openAccordion();
      } else {
        closeAccordion();
      }
    }
  }, [closeAccordion, isOpen, open, openAccordion]);

  const icon = isOpen ? (
    <IconAngleUp aria-hidden="true" />
  ) : (
    <IconAngleDown aria-hidden="true" />
  );

  return (
    <AccordionElement id={id} {...rest} $noBottomMargin={disableBottomMargin}>
      <HeadingButton onClick={onToggle} theme={theme} type="button">
        {icon}
        <H4 as={`h${headingLevel}`}>{heading}</H4>
      </HeadingButton>
      <Content $open={isOpen}>{children}</Content>
    </AccordionElement>
  );
}

export function AccordionWithState({
  open: initiallyOpen,
  ...rest
}: Props): JSX.Element {
  const [open, setOpen] = useState(initiallyOpen);

  return <Accordion onToggle={() => setOpen(!open)} {...rest} open={open} />;
}
