import { Store } from 'redux';

export type ActionType =
  | 'UPDATE_PENDING'
  | 'DELETE_PENDING'
  | 'UPDATE_SUCCEEDED'
  | 'DELETE_SUCCEEDED'
  | 'UPDATE_FAILED'
  | 'DELETE_FAILED'
  | 'INSERT_REQUEST_RESOURCE';

export interface Action {
  type: ActionType;
  resourceType: string;
  requestKey: string;
}

export type RequestStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED';

export interface Request {
  status: RequestStatus;
  requestKey: string;
  ids: string[];
  includedResources: IncludedResourceParams,
  isList: boolean,
}

export interface ResourceState<Resource = any> {
  resources: {
    [resourceId: string]: Resource;
  };
  requests: {
    [requestKey: string]: Request;
  };
}

export type StoreState<Resources> = {
  [resourceType in keyof Resources]: ResourceState<Resources[resourceType]>;
};

export interface SucceededArgs {
  raw: any
  data: any,
}

export interface FailedArgs {
  raw: any
}

export type SucceededFn = (args: SucceededArgs) => void
export type FailedFn = (args: FailedArgs) => void

export type Resolver = (...args: any) => {
  url: string,
  method: string,
  resourceType: string,
  resourceId: string | null,
  params: object,
  request: (
    succeeded: SucceededFn,
    failed: FailedFn
  ) => void
}

export interface ContextValue<Resources = any> {
  config: ReducersConfig,
  resolver: Resolver,
  store: Store<StoreState<Resources>>;
}

export interface ReducersConfig {
  [resourceType: string]: {
    [relationKey: string]: {
      resourceType: string,
      relationType: 'hasMany' | 'hasOne',
      foreignKey: string
    }
  };
}

export interface IncludedResourceParams {
  [resourceType: string]: true | IncludedResourceParams
}

export type FetchPolicy =
  | 'cache-first'
  | 'cache-and-network'
  | 'network-only' // network-only not already supported
  | 'cache-only';

export interface Options {
  includedResources?: IncludedResourceParams,
  fetchPolicy?: FetchPolicy,
}
