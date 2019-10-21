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

interface Props {
  schema: ContextValue['schema']
  store?: ContextValue['store']
  resolver: ContextValue['resolver']
  children: any;
}

export function Provider(props: Props) {
  const { schema, store, resolver, children } = props;

  const providerValue = {
    store: store || createLocalStore(schema),
    schema,
    resolver,
  };

  return (
    <Context.Provider value={providerValue}>
      {children}
    </Context.Provider>
  );
}
