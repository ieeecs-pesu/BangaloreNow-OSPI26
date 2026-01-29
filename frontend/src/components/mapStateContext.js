import { createContext, useContext } from 'react';

export const MapStateContext = createContext();

export const useMapState = () => {
  const context = useContext(MapStateContext);
  if (!context) {
    throw new Error('useMapState must be used within MapStateProvider');
  }
  return context;
};
