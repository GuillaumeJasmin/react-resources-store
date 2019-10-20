import React, { createContext } from 'react';
import { createStore, combineReducers } from 'redux';
import { createReducers } from './createReducers';
import { ContextValue } from './types';

export const Context = createContext<ContextValue>(
  null as any,
);

function createLocalStore(schema: ContextValue['schema']) {
  const reducers = combineReducers(createReducers(schema));
  return createStore(reducers);
}

interface ContextValueProps {
  schema: ContextValue['schema']
  store?: ContextValue['store']
  resolver: ContextValue['resolver']
}

interface Props {
  value: ContextValueProps;
  children: any;
}

export function Provider(props: Props) {
  const { value, children } = props;

  const providerValue = {
    store: createLocalStore(value.schema),
    ...value,
  };

  return (
    <Context.Provider value={providerValue}>
      {children}
    </Context.Provider>
  );
}
