import {
  Button,
  IconInfoCircleFill,
  IconPlusCircleFill,
  Notification,
} from "hds-react";
import React, { useReducer } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { useQuery } from "@apollo/client";
import { useModal } from "../../context/UIContext";
import { UnitType } from "../../common/types";
import { IngressContainer, WideContainer } from "../../styles/layout";
import Loader from "../Loader";
import withMainMenu from "../withMainMenu";
import InfoModalContent from "./InfoModalContent";
import ResourcesTable from "./ResourcesTable";
import SpacesTable from "./SpacesTable";
import SubPageHead from "./SubPageHead";
import Modal, { useModal as useHDSModal } from "../HDSModal";
import NewSpaceModal from "./NewSpaceModal";
import { breakpoints } from "../../styles/util";
import NewResourceModal from "./NewResourceModal";
import { UNIT_QUERY } from "../../common/queries";

interface IProps {
  unitId: string;
}

type NotificationType = {
  title: string;
  text: string;
  type: "success" | "error";
};

type Action =
  | {
      type: "setNotification";
      notification: NotificationType;
    }
  | { type: "clearNotification" }
  | { type: "clearError" }
  | { type: "unitLoaded"; unit: UnitType }
  | { type: "dataLoadError"; message: string };

type State = {
  notification: null | NotificationType;
  loading: boolean;
  unit: UnitType | null;
  error: null | {
    message: string;
  };
};

const initialState: State = {
  loading: true,
  notification: null,
  unit: null,
  error: null,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "clearNotification": {
      return { ...state, notification: null };
    }
    case "setNotification": {
      return { ...state, notification: { ...action.notification } };
    }
    case "unitLoaded": {
      return { ...state, unit: action.unit, loading: false };
    }
    case "dataLoadError": {
      return {
        ...state,
        loading: false,
        error: { message: action.message },
      };
    }
    case "clearError": {
      return {
        ...state,
        error: null,
      };
    }
    default:
      return state;
  }
};

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

const SpacesResources = (): JSX.Element | null => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { setModalContent } = useModal();

  const { t } = useTranslation();
  const { unitId } = useParams<IProps>();

  const newSpacesButtonRef = React.createRef<HTMLButtonElement>();
  const newResourceButtonRef = React.createRef<HTMLButtonElement>();

  useQuery(UNIT_QUERY, {
    variables: { pk: unitId },
    onCompleted: ({ unitByPk }: { unitByPk: UnitType }) => {
      dispatch({ type: "unitLoaded", unit: unitByPk });
    },
    onError: () => {
      dispatch({
        type: "dataLoadError",
        message: "errors.errorFetchingData",
      });
    },
  });

  const {
    open: newSpaceDialogIsOpen,
    openModal: openNewSpaceModal,
    closeModal: closeNewSpaceModal,
  } = useHDSModal();

  const {
    open: newResourceModalIsOpen,
    openModal: openNewResourceModal,
    closeModal: closeNewResourceModal,
  } = useHDSModal();

  if (state.loading) {
    return <Loader />;
  }

  if (state.error && !state.unit) {
    return (
      <Wrapper>
        <Notification
          type="error"
          label={t("errors.functionFailed")}
          position="top-center"
          autoClose={false}
          dismissible
          onClose={() => dispatch({ type: "clearError" })}
          closeButtonLabelText={t("common.close")}
          displayAutoCloseProgress={false}
        >
          {t(state.error.message)}
        </Notification>
      </Wrapper>
    );
  }

  const saveSpaceSuccess = () =>
    dispatch({
      type: "setNotification",
      notification: {
        type: "success",
        title: "Unit.newSpacesCreatedTitle",
        text: "Unit.newSpacesCreatedNotification",
      },
    });

  const onDeleteSpaceSuccess = (text?: string) =>
    dispatch({
      type: "setNotification",
      notification: {
        type: "success",
        title: text || t("Unit.spaceDeletedTitle"),
        text: "Unit.spaceDeletedNotification",
      },
    });

  const onDataError = (text: string) => {
    dispatch({
      type: "dataLoadError",
      message: text,
    });
  };

  if (state.unit === null) {
    return null;
  }
  return (
    <Wrapper>
      <Modal
        id="space-modal"
        open={newSpaceDialogIsOpen}
        close={() => closeNewSpaceModal()}
        afterCloseFocusRef={newSpacesButtonRef}
      >
        <NewSpaceModal
          unit={state.unit}
          closeModal={closeNewSpaceModal}
          onSave={saveSpaceSuccess}
          onDataError={onDataError}
        />
      </Modal>
      <Modal
        id="resource-modal"
        open={newResourceModalIsOpen}
        close={() => closeNewResourceModal()}
        afterCloseFocusRef={newResourceButtonRef}
      >
        <NewResourceModal
          unit={state.unit}
          closeModal={closeNewResourceModal}
          onSave={saveSpaceSuccess}
        />
      </Modal>
      <SubPageHead title={t("Unit.spacesAndResources")} unit={state.unit} />
      <IngressContainer>
        {state.notification ? (
          <StyledNotification
            type={state.notification.type}
            label={t(state.notification.title)}
            dismissible
            closeButtonLabelText={`${t("common.close")}`}
            onClose={() => dispatch({ type: "clearNotification" })}
          >
            {t(state.notification.text)}
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
            onClick={() => openNewSpaceModal()}
          >
            {t("Unit.addSpace")}
          </ActionButton>
        </TableHead>
      </WideContainer>{" "}
      <SpacesTable
        spaces={state.unit.spaces}
        unit={state.unit}
        onSave={saveSpaceSuccess}
        onDelete={onDeleteSpaceSuccess}
        onDataError={onDataError}
      />
      <WideContainer>
        <TableHead>
          <Title>{t("Unit.resources")}</Title>
          <ActionButton
            iconLeft={<IconPlusCircleFill />}
            variant="supplementary"
            onClick={() => openNewResourceModal()}
          >
            {t("Unit.addResource")}
          </ActionButton>
        </TableHead>
      </WideContainer>
      <ResourcesTable
        resources={state.unit.resources}
        onDelete={onDeleteSpaceSuccess}
        onDataError={onDataError}
      />
      {state.error ? (
        <Wrapper>
          <Notification
            type="error"
            label={t("errors.functionFailed")}
            position="top-center"
            autoClose={false}
            dismissible
            onClose={() => dispatch({ type: "clearError" })}
            closeButtonLabelText={t("common.close")}
            displayAutoCloseProgress={false}
          >
            {t(state.error?.message)}
          </Notification>
        </Wrapper>
      ) : null}
    </Wrapper>
  );
};

export default withMainMenu(SpacesResources);
