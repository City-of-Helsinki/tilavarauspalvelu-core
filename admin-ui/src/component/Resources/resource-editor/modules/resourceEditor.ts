import { Button } from "hds-react";
import Joi from "joi";
import styled from "styled-components";
import { breakpoints } from "../../../../styles/util";

export const schema = Joi.object({
  spacePk: Joi.number().required(),
  pk: Joi.number().optional(),
  nameFi: Joi.string().required().max(80),
  nameSv: Joi.string().optional().allow("").allow(null).max(80),
  nameEn: Joi.string().optional().allow("").allow(null).max(80),
}).options({
  abortEarly: false,
});

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
