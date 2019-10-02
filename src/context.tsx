import React, { createContext } from 'react';
import { AxiosReduxContextValue } from './types';

export const AxiosReduxContext = createContext<AxiosReduxContextValue>(
  null as any,
);

interface Props {
  value: AxiosReduxContextValue;
  children: any;
}

export function AxiosReduxProvider(props: Props) {
  const { value, children } = props;
  return (
    <AxiosReduxContext.Provider value={value}>
      {children}
    </AxiosReduxContext.Provider>
  );
}
