import { Button, IconTrash, Tag } from "hds-react";
import Joi from "joi";
import styled from "styled-components";
import {
  SpaceCreateMutationInput,
  SpaceType,
  UnitByPkType,
} from "../../../../../common/gql-types";

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

export const ActionButtons = styled.div`
  display: flex;
  padding: var(--spacing-m);
`;

export const NextButton = styled(Button)`
  margin-left: auto;
`;

export const ButtonContainer = styled.div`
  display: flex;
`;
export const NewRowButton = styled(Button)`
  color: var(--color-black);
  position: relative;
  margin-left: auto;
`;

export const EditorContainer = styled.div`
  margin: var(--spacing-l) 0;
  display: grid;
  grid-template-columns: 1fr 2em;
  gap: var(--spacing-m);
  border-bottom: 1px solid var(--color-black);
`;

export const EditorColumns = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: baseline;
  gap: var(--spacing-m);
  margin-top: var(--spacing-s);
  padding-bottom: var(--spacing-m);
`;

export const RoundTag = styled(Tag)`
  border-radius: 10px;
  background-color: var(--color-bus-light);
  color: var(--color-bus);
  font-weight: 600;
  margin-top: var(--spacing-s);
  margin-left: auto;
`;

export const IconDelete = styled(IconTrash)`
  margin: var(--spacing-m) 0 0 var(--spacing-s);
  padding: var(--spacing-s);
`;

export type SpaceMutationInputWithKey<T> = Partial<T> & { key: string };

export type State = {
  numSpaces: number;
  parentPk: number | null;
  parentName: string | null;
  spaces: SpaceMutationInputWithKey<SpaceCreateMutationInput>[];
  page: number;
  unitPk: number;
  unitSpaces?: SpaceType[];
  validationErrors: (Joi.ValidationResult | null)[];
};

export type Action =
  | { type: "setNumSpaces"; numSpaces: number }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { type: "set"; index: number; value: any }
  | { type: "setParent"; parentPk: number | null; parentName: string | null }
  | { type: "setUnit"; unit: UnitByPkType }
  | {
      type: "setValidatioErrors";
      validationErrors: (Joi.ValidationResult | null)[];
    }
  | { type: "nextPage" }
  | { type: "prevPage" }
  | { type: "addRow" }
  | { type: "delete"; index: number };
