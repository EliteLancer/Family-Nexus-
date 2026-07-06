import { useMemo } from 'react';
import { Person, TreeLayout } from '../types';
import { calculateLayout } from '../utils/layout';

export function useTreeLayout(
  people: Record<string, Person>,
  orientation: 'TB' | 'LR' = 'TB',
  collapsedNodeIds: Set<string> = new Set()
) {
  const layout = useMemo(
    () => calculateLayout(people, orientation, collapsedNodeIds),
    [people, orientation, collapsedNodeIds]
  );

  const nodesArr = useMemo(() => Object.values(layout.nodes), [layout.nodes]);

  const generationsInTree = useMemo(
    () => nodesArr.map(n => n.generation),
    [nodesArr]
  );

  const maxGen = useMemo(
    () => (generationsInTree.length > 0 ? Math.max(...generationsInTree) : 3),
    [generationsInTree]
  );

  const minNodeX = useMemo(
    () => (nodesArr.length > 0 ? Math.min(...nodesArr.map(n => n.x)) : 0),
    [nodesArr]
  );

  return { layout, nodesArr, maxGen, minNodeX };
}
