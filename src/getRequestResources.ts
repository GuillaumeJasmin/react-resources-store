import { defaultMemoize, createSelectorCreator } from 'reselect';
import { ReducersConfig, StoreState } from './types';
import { getRequestResourcesId } from './getRequestResourcesId';

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

export function getRequestResources(
  refSelector: Ref,
  config: ReducersConfig,
  state: StoreState<any>,
  resourceType: string,
  requestKey: string,
) {
  if (!refSelector.current) {
    const createEqualishSelector = createSelectorCreator(
      defaultMemoize,
      isEqualish,
    );

    const selectResources = (state: StoreState<any>, resourceType: string, requestKey: string) => {
      const ids = getRequestResourcesId(state, resourceType, requestKey);
      const { resources } = state[resourceType];
      return ids.map((id: any) => resources[id]);
    };

    // eslint-disable-next-line no-param-reassign
    refSelector.current = createEqualishSelector(
      selectResources,
      (objects) => objects,
    );
  }

  const selector = refSelector.current;
  return selector(state, resourceType, requestKey);
}
