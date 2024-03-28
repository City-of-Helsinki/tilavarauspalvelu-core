import { breakpoints } from "common/src/common/style";
import { Button } from "hds-react";
import styled from "styled-components";
import { z } from "zod";

export const ResourceUpdateSchema = z.object({
  nameFi: z.string().max(80).min(1),
  // TODO check that empty is valid
  nameSv: z.string().max(80).nullish(),
  nameEn: z.string().max(80).nullish(),
  // optional because of TS, update requires it, create can't have it
  pk: z.number().min(1).optional(),
  space: z.number().min(1),
});

export type ResourceUpdateForm = z.infer<typeof ResourceUpdateSchema>;

export const Buttons = styled.div`
  display: flex;
  padding: var(--spacing-m);
`;

export const SaveButton = styled(Button)`
  margin-left: auto;
`;

export const EditorContainer = styled.div`
  @media (min-width: ${breakpoints.l}) {
    margin: 0 var(--spacing-layout-m);
  }
`;

export const Editor = styled.div`
  @media (min-width: ${breakpoints.m}) {
    margin: 0 var(--spacing-layout-m);
  }
  max-width: 52rem;
`;

export const EditorColumns = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  align-items: baseline;
  gap: 1em;
  margin-top: var(--spacing-s);
  padding-bottom: var(--spacing-m);
`;
