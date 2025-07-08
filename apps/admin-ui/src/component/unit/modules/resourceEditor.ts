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

export const Editor = styled.div`
  max-width: var(--prose-width);
`;

export const EditorColumns = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  align-items: baseline;
  gap: 1em;
  margin-top: var(--spacing-s);
  padding-bottom: var(--spacing-m);
`;
