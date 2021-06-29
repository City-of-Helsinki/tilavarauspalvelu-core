import React, { useEffect, useState } from "react";

import { Button, IconAngleDown, IconAngleUp, useAccordion } from "hds-react";
import styled from "styled-components";

const AccordionElement = styled.div`
  border-bottom: 1px solid var(--color-black-60);
  padding-bottom: var(--spacing-xs);
  margin-bottom: var(--spacing-layout-xs);
  margin-left: 0;
  padding-left: 0;
`;

const HeadingButton = styled(Button)`
  && {
    width: 100%;
    padding-left: 0;
    border-left: 0;

    span {
      color: var(--color-black-90);
      font-size: var(--fontsize-heading-m);
      font-family: var(--font-bold);
      padding: 0;
      margin: 0;
      margin-right: auto;
    }

    :focus {
      outline: 2px solid var(--color-coat-of-arms);
    }
  }
`;

type Props = {
  heading?: string;
  open?: boolean;
  children: React.ReactNode;
  onToggle?: () => void;
  id?: string;
};

const Accordion = ({
  heading,
  open = false,
  children,
  onToggle,
  id,
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
    <AccordionElement id={id}>
      <HeadingButton
        variant="supplementary"
        iconRight={icon}
        onClick={onToggle}
      >
        {heading}
      </HeadingButton>
      {isOpen ? children : null}
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
