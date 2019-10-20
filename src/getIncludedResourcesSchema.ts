import { Schema } from './types';

function recursiveParse(obj: any, schema: Schema, resourceType: string, item: any) {
  const itemAsArray = Array.isArray(item) ? item : [item];

  itemAsArray.forEach((item) => {
    Object.keys(item).forEach((key) => {
      const relationConfig = schema[resourceType][key];

      if (relationConfig) {
        if (!obj[key] || obj[key] === true) {
          // eslint-disable-next-line no-param-reassign
          obj[key] = {};
        }

        recursiveParse(obj[key], schema, relationConfig.resourceType, item[key]);

        if (!Object.keys(obj[key]).length) {
        // eslint-disable-next-line no-param-reassign
          obj[key] = true;
        }
      }
    });
  });
}

export function getIncludedResourcesSchema(schema: Schema, resourceType: string, payload: any) {
  const finalSchema: any = {};

  payload.forEach((item: any) => {
    recursiveParse(finalSchema, schema, resourceType, item);
  });

  return finalSchema;
}
