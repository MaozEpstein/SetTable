import { useEffect, useState } from 'react';
import { subscribeFoods } from '../services/foods';
import type { Food } from '../types';

type State = {
  foods: Food[];
  loading: boolean;
  error: Error | null;
};

export function useFoods(groupId: string | null): State {
  const [state, setState] = useState<State>({
    foods: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!groupId) {
      setState({ foods: [], loading: false, error: null });
      return;
    }

    setState({ foods: [], loading: true, error: null });
    const unsubscribe = subscribeFoods(
      groupId,
      (foods) => setState({ foods, loading: false, error: null }),
      (error) => setState((prev) => ({ ...prev, loading: false, error })),
    );

    return () => unsubscribe();
  }, [groupId]);

  return state;
}
