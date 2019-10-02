import { ReducersConfig } from './types';
import { createReducers } from './createReducers';

interface CreateAxiosReduxHookOuput {
  reducers: ReturnType<typeof createReducers>
  config: ReducersConfig
}

export function createAxiosReduxHook(config: ReducersConfig): CreateAxiosReduxHookOuput {
  return {
    reducers: createReducers(config),
    config,
  };
}
