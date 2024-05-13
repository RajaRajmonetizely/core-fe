import { AuthState } from './auth/auth.slice';

export interface AppState {
  readonly auth: AuthState;
}

export interface ActionWithPayload<T, P> {
  readonly type: T;
  readonly payload: P;
}

export interface ActionWithoutPayload<T> {
  readonly type: T;
}
