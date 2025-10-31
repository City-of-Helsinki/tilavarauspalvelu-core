import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { Sanitize } from "ui/src/components/Sanitize";
import { breakpoints } from "ui/src/modules/const";
import { getLocalizationLang } from "ui/src/modules/helpers";
import { getTranslation } from "ui/src/modules/util";
import { H4 } from "ui/src/styled";
import { ApplicationRoundNode } from "@gql/gql-types";

const NotesBox = styled.div`
  box-sizing: border-box;
  background-color: var(--color-gold-light);

  padding: var(--spacing-m);
  max-width: 360px;
  @media (min-width: ${breakpoints.m}) {
    padding: var(--spacing-l);
  }
`;

interface NotesWhenApplyingProps extends React.HTMLAttributes<HTMLDivElement> {
  applicationRound: Pick<ApplicationRoundNode, "notesWhenApplyingFi" | "notesWhenApplyingSv" | "notesWhenApplyingEn">;
}

export function NotesWhenApplying({ applicationRound, ...rest }: NotesWhenApplyingProps) {
  const { t, i18n } = useTranslation();

  const translatedNotes = getTranslation(applicationRound, "notesWhenApplying", getLocalizationLang(i18n.language));

  if (translatedNotes === "") {
    return null;
  }

  return (
    <NotesBox {...rest}>
      <H4 as="h3" $marginTop="none">
        {t("applicationRound:notesWhenApplying")}
      </H4>
      <Sanitize html={translatedNotes} />
    </NotesBox>
  );
}
