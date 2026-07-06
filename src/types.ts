/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Gender = 'male' | 'female' | 'other';

export interface Person {
  id: string; // e.g., "FM-000001"
  name: string;
  gender: Gender;
  dob: string; // YYYY-MM-DD
  dod?: string; // YYYY-MM-DD
  marriageDate?: string; // YYYY-MM-DD (stored on person or union, let's store on person or describe in relation)
  profession: string;
  city: string;
  living: boolean;
  notes: string; // Max 300 chars
  photo: string; // Primary avatar image (URL or data URL)
  gallery: string[]; // Additional photos (URLs or data URLs)
  taggedIn?: string[]; // Photos this person is tagged in (Base64 or URL)
  
  // Minimal relationships stored
  spouseIds: string[];
  parentIds: string[];
  childIds: string[];
  
  createdAt: string;
  updatedAt: string;
}

export interface FamilyTreeData {
  people: Record<string, Person>;
}

// Layout coordinate types
export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  generation: number;
  gender: Gender;
  person: Person;
}

export interface LayoutLink {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  type: 'marriage' | 'parent-child' | 'sibling';
  fromId: string;
  toId: string;
  color?: string;
}

export interface TreeLayout {
  nodes: Record<string, LayoutNode>;
  links: LayoutLink[];
  width: number;
  height: number;
}
