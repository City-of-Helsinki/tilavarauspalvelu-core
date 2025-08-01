import styled from "styled-components";
import { Accordion as AccordionBase } from "@/component/Accordion";

export const EditAccordion = styled(AccordionBase)`
  & h2 {
    --header-padding: var(--spacing-s);
  }
`;
