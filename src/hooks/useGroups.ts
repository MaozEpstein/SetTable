import { useEffect, useState } from 'react';
import { subscribeToMyGroups } from '../services/groups';
import type { Group } from '../types';

type State = {
  groups: Group[];
  loading: boolean;
  error: Error | null;
};

export function useGroups(uid: string | null): State {
  const [state, setState] = useState<State>({
    groups: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!uid) {
      setState({ groups: [], loading: false, error: null });
      return;
    }

    setState({ groups: [], loading: true, error: null });
    const unsubscribe = subscribeToMyGroups(
      uid,
      (groups) => setState({ groups, loading: false, error: null }),
      (error) => setState((prev) => ({ ...prev, loading: false, error })),
    );

    return () => unsubscribe();
  }, [uid]);

  return state;
}
