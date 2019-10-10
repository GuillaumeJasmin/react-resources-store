import { ReducersConfig } from './types';

function recursiveParse(obj: any, config: ReducersConfig, resourceType: string, item: any) {
  const itemAsArray = Array.isArray(item) ? item : [item];

  itemAsArray.forEach((item) => {
    Object.keys(item).forEach((key) => {
      const relationConfig = config[resourceType][key];

      if (relationConfig) {
        if (!obj[key] || obj[key] === true) {
          // eslint-disable-next-line no-param-reassign
          obj[key] = {};
        }

        recursiveParse(obj[key], config, relationConfig.resourceType, item[key]);

        if (!Object.keys(obj[key]).length) {
        // eslint-disable-next-line no-param-reassign
          obj[key] = true;
        }
      }
    });
  });
}

export function getIncludedResourcesSchema(config: ReducersConfig, resourceType: string, payload: any) {
  const schema: any = {};

  payload.forEach((item: any) => {
    recursiveParse(schema, config, resourceType, item);
  });

  return schema;
}
