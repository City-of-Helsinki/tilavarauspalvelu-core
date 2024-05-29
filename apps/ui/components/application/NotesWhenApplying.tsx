import { ApplicationRoundNode } from "@gql/gql-types";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { getTranslationSafe } from "common/src/common/util";
import { getLocalizationLang } from "common/src/helpers";
import Sanitize from "@/components/common/Sanitize";
import { breakpoints, fontMedium } from "common";

const NotesBox = styled.div`
  display: flex;
  flex-flow: column nowrap;
  gap: var(--spacing-m);
  box-sizing: border-box;
  padding: var(--spacing-l);
  background-color: var(--color-gold-light);
  > h3 {
    margin: 0;
  }
  @media (min-width: ${breakpoints.m}) {
    width: 23em;
  }
`;

const NotesBoxHeading = styled.h3`
  font-size: var(--fontsize-heading-s);
  ${fontMedium};
  margin-top: 0;
`;

type NotesWhenApplyingProps = {
  applicationRound: ApplicationRoundNode | null;
};

const NotesWhenApplying = ({ applicationRound }: NotesWhenApplyingProps) => {
  const { t, i18n } = useTranslation();

  if (!applicationRound) {
    return null;
  }
  const translatedNotes = getTranslationSafe(
    applicationRound,
    "notesWhenApplying",
    getLocalizationLang(i18n.language)
  );

  if (translatedNotes === "") {
    return null;
  }

  return (
    <NotesBox>
      <NotesBoxHeading>
        {t("applicationRound:notesWhenApplying")}
      </NotesBoxHeading>
      <Sanitize html={translatedNotes} />
    </NotesBox>
  );
};

export default NotesWhenApplying;
