import { useEffect, useState } from 'react';
import { subscribeAssignments } from '../services/assignments';
import type { Assignment } from '../types';

type State = {
  assignments: Assignment[];
  loading: boolean;
  error: Error | null;
};

export function useAssignments(groupId: string | null): State {
  const [state, setState] = useState<State>({
    assignments: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!groupId) {
      setState({ assignments: [], loading: false, error: null });
      return;
    }

    setState({ assignments: [], loading: true, error: null });
    const unsubscribe = subscribeAssignments(
      groupId,
      (assignments) => setState({ assignments, loading: false, error: null }),
      (error) => setState((prev) => ({ ...prev, loading: false, error })),
    );

    return () => unsubscribe();
  }, [groupId]);

  return state;
}
