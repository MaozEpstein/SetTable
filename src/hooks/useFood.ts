import { useEffect, useState } from 'react';
import { subscribeFood } from '../services/foods';
import type { Food } from '../types';

type State = {
  food: Food | null;
  loading: boolean;
  error: Error | null;
};

export function useFood(groupId: string | null, foodId: string | null): State {
  const [state, setState] = useState<State>({
    food: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!groupId || !foodId) {
      setState({ food: null, loading: false, error: null });
      return;
    }
    setState({ food: null, loading: true, error: null });
    const unsubscribe = subscribeFood(
      groupId,
      foodId,
      (food) => setState({ food, loading: false, error: null }),
      (error) => setState((prev) => ({ ...prev, loading: false, error })),
    );
    return () => unsubscribe();
  }, [groupId, foodId]);

  return state;
}
