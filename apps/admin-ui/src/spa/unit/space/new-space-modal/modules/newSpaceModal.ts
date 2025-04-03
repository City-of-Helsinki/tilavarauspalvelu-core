import { Tag } from "hds-react";
import styled from "styled-components";

export const EditorColumns = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: baseline;
  gap: var(--spacing-m);
  margin-top: var(--spacing-s);
  padding-bottom: var(--spacing-m);
`;

export const StyledTag = styled(Tag)`
  background-color: var(--color-bus-light);
  color: var(--color-bus);
  margin-top: var(--spacing-s);
`;
