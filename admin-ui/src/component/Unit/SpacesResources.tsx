import {
  Button,
  IconInfoCircleFill,
  IconPlusCircleFill,
  Notification,
} from "hds-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { getUnit } from "../../common/api";
import { useModal } from "../../context/UIContext";
import { UnitWIP } from "../../common/types";
import { IngressContainer, WideContainer } from "../../styles/layout";
import Loader from "../Loader";
import withMainMenu from "../withMainMenu";
import InfoModalContent from "./InfoModalContent";
import ResourcesTable from "./ResourcesTable";
import SpacesTable from "./SpacesTable";
import SubPageHead from "./SubPageHead";
import Modal, { useModal as useHDSModal } from "../HDSModal";
import NewSpaceModalDialog from "./NewSpaceModal";
import { breakpoints } from "../../styles/util";

interface IProps {
  unitId: string;
}

const Wrapper = styled.div``;

const Info = styled.div`
  display: flex;
`;

const StyledButton = styled(Button)`
  padding: 0;
  span {
    padding: 0;
    color: var(--color-black);
  }
`;

const TableHead = styled.div`
  display: flex;
  border-bottom: 1px solid var(--color-silver);
  margin: 2em 0;
  padding-left: 2.5em;
`;

const Title = styled.div`
  font-size: var(--fontsize-heading-l);
  font-family: var(--tilavaraus-admin-font-bold);
`;

const ActionButton = styled(Button)`
  margin-left: auto;
  padding: 0;
  span {
    padding: 0;
    color: var(--color-black);
    font-family: var(--tilavaraus-admin-font-bold);
  }
`;

const StyledNotification = styled(Notification)`
  margin: var(--spacing-xs) var(--spacing-layout-2-xs);
  width: auto;
  @media (min-width: ${breakpoints.xl}) {
    margin: var(--spacing-s) var(--spacing-layout-xl);
  }
`;

const SpacesResources = (): JSX.Element => {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [unit, setUnit] = useState<UnitWIP>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { setModalContent } = useModal();

  const { t, i18n } = useTranslation();
  const { unitId } = useParams<IProps>();

  const newSpacesButtonRef = React.createRef<HTMLButtonElement>();

  useEffect(() => {
    const fetchUnit = async () => {
      try {
        const result = await getUnit(Number(unitId));
        setUnit(result);
      } catch (error) {
        setErrorMsg("errors.errorFetchingData");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnit();
  }, [i18n.language, t, unitId]);

  const [newSpaceDialogisOpen, openNewSpaceDialog, closeNewSpaceDialog] =
    useHDSModal();

  if (isLoading || !unit) {
    return <Loader />;
  }

  return (
    <Wrapper>
      <Modal
        id="modal-id"
        open={newSpaceDialogisOpen}
        close={() => closeNewSpaceDialog()}
        afterCloseFocusRef={newSpacesButtonRef}
      >
        <NewSpaceModalDialog
          unit={unit}
          closeModal={closeNewSpaceDialog}
          onSave={() => setSaveSuccess(true)}
        />
      </Modal>
      <SubPageHead title={t("Unit.spacesAndResources")} unit={unit} />
      <IngressContainer>
        {saveSuccess ? (
          <StyledNotification
            type="success"
            label={t("Unit.newSpacesCreatedTitle")}
            dismissible
            closeButtonLabelText={`${t("common.close")}`}
            onClose={() => setSaveSuccess(false)}
          >
            {t("Unit.newSpacesCreatedNotification")}
          </StyledNotification>
        ) : null}
        <Info>
          <StyledButton
            variant="supplementary"
            iconRight={<IconInfoCircleFill />}
            onClick={() =>
              setModalContent && setModalContent(<InfoModalContent />)
            }
          >
            {t("Unit.hierarchyReadMore")}
          </StyledButton>
        </Info>
      </IngressContainer>
      <WideContainer>
        <TableHead>
          <Title>{t("Unit.spaces")}</Title>
          <ActionButton
            ref={newSpacesButtonRef}
            iconLeft={<IconPlusCircleFill />}
            variant="supplementary"
            onClick={() => openNewSpaceDialog()}
          >
            {t("Unit.addSpace")}
          </ActionButton>
        </TableHead>
      </WideContainer>{" "}
      <SpacesTable spaces={unit.spaces} />
      <WideContainer>
        <TableHead>
          <Title>{t("Unit.resources")}</Title>
          <ActionButton
            iconLeft={<IconPlusCircleFill />}
            variant="supplementary"
          >
            {t("Unit.addResource")}
          </ActionButton>
        </TableHead>
      </WideContainer>
      <ResourcesTable resources={unit.resources} />
      {errorMsg && (
        <Notification
          type="error"
          label={t("errors.functionFailed")}
          position="top-center"
          autoClose={false}
          dismissible
          closeButtonLabelText={t("common.close")}
          displayAutoCloseProgress={false}
          onClose={() => setErrorMsg(null)}
        >
          {t(errorMsg)}
        </Notification>
      )}
    </Wrapper>
  );
};

export default withMainMenu(SpacesResources);
