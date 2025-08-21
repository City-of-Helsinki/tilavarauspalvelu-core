import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import type { TermsType } from "../../gql/gql-types";
import { H1 } from "../../styled";
import { Button, ButtonVariant, IconArrowLeft } from "hds-react";
import { convertLanguageCode, getTranslationSafe } from "../common/util";
import { Sanitize } from "./Sanitize";

type Props = {
  genericTerms: {
    id: string;
    pk: string | null;
    termsType: TermsType;
    nameFi: string | null;
    nameSv: string | null;
    nameEn: string | null;
    textFi: string | null;
    textSv: string | null;
    textEn: string | null;
  } | null;
};

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  margin-top: var(--spacing-l);
`;

const TermsContent = ({ genericTerms }: Props): JSX.Element => {
  const { t, i18n } = useTranslation();

  if (genericTerms == null) {
    return <div>404</div>;
  }

  const lang = convertLanguageCode(i18n.language);
  const title = getTranslationSafe(genericTerms, "name", lang);
  const text = getTranslationSafe(genericTerms, "text", lang);

  return (
    <>
      <H1>{title}</H1>
      <Sanitize html={text} />
      <ButtonContainer>
        <Button
          title="Takaisin"
          variant={ButtonVariant.Primary}
          onClick={() => window.history.back()}
          iconStart={<IconArrowLeft />}
        >
          {t("common:prev")}
        </Button>
      </ButtonContainer>
    </>
  );
};

export default TermsContent;
