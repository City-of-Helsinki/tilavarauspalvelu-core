import React, { forwardRef } from "react";
import { Tag } from "hds-react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { H1 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { ReservationType } from "common/types/gql-types";
import { getName } from "./util";
import { HorisontalFlex } from "../../../styles/layout";
import { formatDateTime } from "../../../common/util";

const Dot = styled.div`
  display: inline-block;
  border-radius: 50%;
  background: var(--tilavaraus-admin-status-not-handled);
  height: 1.6em;
  text-align: center;
  line-height: 1.6;
  aspect-ratio: 1;
  font-size: 0.6em;
  color: white;
  font-weight: 600;
  @media (min-width: ${breakpoints.m}) {
    flex-direction: row;
  }
`;

const AlignVertically = styled.div`
  display: flex;
  gap: var(--spacing-m);
  flex-direction: row;
  align-items: center;
`;

const NameState = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-bottom: var(--spacing-xs);

  @media (min-width: ${breakpoints.m}) {
    flex-direction: row;
    margin-bottom: 0;
  }
`;

const Tagline = styled.div`
  font-size: var(--fontsize-body-xl);
  margin-bottom: var(--spacing-xs);
`;

const DateTime = styled.div`
  margin-bottom: var(--spacing-s);
  font-size: var(--fontsize-body-s);
`;

type Props = {
  reservation: ReservationType;
  tagline: string;
  overrideTitle?: string;
};

const ReservationTitleSection = forwardRef<HTMLDivElement, Props>(
  ({ reservation, tagline, overrideTitle }: Props, ref) => {
    const { t } = useTranslation();

    return (
      <div>
        <NameState ref={ref}>
          <H1 $legacy>{overrideTitle ?? getName(reservation, t)}</H1>
          <HorisontalFlex>
            <AlignVertically>
              {reservation.orderStatus && (
                <Tag
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  theme={{ "--tag-background": "var(--color-engel-light)" }}
                  id="orderStatus"
                >
                  {t(`Payment.status.${reservation.orderStatus}`)}
                </Tag>
              )}
            </AlignVertically>
            <AlignVertically style={{ gap: "var(--spacing-xs)" }}>
              <Dot />
              {t(`RequestedReservation.state.${reservation.state}`)}
            </AlignVertically>
          </HorisontalFlex>
        </NameState>
        <Tagline>{tagline}</Tagline>
        <DateTime>
          {t("RequestedReservation.createdAt")}{" "}
          {formatDateTime(reservation.createdAt ?? "")}
        </DateTime>
      </div>
    );
  }
);

export default ReservationTitleSection;
