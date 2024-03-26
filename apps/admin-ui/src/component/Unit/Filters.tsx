import React, { useEffect, useReducer } from "react";
import { TextInput } from "hds-react";
import { useTranslation } from "react-i18next";
import { AutoGrid } from "@/styles/layout";
import Tags, { getReducer, toTags } from "../lists/Tags";

export type FilterArguments = {
  nameFi?: string;
};

export const emptyFilterState = {};

type Props = {
  onSearch: (args: FilterArguments) => void;
};

const Filters = ({ onSearch }: Props): JSX.Element => {
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(
    getReducer<FilterArguments>(emptyFilterState),
    emptyFilterState
  );

  useEffect(() => {
    onSearch(state);
  }, [state, onSearch]);

  const tags = toTags(state, t, [], ["nameFi"], "Units");

  return (
    <>
      <AutoGrid>
        <TextInput
          id="nameFi"
          label={t("Units.filters.nameLabel")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSearch(state);
            }
          }}
          onChange={(e) =>
            dispatch({ type: "set", value: { nameFi: e.target.value } })
          }
          placeholder={t("common.search")}
          value={state.nameFi ?? ""}
        />
      </AutoGrid>
      <Tags tags={tags} t={t} dispatch={dispatch} />
    </>
  );
};

export default Filters;
