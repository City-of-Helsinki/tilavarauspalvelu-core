import styled from "styled-components";
import { Accordion as AccordionBase } from "@/components/Accordion";

export const EditAccordion = styled(AccordionBase)`
  & h2 {
    --header-padding: var(--spacing-s);
  }

  input[type="checkbox"]:not(:disabled) {
    background-color: var(--color-white);
  }
`;
