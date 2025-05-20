import { ApplicationRoundNode } from "@gql/gql-types";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { getTranslationSafe } from "common/src/common/util";
import { getLocalizationLang } from "common/src/helpers";
import { Sanitize } from "common/src/components/Sanitize";
import { H4 } from "common/styled";
import { breakpoints } from "common/src/const";

const NotesBox = styled.div`
  box-sizing: border-box;
  background-color: var(--color-gold-light);

  padding: var(--spacing-m);
  @media (min-width: ${breakpoints.m}) {
    padding: var(--spacing-l);
  }
`;

interface NotesWhenApplyingProps extends React.HTMLAttributes<HTMLDivElement> {
  applicationRound: Pick<
    ApplicationRoundNode,
    "notesWhenApplyingFi" | "notesWhenApplyingSv" | "notesWhenApplyingEn"
  >;
}

export function NotesWhenApplying({
  applicationRound,
  ...rest
}: NotesWhenApplyingProps) {
  const { t, i18n } = useTranslation();

  const translatedNotes = getTranslationSafe(
    applicationRound,
    "notesWhenApplying",
    getLocalizationLang(i18n.language)
  );

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
