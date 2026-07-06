/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Person } from '../types';

// Professional avatar base: white skin, suit, clean-shaven, no accessories, pleasant smile
const avatarBase = (seed: string, hair: string, hairColor: string, mouth: string, eyes: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&skinColor=ffdbb4&clothing=blazerAndShirt&clothesColor=262e33&top=${hair}&hairColor=${hairColor}&mouth=${mouth}&eyes=${eyes}&eyebrows=defaultNatural&facialHairProbability=0&accessoriesProbability=0&style=circle&backgroundColor=f0f0f0`;

export const INITIAL_PEOPLE: Record<string, Person> = {
  'FM-000001': {
    id: 'FM-000001',
    name: 'Arthur Sterling',
    gender: 'male',
    dob: '1912-04-14',
    dod: '1998-11-02',
    profession: 'Architect & Scholar',
    city: 'London',
    living: false,
    notes: 'Patriarch of the Sterling family. Renowned architect who helped rebuild London postwar. Inspired generations with his love for classical sketches.',
    photo: avatarBase('Arthur', 'shortFlat', '2c1b18', 'smile', 'default'),
    gallery: [
      avatarBase('Arthur', 'shortFlat', '2c1b18', 'smile', 'default'),
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=500'
    ],
    spouseIds: ['FM-000002'],
    parentIds: [],
    childIds: ['FM-000003', 'FM-000005'],
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z'
  },
  'FM-000002': {
    id: 'FM-000002',
    name: 'Eleanor Vance',
    gender: 'female',
    dob: '1915-11-28',
    dod: '2005-03-18',
    profession: 'Novelist',
    city: 'London',
    living: false,
    notes: 'Award-winning literary novelist. Her works captured the resilience of 20th-century families. Known for her garden poetry gatherings in Hampstead.',
    photo: avatarBase('Eleanor', 'straight01', 'd6b370', 'twinkle', 'default'),
    gallery: [
      avatarBase('Eleanor', 'straight01', 'd6b370', 'twinkle', 'default'),
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=500'
    ],
    spouseIds: ['FM-000001'],
    parentIds: [],
    childIds: ['FM-000003', 'FM-000005'],
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z'
  },
  'FM-000003': {
    id: 'FM-000003',
    name: 'Charles Sterling',
    gender: 'male',
    dob: '1940-05-12',
    profession: 'History Professor',
    city: 'Oxford',
    living: true,
    notes: 'Professor emeritus of Oxford History. Devoted his life to conserving family artifacts and documenting lineage. Plays standard cello at local ensembles.',
    photo: avatarBase('Charles', 'theCaesarAndSidePart', '2c1b18', 'smile', 'default'),
    gallery: [
      avatarBase('Charles', 'theCaesarAndSidePart', '2c1b18', 'smile', 'default')
    ],
    spouseIds: ['FM-000004'],
    parentIds: ['FM-000001', 'FM-000002'],
    childIds: ['FM-000007', 'FM-000009'],
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z'
  },
  'FM-000004': {
    id: 'FM-000004',
    name: 'Beatrice DuPont',
    gender: 'female',
    dob: '1943-09-02',
    profession: 'Concert Pianist',
    city: 'Oxford',
    living: true,
    notes: 'Born in Paris, Beatrice moved to the UK after marrying Charles. Performed piano recitals across Europe. Lover of orchids and classic jazz.',
    photo: avatarBase('Beatrice', 'bob', 'd6b370', 'smile', 'happy'),
    gallery: [
      avatarBase('Beatrice', 'bob', 'd6b370', 'smile', 'happy')
    ],
    spouseIds: ['FM-000003'],
    parentIds: [],
    childIds: ['FM-000007', 'FM-000009'],
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z'
  },
  'FM-000005': {
    id: 'FM-000005',
    name: 'Victoria Sterling',
    gender: 'female',
    dob: '1944-07-19',
    dod: '2021-09-15',
    profession: 'Fine Artist',
    city: 'Rome',
    living: false,
    notes: 'Vibrant oil painter who captured Italian landscapes. Lived her life in Rome and Florence. Her gallery remains open to guests near Vatican City.',
    photo: avatarBase('Victoria', 'straight02', '2c1b18', 'twinkle', 'default'),
    gallery: [
      avatarBase('Victoria', 'straight02', '2c1b18', 'twinkle', 'default')
    ],
    spouseIds: ['FM-000006'],
    parentIds: ['FM-000001', 'FM-000002'],
    childIds: [],
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z'
  },
  'FM-000006': {
    id: 'FM-000006',
    name: 'Giovanni Rossi',
    gender: 'male',
    dob: '1941-03-30',
    profession: 'Sculptor',
    city: 'Rome',
    living: true,
    notes: 'Renowned marble sculptor who collaborated with Victoria on monumental public works. Collects antique mechanical watches and fountains.',
    photo: avatarBase('Giovanni', 'theCaesar', '2c1b18', 'default', 'default'),
    gallery: [
      avatarBase('Giovanni', 'theCaesar', '2c1b18', 'default', 'default')
    ],
    spouseIds: ['FM-000005'],
    parentIds: [],
    childIds: [],
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z'
  },
  'FM-000007': {
    id: 'FM-000007',
    name: 'Julian Sterling',
    gender: 'male',
    dob: '1968-12-05',
    profession: 'Diplomat',
    city: 'London',
    living: true,
    notes: 'British diplomat advocating international environmental policy. Loves running along the Thames. Known for building massive library archives.',
    photo: avatarBase('Julian', 'shortWaved', '2c1b18', 'smile', 'default'),
    gallery: [
      avatarBase('Julian', 'shortWaved', '2c1b18', 'smile', 'default')
    ],
    spouseIds: ['FM-000008'],
    parentIds: ['FM-000003', 'FM-000004'],
    childIds: ['FM-000011', 'FM-000013'],
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z'
  },
  'FM-000008': {
    id: 'FM-000008',
    name: 'Clara Chang',
    gender: 'female',
    dob: '1971-08-14',
    profession: 'Pediatric Surgeon',
    city: 'London',
    living: true,
    notes: 'Lead pediatric surgeon at Great Ormond Street Hospital. Enjoys gardening and high-altitude hiking in the Himalayas. Passionate educator.',
    photo: avatarBase('Clara', 'straightAndStrand', '2c1b18', 'smile', 'happy'),
    gallery: [
      avatarBase('Clara', 'straightAndStrand', '2c1b18', 'smile', 'happy')
    ],
    spouseIds: ['FM-000007'],
    parentIds: [],
    childIds: ['FM-000011', 'FM-000013'],
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z'
  },
  'FM-000009': {
    id: 'FM-000009',
    name: 'Diana Sterling',
    gender: 'female',
    dob: '1972-10-23',
    profession: 'Architect',
    city: 'Boston',
    living: true,
    notes: 'Principal at an eco-architectural firm in Boston. Continuing Arthur\'s design legacy. Dedicated rower, cyclist, and classical sketcher.',
    photo: avatarBase('Diana', 'longButNotTooLong', 'd6b370', 'twinkle', 'default'),
    gallery: [
      avatarBase('Diana', 'longButNotTooLong', 'd6b370', 'twinkle', 'default')
    ],
    spouseIds: ['FM-000010'],
    parentIds: ['FM-000003', 'FM-000004'],
    childIds: ['FM-000014'],
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z'
  },
  'FM-000010': {
    id: 'FM-000010',
    name: 'Thomas Baker',
    gender: 'male',
    dob: '1969-02-18',
    profession: 'Investigative Journalist',
    city: 'Boston',
    living: true,
    notes: 'Pulitzer Prize-winning investigative journalist. Writes about climate and urban design. Enthusiastic sailor and historical map archivist.',
    photo: avatarBase('Thomas', 'shortRound', 'd6b370', 'smile', 'default'),
    gallery: [
      avatarBase('Thomas', 'shortRound', 'd6b370', 'smile', 'default')
    ],
    spouseIds: ['FM-000009'],
    parentIds: [],
    childIds: ['FM-000014'],
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z'
  },
  'FM-000011': {
    id: 'FM-000011',
    name: 'Oliver Sterling',
    gender: 'male',
    dob: '1998-04-12',
    profession: 'Software Engineer',
    city: 'London',
    living: true,
    notes: 'Tech enthusiast who codes open-source projects. Maintains the family tree database. Loves mechanical keyboards and specialized roasting espresso.',
    photo: avatarBase('Oliver', 'shortCurly', '2c1b18', 'smile', 'happy'),
    gallery: [
      avatarBase('Oliver', 'shortCurly', '2c1b18', 'smile', 'happy'),
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=500'
    ],
    spouseIds: ['FM-000012'],
    parentIds: ['FM-000007', 'FM-000008'],
    childIds: ['FM-000015'],
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z'
  },
  'FM-000012': {
    id: 'FM-000012',
    name: 'Emily Clark',
    gender: 'female',
    dob: '1999-07-25',
    profession: 'Ethnobotanist',
    city: 'London',
    living: true,
    notes: 'Researches traditional plant usages at Kew Gardens. Avid oil painter who captures organic plant structures. Married Oliver in a summer garden ceremony.',
    photo: avatarBase('Emily', 'straight01', '2c1b18', 'smile', 'happy'),
    gallery: [
      avatarBase('Emily', 'straight01', '2c1b18', 'smile', 'happy')
    ],
    spouseIds: ['FM-000011'],
    parentIds: [],
    childIds: ['FM-000015'],
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z'
  },
  'FM-000013': {
    id: 'FM-000013',
    name: 'Sophia Sterling',
    gender: 'female',
    dob: '2001-11-09',
    profession: 'Creative Designer',
    city: 'New York',
    living: true,
    notes: 'UI/UX and editorial designer in Brooklyn. Passionate about typography, minimalist poster design, and analog film photography. Loves flea markets.',
    photo: avatarBase('Sophia', 'bob', '2c1b18', 'twinkle', 'happy'),
    gallery: [
      avatarBase('Sophia', 'bob', '2c1b18', 'twinkle', 'happy'),
      'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=500'
    ],
    spouseIds: [],
    parentIds: ['FM-000007', 'FM-000008'],
    childIds: [],
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z'
  },
  'FM-000014': {
    id: 'FM-000014',
    name: 'Leo Baker',
    gender: 'male',
    dob: '2002-08-31',
    profession: 'Filmmaker & Editor',
    city: 'Boston',
    living: true,
    notes: 'Film student at NYU Tisch. Directing independent documentary shorts exploring immigrant communities and urban geography.',
    photo: avatarBase('Leo', 'shortFlat', 'd6b370', 'default', 'default'),
    gallery: [
      avatarBase('Leo', 'shortFlat', 'd6b370', 'default', 'default')
    ],
    spouseIds: [],
    parentIds: ['FM-000009', 'FM-000010'],
    childIds: [],
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z'
  },
  'FM-000015': {
    id: 'FM-000015',
    name: 'Maya Sterling',
    gender: 'female',
    dob: '2024-02-15',
    profession: 'Toddler',
    city: 'London',
    living: true,
    notes: 'The youngest member of the current generation. Bright-eyed, curious, and loves listening to Beatrice\'s classical piano recordings.',
    photo: avatarBase('Maya', 'bob', 'd6b370', 'smile', 'happy'),
    gallery: [
      avatarBase('Maya', 'bob', 'd6b370', 'smile', 'happy')
    ],
    spouseIds: [],
    parentIds: ['FM-000011', 'FM-000012'],
    childIds: [],
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z'
  }
};
