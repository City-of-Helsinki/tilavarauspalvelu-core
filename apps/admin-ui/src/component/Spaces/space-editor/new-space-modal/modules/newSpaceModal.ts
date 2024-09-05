import { Tag } from "hds-react";
import styled from "styled-components";

export const Title = styled.div`
  font-family: var(--tilavaraus-admin-font-bold);
  font-size: var(--fontsize-heading-xs);
  margin-bottom: var(--spacing-m);
`;

export const UnitInfo = styled.div`
  margin: var(--spacing-m) 0;
  display: flex;
  padding-bottom: var(--spacing-m);
  gap: var(--spacing-m);
  border-bottom: 1px solid var(--color-black);
`;
export const Name = styled.div`
  margin: 0 0 var(--spacing-m) 0;
`;

export const Address = styled.span`
  font-family: var(--tilavaraus-admin-font-bold);
`;

export const Parent = styled.div`
  font-family: var(--tilavaraus-admin-font-bold);
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
  font-weight: 600;
  margin-top: var(--spacing-s);
  margin-left: auto;
`;
