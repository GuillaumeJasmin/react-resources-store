import {
  AxiosInstance,
  AxiosRequestConfig as AxiosRequestConfigBase,
} from 'axios';
import { Store } from 'redux';

export type ActionType =
  | 'READ_PENDING'
  | 'CREATE_PENDING'
  | 'UPDATE_PENDING'
  | 'DELETE_PENDING'
  | 'READ_SUCCEEDED'
  | 'CREATE_SUCCEEDED'
  | 'UPDATE_SUCCEEDED'
  | 'DELETE_SUCCEEDED'
  | 'READ_FAILED'
  | 'CREATE_FAILED'
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
}

export interface ReducersConfig {
  [resourceType: string]: {
    [relationKey: string]: string | [string, string];
  };
}
