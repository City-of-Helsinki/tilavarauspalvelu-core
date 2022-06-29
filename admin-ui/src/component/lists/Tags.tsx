import React, { Dispatch } from "react";
import { Tag as HDSTag } from "hds-react";
import { get, omit } from "lodash";
import { TFunction } from "react-i18next";
import styled from "styled-components";
import { OptionType } from "../../common/types";

export type Tag<T> = {
  key: string;
  value: string;
  ac: Action<T>;
};

const StyledTag = styled(HDSTag)`
  border-radius: 30px;
  padding: 0px 1em;
`;

const DeleteTag = styled(HDSTag)`
  background: transparent;
`;

export type Action<T> =
  | { type: "set"; value: Partial<T> }
  | { type: "deleteTag"; field: keyof T; value?: string }
  | { type: "reset" };

export const toTags = <T,>(
  state: T,
  t: TFunction,
  multivaluedFields: string[],
  translationPrefix?: string
): Tag<T>[] => {
  return (Object.keys(state) as unknown as (keyof T)[]).flatMap((key) => {
    if (multivaluedFields.includes(key as string)) {
      return (get(state, key) as []).map(
        (v: OptionType) =>
          ({
            key: `${String(key)}.${v.value}`,
            value: v.label,
            ac: { type: "deleteTag", field: key, value: v.value },
          } as Tag<T>)
      );
    }

    return [
      {
        key,
        value:
          typeof state[key] === "string"
            ? `"${state[key]}"`
            : t(`${translationPrefix || ""}.filters.${String(key)}Tag`, {
                value: get(state[key], "label"),
              }),

        ac: {
          type: "deleteTag",
          field: key,
        },
      } as Tag<T>,
    ];
  });
};

export const getReducer =
  <T,>(emptyState: T) =>
  (state: T, action: Action<T>): T => {
    switch (action.type) {
      case "set": {
        return { ...state, ...action.value };
      }

      case "reset": {
        return emptyState;
      }

      case "deleteTag": {
        if (!action.value) {
          return omit(state as Partial<T>, action.field) as unknown as T;
        }

        const filtered = (
          state[action.field] as unknown as [OptionType]
        ).filter((e) => e.value !== action.value);

        return {
          ...state,
          [action.field]: filtered,
        };
      }

      default:
        return { ...state };
    }
  };

const Wrapper = styled.div`
  display: flex;
  gap: var(--spacing-s);
  flex-wrap: wrap;
`;

export default function Tags<T>({
  tags,
  dispatch,
  t,
}: {
  tags: Tag<T>[];
  dispatch: Dispatch<Action<T>>;
  t: TFunction;
}): JSX.Element | null {
  return tags.length ? (
    <Wrapper>
      {tags.map((tag) => (
        <StyledTag
          id={tag.key}
          onDelete={() => {
            dispatch(tag.ac);
          }}
          key={tag.key}
        >
          {tag.value}
        </StyledTag>
      ))}
      {tags.length > 0 && (
        <DeleteTag
          id="delete"
          onDelete={() => dispatch({ type: "reset" })}
          theme={{ "--tag-background": "transparent" }}
        >
          {t("common.clear")}
        </DeleteTag>
      )}
    </Wrapper>
  ) : null;
}
