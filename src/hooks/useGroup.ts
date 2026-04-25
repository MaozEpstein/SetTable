import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { Group } from '../types';

type State = {
  group: Group | null;
  loading: boolean;
  error: Error | null;
};

export function useGroup(groupId: string | null): State {
  const [state, setState] = useState<State>({
    group: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!groupId) {
      setState({ group: null, loading: false, error: null });
      return;
    }

    setState({ group: null, loading: true, error: null });
    const ref = doc(db, 'groups', groupId);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setState({ group: null, loading: false, error: null });
          return;
        }
        const data = snap.data() as Omit<Group, 'id'>;
        setState({
          group: { id: snap.id, ...data },
          loading: false,
          error: null,
        });
      },
      (error) => setState((prev) => ({ ...prev, loading: false, error })),
    );

    return () => unsubscribe();
  }, [groupId]);

  return state;
}
