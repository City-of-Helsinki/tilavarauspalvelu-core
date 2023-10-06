import {
  Button,
  IconInfoCircleFill,
  IconPlusCircleFill,
  Notification,
} from "hds-react";
import React, { useReducer, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { useQuery } from "@apollo/client";
import {
  Query,
  QueryUnitByPkArgs,
  ResourceType,
  SpaceType,
  UnitByPkType,
  UnitType,
} from "common/types/gql-types";
import { StyledNotification } from "@/styles/util";
import { useModal } from "@/context/ModalContext";
import {
  ContentContainer,
  IngressContainer,
  WideContainer,
} from "@/styles/layout";
import Loader from "../Loader";
import InfoModalContent from "./InfoModalContent";
import ResourcesTable from "./ResourcesTable";
import SpacesTable from "./SpacesTable";
import SubPageHead from "./SubPageHead";
import Modal, { useModal as useHDSModal } from "../HDSModal";
import NewSpaceModal from "../Spaces/space-editor/new-space-modal/NewSpaceModal";
import NewResourceModal from "../Resources/resource-editor/NewResourceModal";
import { UNIT_QUERY } from "../../common/queries";

interface IProps {
  [key: string]: string;
  unitPk: string;
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
  | { type: "unitLoaded"; unit: UnitByPkType }
  | { type: "dataLoadError"; message: string };

type State = {
  notification: null | NotificationType;
  loading: boolean;
  unit: UnitByPkType | null;
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

const SpacesResources = (): JSX.Element | null => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { setModalContent } = useModal();

  const { t } = useTranslation();
  const unitPk = Number(useParams<IProps>().unitPk);

  const newSpacesButtonRef = React.createRef<HTMLButtonElement>();
  const newResourceButtonRef = React.createRef<HTMLButtonElement>();

  const { refetch, data } = useQuery<Query, QueryUnitByPkArgs>(UNIT_QUERY, {
    variables: { pk: unitPk },
    fetchPolicy: "network-only",

    onError: () => {
      dispatch({
        type: "dataLoadError",
        message: "errors.errorFetchingData",
      });
    },
  });

  useEffect(() => {
    if (data?.unitByPk) {
      dispatch({ type: "unitLoaded", unit: data.unitByPk });
    }
  }, [data]);

  const {
    open: newSpaceDialogIsOpen,
    openModal: openNewSpaceModal,
    closeModal: closeNewSpaceModal,
  } = useHDSModal();

  const {
    openWithContent,
    modalContent,
    open: isNewResourceModalOpen,
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

  const dispatchNotification = (
    title: string,
    text: string,
    type: "success" | "error"
  ) => {
    dispatch({
      type: "setNotification",
      notification: {
        type,
        title,
        text,
      },
    });
  };

  const showDataError = (text: string) => {
    dispatch({
      type: "dataLoadError",
      message: text,
    });
  };

  if (state.unit === null) {
    return null;
  }

  const resources = state.unit.spaces?.flatMap(
    (s) => s?.resources
  ) as ResourceType[];

  const onSaveSpace = () => {
    dispatchNotification(
      "Unit.newSpacesCreatedTitle",
      "Unit.newSpacesCreatedNotification",
      "success"
    );
    refetch();
  };

  const onDeleteSpace = () => {
    dispatchNotification(
      t("Unit.spaceDeletedTitle"),
      "Unit.spaceDeletedNotification",
      "success"
    );

    refetch();
  };

  const onSaveResource = () => {
    dispatchNotification(
      "ResourceEditor.resourceUpdated",
      "ResourceEditor.resourceUpdatedNotification",
      "success"
    );
    refetch();
  };

  const onDeleteResource = () => {
    dispatchNotification(
      t("Unit.resourceDeletedTitle"),
      "Unit.resourceDeletedNotification",
      "success"
    );
    refetch();
  };
  return (
    <ContentContainer>
      <Modal
        id="space-modal"
        open={newSpaceDialogIsOpen}
        close={() => closeNewSpaceModal()}
        afterCloseFocusRef={newSpacesButtonRef}
      >
        <NewSpaceModal
          unit={state.unit}
          closeModal={() => {
            closeNewSpaceModal();
          }}
          onSave={onSaveSpace}
          onDataError={showDataError}
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
            onClick={() => setModalContent(<InfoModalContent />)}
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
      </WideContainer>
      <SpacesTable
        spaces={state.unit.spaces as SpaceType[]}
        unit={state.unit}
        onSave={onSaveSpace}
        onDelete={onDeleteSpace}
        onDataError={showDataError}
      />
      <WideContainer>
        <TableHead>
          <Title>{t("Unit.resources")}</Title>
          <ActionButton
            disabled={state.unit?.spaces?.length === 0}
            iconLeft={<IconPlusCircleFill />}
            variant="supplementary"
            onClick={() =>
              openWithContent(
                <NewResourceModal
                  spacePk={0}
                  unit={state.unit as UnitType}
                  closeModal={() => {
                    closeNewResourceModal();
                  }}
                  onSave={onSaveResource}
                />
              )
            }
          >
            {t("Unit.addResource")}
          </ActionButton>
        </TableHead>
      </WideContainer>
      <ResourcesTable
        unit={state.unit}
        hasSpaces={Boolean(state.unit?.spaces?.length)}
        resources={resources}
        onDelete={onDeleteResource}
        onDataError={showDataError}
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
      <Modal
        id="resource-modal"
        open={isNewResourceModalOpen}
        close={closeNewResourceModal}
        afterCloseFocusRef={newResourceButtonRef}
      >
        {modalContent}
      </Modal>
    </ContentContainer>
  );
};

export default SpacesResources;
