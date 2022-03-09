import React from "react";
import {
  Button,
  Dialog,
  IconArrowRight,
  IconCheck,
  NumberInput,
} from "hds-react";
import { useTranslation } from "react-i18next";
import { UnitByPkType } from "../../../../common/gql-types";
import { CustomDialogHeader } from "../../../CustomDialogHeader";
import ParentSelector from "../ParentSelector";
import {
  Action,
  ActionButtons,
  Address,
  Name,
  NextButton,
  Parent,
  RoundTag,
  State,
  Title,
  UnitInfo,
} from "./modules/newSpaceModal";
import { parseAddress } from "../../../../common/util";

const Page1 = ({
  editorState,
  unit,
  dispatch,
  closeModal,
  hasFixedParent,
}: {
  editorState: State;
  unit: UnitByPkType;
  dispatch: React.Dispatch<Action>;
  closeModal: () => void;
  hasFixedParent: boolean;
}): JSX.Element => {
  const { t } = useTranslation();

  const nextEnabled =
    editorState.numSpaces > 0 && editorState.parentPk !== undefined;

  return (
    <>
      <CustomDialogHeader
        id="dialog-title"
        extras={<RoundTag>{t("SpaceModal.phase")} 1/2</RoundTag>}
        title={t(
          hasFixedParent
            ? "SpaceModal.page1.subSpaceModalTitle"
            : "SpaceModal.page1.modalTitle"
        )}
        close={closeModal}
      />
      <Dialog.Content>
        <p className="text-body" id="custom-dialog-content">
          {t("SpaceModal.page1.info")}
        </p>
        <UnitInfo>
          <IconCheck />
          <div>
            <Name>{unit.nameFi}</Name>
            <Parent>
              {editorState.parentPk ? editorState.parentName : null}
            </Parent>
          </div>
          {unit.location ? (
            <Address>{parseAddress(unit.location)}</Address>
          ) : null}
        </UnitInfo>
        {!hasFixedParent ? <Title>{t("SpaceModal.page1.title")}</Title> : null}
        <NumberInput
          style={{ maxWidth: "15em" }}
          value={editorState.numSpaces}
          helperText={t("SpaceModal.page1.numSpacesHelperText")}
          id="WithDefaultValue"
          label={t("SpaceModal.page1.numSpacesLabel")}
          minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
          plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
          onChange={(e) => {
            dispatch({
              type: "setNumSpaces",
              numSpaces: Number(e.target.value),
            });
          }}
          step={1}
          type="number"
          min={1}
          max={10}
          required
        />
        {!hasFixedParent ? (
          <>
            <br />
            <ParentSelector
              label={t("SpaceModal.page1.parentLabel")}
              unitPk={unit.pk as number}
              spacePk={null}
              parentPk={editorState.parentPk || null}
              onChange={(parentPk, parentName) =>
                dispatch({
                  type: "setParent",
                  parentPk,
                  parentName: parentName || null,
                })
              }
            />
          </>
        ) : null}
      </Dialog.Content>
      <ActionButtons>
        <Button onClick={closeModal} variant="secondary">
          {t("SpaceModal.page1.buttonCancel")}
        </Button>
        <NextButton
          disabled={!nextEnabled}
          iconRight={<IconArrowRight />}
          variant="supplementary"
          onClick={() => dispatch({ type: "nextPage" })}
        >
          {t("SpaceModal.page1.buttonNext")}
        </NextButton>
      </ActionButtons>
    </>
  );
};

export default Page1;
