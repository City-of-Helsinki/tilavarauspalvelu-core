import {
  IconArrowLeft,
  IconArrowRight,
  Notification as HDSNotification,
} from "hds-react";
import React, { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useRouter } from "next/router";
import styled from "styled-components";
import { Application, Cell } from "../../modules/types";
import TimeSelector from "../common/TimeSelector";
import {
  deepCopy,
  cellsToApplicationEventSchedules,
  applicationEventSchedulesToCells,
} from "../../modules/util";
import { AccordionWithState as Accordion } from "../common/Accordion";
import { breakpoint } from "../../modules/style";
import { MediumButton } from "../../styles/util";

type Props = {
  application: Application;
  onNext: (appToSave: Application) => void;
};

const SubHeading = styled.p`
  margin-top: var(--spacing-2-xs);
`;

const Notification = styled(HDSNotification)`
  z-index: 0;
`;

const StyledNotification = styled(Notification)`
  margin-top: var(--spacing-m);
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: var(--spacing-m);
  flex-direction: column-reverse;
  margin: var(--spacing-layout-l) 0;
  justify-content: flex-end;

  @media (min-width: ${breakpoint.s}) {
    flex-direction: row;
  }
`;

const Page2 = ({ application, onNext }: Props): JSX.Element => {
  const { t } = useTranslation();

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const history = useRouter();

  const [selectorData, setSelectorData] = useState<Cell[][][]>(
    application.applicationEvents.map((applicationEvent) =>
      applicationEventSchedulesToCells(
        applicationEvent.applicationEventSchedules
      )
    )
  );

  const updateCells = (index: number, newCells: Cell[][]) => {
    const updated = [...selectorData];
    updated[index] = newCells;
    setSelectorData(updated);
  };

  const resetCells = (index: number) => {
    const updated = [...selectorData];
    updated[index] = selectorData[index].map((n) =>
      n.map((nn) => ({ ...nn, state: false }))
    );
    setSelectorData(updated);
  };

  const copyCells = (index: number) => {
    const updated = [...selectorData];
    const srcCells = updated[index];
    srcCells.forEach((day, i) => {
      day.forEach((cell, j) => {
        const { state } = cell;
        for (let k = 0; k < updated.length; k += 1) {
          if (k !== index) {
            updated[k][i][j].state = state;
          }
        }
      });
    });
    selectorData.forEach(() => updated.push([...selectorData[index]]));
    setSelectorData(updated);
    setSuccessMsg(t("application:Page2.notification.copyCells"));
  };

  const prepareData = (data: Application): Application => {
    const applicationCopy = deepCopy(data);

    applicationCopy.applicationEvents.forEach((applicationEvent, i) => {
      applicationCopy.applicationEvents[i].applicationEventSchedules.length = 0;
      cellsToApplicationEventSchedules(selectorData[i]).forEach((e) =>
        applicationEvent.applicationEventSchedules.push(e)
      );
    });
    return applicationCopy;
  };

  const onSubmit = () => {
    const appToSave = prepareData(application);
    if (
      appToSave.applicationEvents
        .map((ae) => ae.applicationEventSchedules.length > 0)
        .filter((l) => l === false).length > 0
    ) {
      setErrorMsg("application:error.missingSchedule");
      return;
    }
    onNext(appToSave);
  };

  return (
    <>
      {successMsg && (
        <Notification
          type="success"
          label={t(successMsg)}
          position="top-center"
          autoClose
          autoCloseDuration={2000}
          displayAutoCloseProgress={false}
          onClose={() => setSuccessMsg("")}
        />
      )}
      {errorMsg && (
        <Notification
          type="error"
          label={t(errorMsg)}
          position="top-center"
          autoClose
          displayAutoCloseProgress={false}
          onClose={() => setErrorMsg("")}
        >
          {t(errorMsg)}
        </Notification>
      )}
      {application.applicationEvents.map((event, index) => {
        const summaryDataPrimary = cellsToApplicationEventSchedules(
          selectorData[index].map((n) => n.filter((nn) => nn.state === 300))
        );
        const summaryDataSecondary = cellsToApplicationEventSchedules(
          selectorData[index].map((n) => n.filter((nn) => nn.state === 200))
        );
        return (
          <Accordion
            open={index === 0}
            key={event.id}
            id={`timeSelector-${index}`}
            heading={event.name || undefined}
          >
            <SubHeading>{t("application:Page2.subHeading")}</SubHeading>
            <StyledNotification
              label={t("application:Page2.info")}
              size="small"
              type="info"
            >
              <Trans i18nKey="application:Page2.info">
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://www.hel.fi/static/liitteet-2019/KuVa/nuoriso/Vakiovuorojen_sahkoinen_hakuohje2021.pdf"
                >
                  {" "}
                </a>
              </Trans>
            </StyledNotification>
            <TimeSelector
              key={event.id || "NEW"}
              index={index}
              cells={selectorData[index]}
              updateCells={updateCells}
              copyCells={
                application.applicationEvents.length > 1 ? copyCells : null
              }
              resetCells={() => resetCells(index)}
              summaryData={[summaryDataPrimary, summaryDataSecondary]}
            />
          </Accordion>
        );
      })}
      <ButtonContainer>
        <MediumButton
          variant="secondary"
          iconLeft={<IconArrowLeft />}
          onClick={() => history.push(`${application.id}/page1`)}
        >
          {t("common:prev")}
        </MediumButton>
        <MediumButton
          id="next"
          iconRight={<IconArrowRight />}
          onClick={() => onSubmit()}
        >
          {t("common:next")}
        </MediumButton>
      </ButtonContainer>
    </>
  );
};

export default Page2;
