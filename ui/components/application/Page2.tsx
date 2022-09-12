import { IconArrowRight, Notification as HDSNotification } from "hds-react";
import React, { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useRouter } from "next/router";
import styled from "styled-components";
import { Application, Cell } from "common/types/common";
import TimeSelector from "../common/TimeSelector";
import {
  deepCopy,
  cellsToApplicationEventSchedules,
  applicationEventSchedulesToCells,
} from "../../modules/util";
import { AccordionWithState as Accordion } from "../common/Accordion";
import { MediumButton } from "../../styles/util";
import { ButtonContainer } from "../common/common";
import {
  getApplicationEventsWhichMinDurationsIsNotFulfilled,
  getListOfApplicationEventTitles,
} from "../../modules/application/application";

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

const Page2 = ({ application, onNext }: Props): JSX.Element => {
  const { t } = useTranslation();

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [minDurationMsg, setMinDurationMsg] = useState(true);
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
    setErrorMsg("");
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
      setSuccessMsg("");
      setErrorMsg("application:error.missingSchedule");
      return;
    }
    onNext(appToSave);
  };

  const applicationEventsForWhichMinDurationIsNotFulfilled: number[] =
    getApplicationEventsWhichMinDurationsIsNotFulfilled(
      application.applicationEvents,
      selectorData
    );

  return (
    <>
      {successMsg && (
        <Notification
          type="success"
          label={t(successMsg)}
          aria-label={t(successMsg)}
          position="top-center"
          autoClose
          autoCloseDuration={2000}
          displayAutoCloseProgress={false}
          onClose={() => setSuccessMsg("")}
          dismissible
          closeButtonLabelText={t("common:close")}
          dataTestId="application__page2--notification-success"
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
          dismissible
          closeButtonLabelText={t("common:close")}
          dataTestId="application__page2--notification-error"
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
            theme="thin"
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
                  href="/Tilavarauspalvelu_Varausyksikoiden-aukioloajat.pdf"
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
      {minDurationMsg &&
        applicationEventsForWhichMinDurationIsNotFulfilled.some(
          (d) => d !== null
        ) && (
          <Notification
            type="alert"
            label={t("application:Page2.notification.minDuration.title")}
            dismissible
            onClose={() => setMinDurationMsg(false)}
            closeButtonLabelText={t("common:close")}
            dataTestId="application__page2--notification-min-duration"
          >
            {application.applicationEvents?.length === 1
              ? t("application:Page2.notification.minDuration.bodySingle")
              : t("application:Page2.notification.minDuration.body", {
                  title: getListOfApplicationEventTitles(
                    application.applicationEvents,
                    applicationEventsForWhichMinDurationIsNotFulfilled
                  ),
                  count:
                    applicationEventsForWhichMinDurationIsNotFulfilled.length,
                })}
          </Notification>
        )}
      <ButtonContainer>
        <MediumButton
          variant="secondary"
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
