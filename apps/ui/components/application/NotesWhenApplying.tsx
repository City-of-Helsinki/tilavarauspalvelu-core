import { ApplicationRoundNode } from "@gql/gql-types";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { getTranslationSafe } from "common/src/common/util";
import { getLocalizationLang } from "common/src/helpers";
import { Sanitize } from "common/src/components/Sanitize";
import { H4 } from "common";

const NotesBox = styled.div`
  box-sizing: border-box;
  padding: var(--spacing-l);
  background-color: var(--color-gold-light);
`;

type NotesWhenApplyingProps = {
  applicationRound: Pick<
    ApplicationRoundNode,
    "notesWhenApplyingFi" | "notesWhenApplyingSv" | "notesWhenApplyingEn"
  > | null;
  style?: React.CSSProperties;
  className?: string;
};

function NotesWhenApplying({
  applicationRound,
  style,
  className,
}: NotesWhenApplyingProps) {
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
    <NotesBox style={style} className={className}>
      <H4 as="h2" $noMargin>
        {t("applicationRound:notesWhenApplying")}
      </H4>
      <Sanitize html={translatedNotes} />
    </NotesBox>
  );
}

export default NotesWhenApplying;
