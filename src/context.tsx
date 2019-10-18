import React, { createContext } from 'react';
import { ContextValue } from './types';

export const Context = createContext<ContextValue>(
  null as any,
);

interface Props {
  value: ContextValue;
  children: any;
}

export function Provider(props: Props) {
  const { value, children } = props;
  return (
    <Context.Provider value={value}>
      {children}
    </Context.Provider>
  );
}
