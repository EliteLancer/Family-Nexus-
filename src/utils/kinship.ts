import { Person } from '../types';

export interface PathStep {
  id: string;
  relation: string;
}

// BFS solver to find shortest path of relationships
export function getShortestPath(
  sourceId: string,
  targetId: string,
  allPeople: Record<string, Person>
): PathStep[] | null {
  if (!allPeople[sourceId] || !allPeople[targetId]) return null;
  if (sourceId === targetId) return [{ id: sourceId, relation: 'Self' }];

  const queue: { id: string; path: PathStep[] }[] = [];
  queue.push({ id: sourceId, path: [{ id: sourceId, relation: 'Self' }] });
  const visited = new Set<string>([sourceId]);

  while (queue.length > 0) {
    const { id, path } = queue.shift()!;
    if (id === targetId) {
      return path;
    }

    const p = allPeople[id];
    if (!p) continue;

    const neighbors: PathStep[] = [];

    // Parents
    p.parentIds.forEach(pid => {
      neighbors.push({ id: pid, relation: 'Parent' });
    });

    // Spouses
    p.spouseIds.forEach(sid => {
      neighbors.push({ id: sid, relation: 'Spouse' });
    });

    // Children
    p.childIds.forEach(cid => {
      neighbors.push({ id: cid, relation: 'Child' });
    });

    // Siblings
    Object.values(allPeople).forEach(other => {
      if (other.id !== id && other.parentIds.length > 0 && p.parentIds.length > 0) {
        const sharesParent = other.parentIds.some(pid => p.parentIds.includes(pid));
        if (sharesParent) {
          neighbors.push({ id: other.id, relation: 'Sibling' });
        }
      }
    });

    for (const n of neighbors) {
      if (!visited.has(n.id)) {
        visited.add(n.id);
        queue.push({
          id: n.id,
          path: [...path, { id: n.id, relation: n.relation }]
        });
      }
    }
  }
  return null;
}

// Helper to calculate exact biological/familial relation name
export function calculateKinshipDescription(
  sourceId: string,
  targetId: string,
  allPeople: Record<string, Person>
): string {
  if (sourceId === targetId) return "Self";
  
  const source = allPeople[sourceId];
  const target = allPeople[targetId];
  if (!source || !target) return "Relative";
  const targetGender = target.gender;

  // Helper to find all blood ancestors of a person along with distance
  const getAncestorsWithDistance = (id: string) => {
    const ancestors: Record<string, number> = {};
    const queue: { id: string; dist: number }[] = [{ id, dist: 0 }];
    const visited = new Set<string>([id]);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      ancestors[curr.id] = curr.dist;

      const p = allPeople[curr.id];
      if (p) {
        p.parentIds.forEach(pid => {
          if (!visited.has(pid)) {
            visited.add(pid);
            queue.push({ id: pid, dist: curr.dist + 1 });
          }
        });
      }
    }
    return ancestors;
  };

  const sourceAncestors = getAncestorsWithDistance(sourceId);
  const targetAncestors = getAncestorsWithDistance(targetId);

  // Find a common ancestor
  let bestLcaId: string | null = null;
  let minDistSum = Infinity;
  let bestDa = Infinity;
  let bestDb = Infinity;

  Object.keys(sourceAncestors).forEach(ancestorId => {
    if (ancestorId in targetAncestors) {
      const da = sourceAncestors[ancestorId];
      const db = targetAncestors[ancestorId];
      if (da + db < minDistSum) {
        minDistSum = da + db;
        bestLcaId = ancestorId;
        bestDa = da;
        bestDb = db;
      }
    }
  });

  if (bestLcaId) {
    const da = bestDa;
    const db = bestDb;

    // 1. Direct Ancestor / Descendant
    if (da === 0) {
      if (db === 1) return targetGender === 'female' ? "Daughter" : "Son";
      if (db === 2) return targetGender === 'female' ? "Granddaughter" : "Grandson";
      if (db > 2) {
        const greats = "Great-".repeat(db - 2);
        return `${greats}${targetGender === 'female' ? "Granddaughter" : "Grandson"}`;
      }
    }

    if (db === 0) {
      if (da === 1) return targetGender === 'female' ? "Mother" : "Father";
      if (da === 2) return targetGender === 'female' ? "Grandmother" : "Grandfather";
      if (da > 2) {
        const greats = "Great-".repeat(da - 2);
        return `${greats}${targetGender === 'female' ? "Grandmother" : "Grandfather"}`;
      }
    }

    // 2. Siblings & Cousins
    if (da === 1 && db === 1) {
      return targetGender === 'female' ? "Sister" : "Brother";
    }

    // Aunts / Uncles / Nieces / Nephews
    if (da === 2 && db === 1) {
      return targetGender === 'female' ? "Aunt" : "Uncle";
    }
    if (da === 1 && db === 2) {
      return targetGender === 'female' ? "Niece" : "Nephew";
    }
    if (da > 2 && db === 1) {
      const greats = "Great-".repeat(da - 2);
      return `${greats}${targetGender === 'female' ? "Aunt" : "Uncle"}`;
    }
    if (da === 1 && db > 2) {
      const greats = "Great-".repeat(db - 2);
      return `${greats}${targetGender === 'female' ? "Niece" : "Nephew"}`;
    }

    // Cousins
    if (da >= 2 && db >= 2) {
      const cousinOrdinal = Math.min(da, db) - 1;
      const removals = Math.abs(da - db);
      
      let ordinalStr = "First";
      if (cousinOrdinal === 2) ordinalStr = "Second";
      if (cousinOrdinal === 3) ordinalStr = "Third";
      if (cousinOrdinal > 3) ordinalStr = `${cousinOrdinal}th`;

      let removalStr = "";
      if (removals === 1) removalStr = " Once Removed";
      if (removals === 2) removalStr = " Twice Removed";
      if (removals > 2) removalStr = ` ${removals} Times Removed`;

      return `${ordinalStr} Cousin${removalStr}`;
    }
  }

  // Spouses & In-laws
  for (const spouseId of source.spouseIds) {
    if (spouseId === targetId) return "Spouse";
    const spouse = allPeople[spouseId];
    if (spouse) {
      if (spouse.childIds.includes(targetId)) return targetGender === 'female' ? "Step-daughter" : "Step-son";
      // Spouse's siblings (brother-in-law, sister-in-law)
      const isSpouseSibling = spouse.parentIds.length > 0 &&
        target.parentIds.length > 0 &&
        spouse.parentIds.some(pid => target.parentIds.includes(pid));
      if (isSpouseSibling) {
        return targetGender === 'female' ? "Sister-in-law" : "Brother-in-law";
      }
    }
  }

  return "Relative";
}
