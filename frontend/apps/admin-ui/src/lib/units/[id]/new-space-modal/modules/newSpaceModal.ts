import { Tag } from "hds-react";
import styled from "styled-components";
import { breakpoints } from "common/src/modules/const";

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
  @media (min-width: ${breakpoints.m}) {
    position: absolute;
    top: var(--spacing-m);
    right: calc(var(--spacing-xl) * 2);
  }
`;
