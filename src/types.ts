import {
  AxiosInstance,
  AxiosRequestConfig as AxiosRequestConfigBase,
} from 'axios';
import { Store } from 'redux';

export type ActionType =
  | 'UPDATE_PENDING'
  | 'DELETE_PENDING'
  | 'UPDATE_SUCCEEDED'
  | 'DELETE_SUCCEEDED'
  | 'UPDATE_FAILED'
  | 'DELETE_FAILED';

export interface AxiosRequestConfig extends AxiosRequestConfigBase {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
}

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

export interface AxiosReduxContextValue<Resources = any> {
  store: Store<StoreState<Resources>>;
  api: AxiosInstance;
  config: ReducersConfig,
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
