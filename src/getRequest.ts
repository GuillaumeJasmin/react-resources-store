import { Request, StoreState } from './types';

interface Ref {
  current: any
}

export function getRequest(
  state: StoreState<any>,
  resourceType: string,
  requestKey: string,
): Request | null {
  const stateSlice = state[resourceType];

  if (!stateSlice) {
    throw new Error(`resourceType ${resourceType} doesn't exist`);
  }

  const request = stateSlice.requests[requestKey];

  return request || null;
}
