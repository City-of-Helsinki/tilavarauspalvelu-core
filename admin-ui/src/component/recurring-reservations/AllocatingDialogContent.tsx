import React from "react";
import styled from "styled-components";
import { LoadingSpinner } from "hds-react";
import { useTranslation } from "react-i18next";
import { H2 } from "common/src/common/typography";
import Dialog from "../Dialog";

interface IProps {
  callback?: () => void;
}

const DialogContent = styled.div`
  display: grid;
  justify-items: center;
  text-align: center;

  ${H2} {
    margin-top: var(--spacing-l);
    margin-bottom: var(--spacing-m);
  }

  p {
    line-height: var(--lineheight-l);
    margin: 0;
  }
`;

function AllocatingDialogContent({ callback }: IProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Dialog canBeClosed={false}>
      <DialogContent onClick={() => callback && callback()}>
        <LoadingSpinner />
        <H2>{t("ApplicationRound.allocationDialogHeading")}</H2>
        <p>{t("ApplicationRound.allocationDialogBody")}</p>
      </DialogContent>
    </Dialog>
  );
}

export default AllocatingDialogContent;
