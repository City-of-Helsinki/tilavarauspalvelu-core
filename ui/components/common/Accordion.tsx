import React, { useEffect, useState } from "react";
import { Button, IconAngleDown, IconAngleUp, useAccordion } from "hds-react";
import styled from "styled-components";

type Theme = "default" | "thin";

type Props = {
  heading?: string;
  open?: boolean;
  children: React.ReactNode;
  onToggle?: () => void;
  id?: string;
  theme?: Theme;
};

const AccordionElement = styled.div`
  padding-bottom: var(--spacing-xs);
  margin-bottom: var(--spacing-layout-xs);
  margin-left: 0;
  padding-left: 0;
`;

const HeadingButton = styled(Button).attrs({
  style: {
    "--color": "var(--color-black-90)",
    "--background-color-hover": "transparent",
    "--background-color-hover-focus": "transparent",
  } as React.CSSProperties,
})<{ theme: Theme }>`
  &&& {
    width: 100%;
    padding-left: 0;
    border-left: 0;
    border-bottom: 1px solid var(--color-black-60) !important;

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

      color: var(--color-black-90);
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
      border-bottom-color: var(--color-coat-of-arms) !important;
    }
  }
`;

const Content = styled.div<{ $open: boolean }>`
  display: ${({ $open }) => ($open ? "block" : "none")};
`;

const Accordion = ({
  heading,
  open = false,
  children,
  onToggle,
  id,
  theme = "default",
  ...rest
}: Props): JSX.Element => {
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
    <IconAngleUp aria-hidden />
  ) : (
    <IconAngleDown aria-hidden />
  );
  return (
    <AccordionElement id={id} {...rest}>
      <HeadingButton
        variant="supplementary"
        iconRight={icon}
        onClick={onToggle}
        theme={theme}
      >
        {heading}
      </HeadingButton>
      <Content $open={isOpen}>{children}</Content>
    </AccordionElement>
  );
};

export default Accordion;

export const AccordionWithState = ({
  open: initiallyOpen,
  ...rest
}: Props): JSX.Element => {
  const [open, setOpen] = useState(initiallyOpen);

  return <Accordion onToggle={() => setOpen(!open)} {...rest} open={open} />;
};
