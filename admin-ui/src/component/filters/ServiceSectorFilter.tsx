import React, { useState } from "react";
import { gql, useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { Query, ServiceSectorType } from "common/types/gql-types";
import { OptionType } from "../../common/types";
import SortedSelect from "../ReservationUnits/ReservationUnitEditor/SortedSelect";
import { GQL_MAX_RESULTS_PER_QUERY } from "../../common/const";

const SERVICE_SECTORS_QUERY = gql`
  query serviceSector($offset: Int, $count: Int) {
    serviceSectors(offset: $offset, first: $count) {
      edges {
        node {
          nameFi
          pk
        }
      }
      totalCount
    }
  }
`;

type Props = {
  onChange: (serviceSectors: OptionType) => void;
  value?: OptionType;
};

const ServiceSectorFilter = ({ onChange, value }: Props): JSX.Element => {
  const { t } = useTranslation();
  const [serviceSectors, setServiceSectors] = useState<ServiceSectorType[]>([]);

  // Copy-paste from ReservationUnitFilter (same issues etc.)
  const { loading } = useQuery<Query>(SERVICE_SECTORS_QUERY, {
    variables: {
      offset: serviceSectors.length,
      count: GQL_MAX_RESULTS_PER_QUERY,
    },
    onCompleted: (data) => {
      const qd = data?.serviceSectors;
      if (qd?.edges.length != null && qd?.totalCount && qd?.edges.length > 0) {
        const ds =
          data.serviceSectors?.edges
            .map((x) => x?.node)
            .filter((e): e is ServiceSectorType => e != null) ?? [];
        setServiceSectors([...serviceSectors, ...ds]);
      }
    },
  });

  if (loading) {
    return <>{t("Units.filters.serviceSector")}</>;
  }

  const options: OptionType[] = serviceSectors.map((serviceSector) => ({
    label: serviceSector?.nameFi ?? "",
    value: serviceSector?.pk ?? 0,
  }));

  return (
    <SortedSelect
      sort
      label={t("Units.filters.serviceSector")}
      placeholder={t("common.filter")}
      options={options}
      value={value}
      onChange={onChange}
      id="service-sector-combobox"
    />
  );
};

export default ServiceSectorFilter;
