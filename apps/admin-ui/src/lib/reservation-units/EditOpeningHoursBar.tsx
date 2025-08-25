import { getOpeningHoursUrl } from "@/common/urls";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import type { SelectedRow } from "@/pages/reservation-units";
import { breakpoints } from "common/src/const";
import { Flex, pageSideMargins } from "common/styled";
import { Button, ButtonVariant, IconInfoCircle, IconLinkExternal, IconSize } from "hds-react";
import { useTranslation } from "next-i18next";
import type { Dispatch, SetStateAction } from "react";
import styled from "styled-components";

const SpaceWrapper = styled.div`
  height: 76px;
`;

const InnerContainer = styled(Flex).attrs({
  $direction: "row",
  $alignItems: "center",
  $wrap: "nowrap",
  $justifyContent: "space-between",
})`
  margin: 0 auto;
  padding-bottom: var(--spacing-s);
  padding-top: var(--spacing-s);
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 1010;
  background-color: var(--color-bus);
  color: var(--color-white);
  ${pageSideMargins}

  /* magic number (490px) to stop editBarText from getting too wide */
  & > :last-child {
    max-width: 490px;
  }

  gap: var(--spacing-xs);
  @media (min-width: ${breakpoints.m}) {
    gap: var(--spacing-l);
  }
`;

type Props = {
  selectedRows: SelectedRow[];
  setSelectedRows: Dispatch<SetStateAction<SelectedRow[]>>;
  apiBaseUrl: string;
};

const EditOpeningHoursBar = ({ selectedRows, setSelectedRows, apiBaseUrl }: Props): JSX.Element => {
  const { t } = useTranslation();
  const count = selectedRows.length;
  const selectedPks = selectedRows.map((id) => Number(id)).filter((id) => !isNaN(id));

  return (
    <SpaceWrapper>
      {count > 0 && (
        <InnerContainer>
          <Flex $gap={"xs"} $direction={"row"}>
            <ButtonLikeLink
              href={getOpeningHoursUrl(apiBaseUrl, selectedPks)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("reservationUnit:goToMassEdit")}
              <IconLinkExternal style={{ marginLeft: "var(--spacing-xs)" }} />
            </ButtonLikeLink>
            <Button
              variant={ButtonVariant.Primary}
              onClick={() => setSelectedRows([])}
              style={{ borderColor: "white" }}
            >
              {t("common:abort")}
            </Button>
          </Flex>
          <Flex $gap={"xs"} $direction={"row"} $alignItems={"center"}>
            <IconInfoCircle size={IconSize.Large} />
            <div>{t("reservationUnit:editBarText")}</div>
          </Flex>
        </InnerContainer>
      )}
    </SpaceWrapper>
  );
};

export default EditOpeningHoursBar;
