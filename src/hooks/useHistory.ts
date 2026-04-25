import { useEffect, useState } from 'react';
import { subscribeHistory } from '../services/history';
import type { ShabbatHistoryEntry } from '../types';

type State = {
  entries: ShabbatHistoryEntry[];
  loading: boolean;
  error: Error | null;
};

export function useHistory(groupId: string | null): State {
  const [state, setState] = useState<State>({
    entries: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!groupId) {
      setState({ entries: [], loading: false, error: null });
      return;
    }

    setState({ entries: [], loading: true, error: null });
    const unsubscribe = subscribeHistory(
      groupId,
      (entries) => setState({ entries, loading: false, error: null }),
      (error) => setState((prev) => ({ ...prev, loading: false, error })),
    );
    return () => unsubscribe();
  }, [groupId]);

  return state;
}
