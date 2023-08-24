import React from "react";
import { Accordion as HDSAccordion, AccordionProps } from "hds-react";

const Accordion = ({ ...props }: AccordionProps) => (
  <HDSAccordion closeButton={false} {...props} />
);

export { Accordion };
