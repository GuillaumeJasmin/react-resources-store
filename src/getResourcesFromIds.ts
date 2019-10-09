import { defaultMemoize, createSelectorCreator } from 'reselect';
import { ReducersConfig, StoreState, IncludedResourceParams } from './types';

interface Ref {
  current: any
}

function isEqualish(v1: any, v2: any) {
  if (v1 === v2) {
    return true;
  }

  if (Array.isArray(v1) && Array.isArray(v2)) {
    if (v1.length !== v2.length) {
      return false;
    }

    return v1.every((v, ix) => v2[ix] === v);
  }

  return false;
}

export function getResourcesFromIds(
  refSelector: Ref,
  config: ReducersConfig,
  state: StoreState<any>,
  resourceType: string,
  ids: string | string[],
  includedResources?: IncludedResourceParams,
) {
  if (!refSelector.current) {
    // eslint-disable-next-line no-param-reassign
    refSelector.current = {
      main: null,
    };

    const createEqualishSelector = createSelectorCreator(
      defaultMemoize,
      isEqualish,
    );

    const selectResources = (state: StoreState<any>, resourceType: string, ids: string[]) => {
      const { resources } = state[resourceType];

      function getOneResource(id: string) {
        let resource = resources[id];

        if (!refSelector.current[id]) {
          // eslint-disable-next-line no-param-reassign
          refSelector.current[id] = {};
        }

        if (includedResources) {
          Object.entries(includedResources).forEach(([relationResourceKey, includedResourceValue]) => {
            const relationConfig = config[resourceType][relationResourceKey];

            const nextIncludesResources: IncludedResourceParams | undefined = includedResourceValue === true
              ? undefined
              : includedResourceValue;

            if (!refSelector.current[id][relationResourceKey]) {
              // eslint-disable-next-line no-param-reassign
              refSelector.current[id][relationResourceKey] = {
                current: null,
                selector: createEqualishSelector(
                  (resource) => resource,
                  (resource: any, relations: any) => relations,
                  (resource: any, relations: any) => ({
                    ...resource,
                    [relationResourceKey]: relations,
                  }),
                ),
              };
            }

            const { selector } = refSelector.current[id][relationResourceKey];

            if (Array.isArray(relationConfig)) {
              const [relationResourceType, foreignKey] = relationConfig;
              const ids = Object.entries(state[relationResourceType].resources)
                .filter(([, value]) => value[foreignKey] === id)
                .map(([key]) => key);

              const relations = getResourcesFromIds(
                refSelector.current[id][relationResourceKey],
                config,
                state,
                relationResourceType,
                ids,
                nextIncludesResources,
              );

              resource = selector(resource, relations);
            } else {
              const relationResourceType = relationConfig;
              const foreignId = resource[`${relationResourceKey}Id`];

              const relations = getResourcesFromIds(
                refSelector.current[id][relationResourceKey],
                config,
                state,
                relationResourceType,
                foreignId,
                nextIncludesResources,
              );

              resource = selector(resource, relations);
            }
          });
        }

        return resource;
      }

      if (typeof ids === 'string') {
        return getOneResource(ids);
      }

      return ids.map(getOneResource);
    };

    // eslint-disable-next-line no-param-reassign
    refSelector.current.main = createEqualishSelector(
      selectResources,
      (objects) => objects,
    );
  }

  const selector = refSelector.current.main;
  return selector(state, resourceType, ids);
}
