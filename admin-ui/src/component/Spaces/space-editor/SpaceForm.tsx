import React from "react";
import { NumberInput, TextInput } from "hds-react";
import { get, upperFirst } from "lodash";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { languages } from "../../../common/const";
import { breakpoints } from "../../../styles/util";
import {
  SpaceCreateMutationInput,
  SpaceUpdateMutationInput,
} from "../../../common/gql-types";

const EditorColumns = styled.div`
  display: grid;
  align-items: baseline;
  grid-template-columns: 1fr;
  gap: var(--spacing-s);
  margin-top: var(--spacing-s);
  padding-bottom: var(--spacing-m);

  @media (min-width: ${breakpoints.m}) {
    grid-template-columns: 1fr 1fr;
  }
  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`;

const EditorRows = styled.div`
  display: grid;
  gap: var(--spacing-s);
  grid-template-columns: 1fr;
`;

const Container = styled.div``;

type Props = {
  getValidationError: (path: string) => string | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: (value: any) => void;
  data: SpaceCreateMutationInput | SpaceUpdateMutationInput | null;
};

const SpaceForm = ({
  getValidationError,
  setValue,
  data,
}: Props): JSX.Element | null => {
  const { t } = useTranslation();

  if (!data) {
    return null;
  }
  return (
    <Container>
      <EditorRows>
        {languages.map((lang) => {
          const fieldName = `name${upperFirst(lang)}`;
          return (
            <TextInput
              key={lang}
              required={lang === "fi"}
              id={fieldName}
              label={t(`SpaceEditor.label.${fieldName}`)}
              value={get(data, fieldName, "")}
              placeholder={t("SpaceEditor.namePlaceholder", {
                language: t(`language.${lang}`),
              })}
              onChange={(e) =>
                setValue({
                  [fieldName]: e.target.value,
                })
              }
              maxLength={80}
              errorText={getValidationError(fieldName)}
              invalid={!!getValidationError(fieldName)}
            />
          );
        })}
      </EditorRows>
      <EditorColumns>
        <NumberInput
          value={data.surfaceArea || 0}
          id="surfaceArea"
          label={t("SpaceEditor.label.surfaceArea")}
          helperText={t("SpaceModal.page2.surfaceAreaHelperText")}
          minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
          plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
          onChange={(e) => setValue({ surfaceArea: Number(e.target.value) })}
          step={1}
          type="number"
          min={1}
          required
          errorText={getValidationError("surfaceArea")}
          invalid={!!getValidationError("surfaceArea")}
        />
        <NumberInput
          value={data.maxPersons || 0}
          id="maxPersons"
          label={t("SpaceEditor.label.maxPersons")}
          minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
          plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
          onChange={(e) => setValue({ maxPersons: Number(e.target.value) })}
          step={1}
          type="number"
          min={1}
          helperText={t("SpaceModal.page2.maxPersonsHelperText")}
          required
          errorText={getValidationError("maxPersons")}
          invalid={!!getValidationError("maxPersons")}
        />
        <TextInput
          id="code"
          label={t("SpaceModal.page2.codeLabel")}
          placeholder={t("SpaceModal.page2.codePlaceholder")}
          value={data.code || ""}
          onChange={(e) => setValue({ code: e.target.value })}
        />
      </EditorColumns>
    </Container>
  );
};

export default SpaceForm;
