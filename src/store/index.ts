import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import { persistStorage } from '@/utils/storage';
import { nuvoApi } from './api';
import authReducer from './slices/authSlice';
import lunaReducer from './slices/lunaSlice';
import uiReducer from './slices/uiSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  luna: lunaReducer,
  ui: uiReducer,
  [nuvoApi.reducerPath]: nuvoApi.reducer,
});

const persistedReducer = persistReducer(
  { key: 'nuvo-root', storage: persistStorage, whitelist: ['auth', 'ui'] },
  rootReducer,
);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(nuvoApi.middleware),
});

setupListeners(store.dispatch);

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
