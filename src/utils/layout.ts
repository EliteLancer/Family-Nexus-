/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Person, TreeLayout, LayoutNode, LayoutLink } from '../types';

const CARD_WIDTH = 220;
const CARD_HEIGHT = 100;
const SPOUSE_GAP = 40;
const NODE_GAP = 60;
const ROW_GAP = 220;

export function getHiddenNodeIds(
  people: Record<string, Person>,
  collapsedNodeIds: Set<string>
): Set<string> {
  const hidden = new Set<string>();
  const queue: string[] = [];

  for (const collapsedId of collapsedNodeIds) {
    const person = people[collapsedId];
    if (person) {
      queue.push(...person.childIds);
    }
  }

  const visited = new Set<string>();
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    hidden.add(currentId);

    const person = people[currentId];
    if (person) {
      queue.push(...person.childIds);
      for (const spouseId of person.spouseIds) {
        hidden.add(spouseId);
      }
    }
  }

  return hidden;
}

export function calculateLayout(
  allPeople: Record<string, Person>,
  orientation: 'TB' | 'LR' = 'TB',
  collapsedNodeIds: Set<string> = new Set()
): TreeLayout {
  const hiddenNodeIds = getHiddenNodeIds(allPeople, collapsedNodeIds);
  const people: Record<string, Person> = {};
  for (const id in allPeople) {
    if (!hiddenNodeIds.has(id)) {
      const p = allPeople[id];
      people[id] = {
        ...p,
        spouseIds: p.spouseIds.filter(sid => !hiddenNodeIds.has(sid)),
        parentIds: p.parentIds.filter(pid => !hiddenNodeIds.has(pid)),
        childIds: p.childIds.filter(cid => !hiddenNodeIds.has(cid)),
      };
    }
  }

  const ids = Object.keys(people);
  if (ids.length === 0) {
    return { nodes: {}, links: [], width: 0, height: 0 };
  }

  // 1. Calculate Generations
  // We can determine generation levels using BFS from an anchor.
  // Find a logical anchor (someone with no parents, or the first person)
  const generations: Record<string, number> = {};
  const visited = new Set<string>();

  // Determine a starting anchor node
  let anchorId = ids[0];
  // Prefer someone who is "Self" or has parents but no children, or has child but no parents
  const noParents = ids.filter(id => people[id].parentIds.length === 0);
  if (noParents.length > 0) {
    anchorId = noParents[0];
  }

  // Let's use a BFS queue to assign relative generations
  // Start the anchor at generation 2 (Parents) or 3 (Self)
  const queue: { id: string; gen: number }[] = [{ id: anchorId, gen: 3 }];
  visited.add(anchorId);

  while (queue.length > 0) {
    const { id, gen } = queue.shift()!;
    generations[id] = gen;

    const person = people[id];
    if (!person) continue;

    // Process parents (generation above: gen - 1)
    for (const parentId of person.parentIds) {
      if (!visited.has(parentId)) {
        visited.add(parentId);
        queue.push({ id: parentId, gen: gen - 1 });
      }
    }

    // Process spouses (same generation: gen)
    for (const spouseId of person.spouseIds) {
      if (!visited.has(spouseId)) {
        visited.add(spouseId);
        queue.push({ id: spouseId, gen: gen });
      }
    }

    // Process children (generation below: gen + 1)
    for (const childId of person.childIds) {
      if (!visited.has(childId)) {
        visited.add(childId);
        queue.push({ id: childId, gen: gen + 1 });
      }
    }
  }

  // Process any disconnected nodes
  for (const id of ids) {
    if (!visited.has(id)) {
      generations[id] = 3; // Default generation
      visited.add(id);
    }
  }

  // Normalize generations so the minimum generation is 0
  const genValues = Object.values(generations);
  const minGen = Math.min(...genValues, 0);
  for (const id of ids) {
    generations[id] = generations[id] - minGen;
  }

  // Group individuals by generation
  const generationGroups: Record<number, string[]> = {};
  for (const id of ids) {
    const gen = generations[id];
    if (!generationGroups[gen]) {
      generationGroups[gen] = [];
    }
    generationGroups[gen].push(id);
  }

  // We want to construct married unions to place them side by side.
  // A union is defined by a pair of spouses.
  interface Union {
    id: string; // e.g., "U-spouseA-spouseB"
    spouseA: string;
    spouseB: string;
    children: string[];
    marriageDate?: string;
  }

  const unions: Record<string, Union> = {};
  const processedSpousePairs = new Set<string>();

  for (const id of ids) {
    const person = people[id];
    for (const spouseId of person.spouseIds) {
      const pairKey = [id, spouseId].sort().join('&');
      if (!processedSpousePairs.has(pairKey)) {
        processedSpousePairs.add(pairKey);
        
        // Find children belonging to both (or either, but let's find common children)
        const commonChildren = person.childIds.filter(cid => 
          people[spouseId]?.childIds.includes(cid) || people[cid]?.parentIds.includes(spouseId)
        );

        // If no common children, find children of either where parentIds contains both
        const unionId = `union_${id}_${spouseId}`;
        unions[unionId] = {
          id: unionId,
          spouseA: id,
          spouseB: spouseId,
          children: commonChildren.length > 0 ? commonChildren : person.childIds, // Fallback to spouseA's children if no intersection
          marriageDate: person.marriageDate || people[spouseId]?.marriageDate,
        };
      }
    }
  }

  // Track layout coordinates
  const nodeX: Record<string, number> = {};
  const nodeY: Record<string, number> = {};

  // For each generation, layout elements horizontally.
  // We want to place unions together, and unmarried individuals alone.
  const activeGens = Object.keys(generationGroups).map(Number).sort((a, b) => a - b);

  // Keep track of elements in each generation
  // An element is either a single person ID or a union ID.
  type GenElement = 
    | { type: 'single'; id: string }
    | { type: 'union'; id: string; union: Union };

  const genElements: Record<number, GenElement[]> = {};
  const personToUnion: Record<string, string> = {};

  for (const gen of activeGens) {
    const pIds = generationGroups[gen];
    const elements: GenElement[] = [];
    const usedInUnion = new Set<string>();

    // First find unions in this generation
    for (const unionId in unions) {
      const u = unions[unionId];
      if (generations[u.spouseA] === gen && generations[u.spouseB] === gen) {
        elements.push({ type: 'union', id: unionId, union: u });
        usedInUnion.add(u.spouseA);
        usedInUnion.add(u.spouseB);
        personToUnion[u.spouseA] = unionId;
        personToUnion[u.spouseB] = unionId;
      }
    }

    // Now add singles
    for (const id of pIds) {
      if (!usedInUnion.has(id)) {
        elements.push({ type: 'single', id });
      }
    }

    // Sort elements to align children with parents if possible
    // (A simple heuristic is to sort elements based on their parents' horizontal positions)
    genElements[gen] = elements;
  }

  // Initial horizontal positioning:
  // Let's do a top-down pass to position items.
  // If we are at the top generation, space them out evenly.
  // If we are at lower generations, center child elements under their parents' unions.
  for (let i = 0; i < activeGens.length; i++) {
    const gen = activeGens[i];
    const elements = genElements[gen] || [];
    const y = gen * ROW_GAP + 100; // Vertical level

    if (i === 0) {
      // Top generation: place side-by-side
      let currentX = 0;
      for (const el of elements) {
        if (el.type === 'single') {
          nodeX[el.id] = currentX;
          nodeY[el.id] = y;
          currentX += CARD_WIDTH + NODE_GAP;
        } else {
          // Spouse A
          nodeX[el.union.spouseA] = currentX;
          nodeY[el.union.spouseA] = y;
          // Spouse B
          nodeX[el.union.spouseB] = currentX + CARD_WIDTH + SPOUSE_GAP;
          nodeY[el.union.spouseB] = y;
          
          currentX += CARD_WIDTH * 2 + SPOUSE_GAP + NODE_GAP;
        }
      }
    } else {
      // Lower generations: position based on parent union midpoints
      let currentX = 0;
      const placed = new Set<string>();

      // Put parents centered or calculate positions based on parents
      for (const el of elements) {
        if (el.type === 'single') {
          const person = people[el.id];
          // Find if parents are placed
          const parentUnions = person.parentIds
            .map(pid => personToUnion[pid])
            .filter(Boolean);

          if (parentUnions.length > 0) {
            const pUnionId = parentUnions[0];
            const pUnion = unions[pUnionId];
            const pMidX = (nodeX[pUnion.spouseA] + nodeX[pUnion.spouseB] + CARD_WIDTH) / 2;
            
            // Put below the parent midpoint
            nodeX[el.id] = pMidX - CARD_WIDTH / 2;
          } else {
            // Unconnected or no placed parents, place at end
            nodeX[el.id] = currentX;
          }
          nodeY[el.id] = y;
          currentX = Math.max(currentX, nodeX[el.id] + CARD_WIDTH + NODE_GAP);
        } else {
          // Union
          const spouseA = people[el.union.spouseA];
          const spouseB = people[el.union.spouseB];
          
          // Check if either spouse has parents placed
          const parentUnions = [...spouseA.parentIds, ...spouseB.parentIds]
            .map(pid => personToUnion[pid])
            .filter(Boolean);

          if (parentUnions.length > 0) {
            const pUnionId = parentUnions[0];
            const pUnion = unions[pUnionId];
            const pMidX = (nodeX[pUnion.spouseA] + nodeX[pUnion.spouseB] + CARD_WIDTH) / 2;
            
            // Center the union under parent union midpoint
            const unionWidth = CARD_WIDTH * 2 + SPOUSE_GAP;
            nodeX[el.union.spouseA] = pMidX - unionWidth / 2;
            nodeX[el.union.spouseB] = pMidX - unionWidth / 2 + CARD_WIDTH + SPOUSE_GAP;
          } else {
            nodeX[el.union.spouseA] = currentX;
            nodeX[el.union.spouseB] = currentX + CARD_WIDTH + SPOUSE_GAP;
          }
          nodeY[el.union.spouseA] = y;
          nodeY[el.union.spouseB] = y;
          
          currentX = Math.max(currentX, nodeX[el.union.spouseB] + CARD_WIDTH + NODE_GAP);
        }
      }
    }

    // Resolve Overlaps for this generation (Scan left-to-right and push)
    resolveOverlaps(elements, nodeX, nodeY, unions);
  }

  // 3. Bottom-Up Pass to center parents over their children if children are wider
  for (let i = activeGens.length - 2; i >= 0; i--) {
    const gen = activeGens[i];
    const elements = genElements[gen] || [];

    for (const el of elements) {
      if (el.type === 'union') {
        const u = el.union;
        if (u.children.length > 0) {
          // Find midpoint of children
          const validChildXs = u.children
            .map(cid => nodeX[cid])
            .filter(x => x !== undefined);

          if (validChildXs.length > 0) {
            const minChildX = Math.min(...validChildXs);
            const maxChildX = Math.max(...validChildXs);
            const childrenMidX = (minChildX + maxChildX + CARD_WIDTH) / 2;

            const unionWidth = CARD_WIDTH * 2 + SPOUSE_GAP;
            const currentMidX = (nodeX[u.spouseA] + nodeX[u.spouseB] + CARD_WIDTH) / 2;
            const shift = childrenMidX - currentMidX;

            // Shift spouses of this union
            nodeX[u.spouseA] += shift;
            nodeX[u.spouseB] += shift;
          }
        }
      }
    }

    // Re-resolve overlaps from left-to-right after shifting
    resolveOverlaps(elements, nodeX, nodeY, unions);
  }

  // 4. Construct LayoutNodes and LayoutLinks
  const nodes: Record<string, LayoutNode> = {};
  const links: LayoutLink[] = [];

  for (const id of ids) {
    const person = people[id];
    const lx = nodeX[id] ?? 0;
    const ly = nodeY[id] ?? 0;
    nodes[id] = {
      id,
      x: orientation === 'LR' ? ly * 1.5 : lx,
      y: orientation === 'LR' ? lx : ly,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      generation: generations[id],
      gender: person.gender,
      person,
    };
  }

  // Generate Links:
  const processedMarriageLinks = new Set<string>();
  for (const unionId in unions) {
    const u = unions[unionId];
    const spouseANode = nodes[u.spouseA];
    const spouseBNode = nodes[u.spouseB];
    if (spouseANode && spouseBNode) {
      const linkId = `m_${u.spouseA}_${u.spouseB}`;
      
      if (orientation === 'LR') {
        const isATop = spouseANode.y < spouseBNode.y;
        const topNode = isATop ? spouseANode : spouseBNode;
        const bottomNode = isATop ? spouseBNode : spouseANode;
        
        links.push({
          id: linkId,
          from: { x: topNode.x + CARD_WIDTH / 2, y: topNode.y + CARD_HEIGHT },
          to: { x: bottomNode.x + CARD_WIDTH / 2, y: bottomNode.y },
          type: 'marriage',
          fromId: topNode.id,
          toId: bottomNode.id,
        });

        const unionMidpoint = {
          x: topNode.x + CARD_WIDTH / 2,
          y: (topNode.y + CARD_HEIGHT + bottomNode.y) / 2,
        };

        for (const childId of u.children) {
          const childNode = nodes[childId];
          if (childNode) {
            links.push({
              id: `pc_${unionId}_${childId}`,
              from: unionMidpoint,
              to: { x: childNode.x, y: childNode.y + CARD_HEIGHT / 2 },
              type: 'parent-child',
              fromId: unionId,
              toId: childId,
            });
          }
        }
      } else {
        const isALeft = spouseANode.x < spouseBNode.x;
        const leftNode = isALeft ? spouseANode : spouseBNode;
        const rightNode = isALeft ? spouseBNode : spouseANode;

        links.push({
          id: linkId,
          from: { x: leftNode.x + CARD_WIDTH, y: leftNode.y + CARD_HEIGHT / 2 },
          to: { x: rightNode.x, y: rightNode.y + CARD_HEIGHT / 2 },
          type: 'marriage',
          fromId: leftNode.id,
          toId: rightNode.id,
        });

        const unionMidpoint = {
          x: (leftNode.x + CARD_WIDTH + rightNode.x) / 2,
          y: leftNode.y + CARD_HEIGHT / 2,
        };

        for (const childId of u.children) {
          const childNode = nodes[childId];
          if (childNode) {
            links.push({
              id: `pc_${unionId}_${childId}`,
              from: unionMidpoint,
              to: { x: childNode.x + CARD_WIDTH / 2, y: childNode.y },
              type: 'parent-child',
              fromId: unionId,
              toId: childId,
            });
          }
        }
      }
    }
  }

  // Handle children of single parents
  for (const id of ids) {
    const person = people[id];
    const isSingleParent = person.childIds.length > 0 && person.spouseIds.length === 0;
    if (isSingleParent) {
      const parentNode = nodes[id];
      if (parentNode) {
        for (const childId of person.childIds) {
          const childNode = nodes[childId];
          if (childNode) {
            if (orientation === 'LR') {
              links.push({
                id: `pc_single_${id}_${childId}`,
                from: { x: parentNode.x + CARD_WIDTH, y: parentNode.y + CARD_HEIGHT / 2 },
                to: { x: childNode.x, y: childNode.y + CARD_HEIGHT / 2 },
                type: 'parent-child',
                fromId: id,
                toId: childId,
              });
            } else {
              links.push({
                id: `pc_single_${id}_${childId}`,
                from: { x: parentNode.x + CARD_WIDTH / 2, y: parentNode.y + CARD_HEIGHT },
                to: { x: childNode.x + CARD_WIDTH / 2, y: childNode.y },
                type: 'parent-child',
                fromId: id,
                toId: childId,
              });
            }
          }
        }
      }
    }
  }

  // Compute total boundaries
  const allXs = Object.values(nodes).map(n => n.x);
  const allYs = Object.values(nodes).map(n => n.y);
  const minX = Math.min(...allXs, 0) - 200;
  const maxX = Math.max(...allXs, 1000) + 400;
  const minY = Math.min(...allYs, 0) - 100;
  const maxY = Math.max(...allYs, 600) + 300;

  return {
    nodes,
    links,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function resolveOverlaps(
  elements: any[],
  nodeX: Record<string, number>,
  nodeY: Record<string, number>,
  unions: Record<string, any>
) {
  // Sort elements by their current X coordinate
  const elementCoords = elements.map(el => {
    if (el.type === 'single') {
      return { el, x: nodeX[el.id] || 0, width: CARD_WIDTH };
    } else {
      const u = el.union;
      const minX = Math.min(nodeX[u.spouseA], nodeX[u.spouseB]);
      const unionWidth = CARD_WIDTH * 2 + SPOUSE_GAP;
      return { el, x: minX, width: unionWidth };
    }
  });

  elementCoords.sort((a, b) => a.x - b.x);

  // Scan and push right elements if overlapping
  for (let idx = 0; idx < elementCoords.length - 1; idx++) {
    const cur = elementCoords[idx];
    const next = elementCoords[idx + 1];
    const curRight = cur.x + cur.width;
    const overlap = curRight + NODE_GAP - next.x;

    if (overlap > 0) {
      // Shift next (and all subsequent elements)
      next.x += overlap;
      if (next.el.type === 'single') {
        nodeX[next.el.id] += overlap;
      } else {
        const u = next.el.union;
        nodeX[u.spouseA] += overlap;
        nodeX[u.spouseB] += overlap;
      }
      
      // Update our local array to reflect the shift for subsequent passes
      for (let k = idx + 1; k < elementCoords.length; k++) {
        if (k > idx + 1) {
          elementCoords[k].x += overlap;
          if (elementCoords[k].el.type === 'single') {
            nodeX[elementCoords[k].el.id] += overlap;
          } else {
            const u = elementCoords[k].el.union;
            nodeX[u.spouseA] += overlap;
            nodeX[u.spouseB] += overlap;
          }
        }
      }
    }
  }
}
