import Joi from "joi";
import { SpaceType } from "../../../common/gql-types";

const recurse = (
  parent: SpaceType,
  spaces: SpaceType[],
  depth: number,
  paddingChar: string
): SpaceType[] => {
  const newParent = {
    ...parent,
    nameFi: "".padStart(depth, paddingChar) + parent.nameFi,
  } as SpaceType;

  const children = spaces.filter((e) => e.parent?.pk === parent.pk);

  if (children.length === 0) {
    return [newParent];
  }
  const c = children.flatMap((space) =>
    recurse(space, spaces, depth + 1, paddingChar)
  );
  return [newParent, ...c];
};

export const spacesAsHierarchy = (
  spaces: SpaceType[],
  paddingChar: string
): SpaceType[] => {
  const roots = spaces.filter((e) => e.parent === null);
  return roots.flatMap((rootSpace) =>
    recurse(rootSpace, spaces, 0, paddingChar)
  );
};

export const schema = Joi.object({
  nameFi: Joi.string().max(80),
  nameSv: Joi.string().allow("").allow(null).optional().max(80),
  nameEn: Joi.string().allow("").allow(null).optional().max(80),
  surfaceArea: Joi.number().min(1),
  maxPersons: Joi.number().min(1),
  unitPk: Joi.number(),
  pk: Joi.number(),
  parentPk: Joi.number().allow(null),
  code: Joi.string().allow("").allow(null).optional(),
}).options({
  abortEarly: false,
});
