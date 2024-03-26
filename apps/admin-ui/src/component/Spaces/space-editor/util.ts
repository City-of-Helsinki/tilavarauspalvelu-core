import Joi from "joi";
import type { SpaceNode } from "common/types/gql-types";

const recurse = (
  parent: SpaceNode,
  spaces: SpaceNode[],
  depth: number,
  paddingChar: string
): SpaceNode[] => {
  const newParent = {
    ...parent,
    nameFi: "".padStart(depth, paddingChar) + parent.nameFi,
  } as SpaceNode;

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
  spaces: SpaceNode[],
  paddingChar: string
): SpaceNode[] => {
  const roots = spaces.filter((e) => e.parent == null);
  return roots.flatMap((rootSpace) =>
    recurse(rootSpace, spaces, 0, paddingChar)
  );
};

export const schema = Joi.object({
  nameFi: Joi.string().max(80),
  nameSv: Joi.string().allow("").allow(null).optional().max(80),
  nameEn: Joi.string().allow("").allow(null).optional().max(80),
  surfaceArea: Joi.number().min(0),
  maxPersons: Joi.number().min(0),
  unitPk: Joi.number(),
  pk: Joi.number(),
  parentPk: Joi.number().allow(null),
  code: Joi.string().allow("").allow(null).optional(),
}).options({
  abortEarly: false,
});
