import { fontMedium } from "common";
import { Flex } from "common/styles/util";
import { Tag } from "hds-react";
import styled from "styled-components";

export const UnitInfo = styled(Flex).attrs({
  $gap: "2-xs",
  $direction: "row",
})`
  margin: var(--spacing-m) 0;
  border-bottom: 1px solid var(--color-black);
`;

export const Name = styled.div`
  margin: 0 0 var(--spacing-m) 0;
`;

export const Address = styled.span`
  ${fontMedium}
`;

export const Parent = styled.div`
  ${fontMedium}
  margin-bottom: var(--spacing-m);
`;

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
