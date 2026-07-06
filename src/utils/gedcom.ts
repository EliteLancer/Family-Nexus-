import { Person, Gender } from '../types';

/**
 * Basic GEDCOM Export
 */
export function exportToGEDCOM(people: Record<string, Person>): string {
  let ged = '0 HEAD\n1 CHAR UTF-8\n1 GEDC\n2 VERS 5.5.1\n2 FORM LINEAGE-LINKED\n';

  const unions: { id: string; husband?: string; wife?: string; children: string[] }[] = [];
  const processedUnions = new Set<string>();

  // 1. Output Individual Records
  Object.values(people).forEach(p => {
    ged += `0 @${p.id}@ INDI\n`;
    const nameParts = p.name.split(' ');
    const firstName = nameParts.slice(0, -1).join(' ');
    const lastName = nameParts[nameParts.length - 1] || '';
    ged += `1 NAME ${firstName} /${lastName}/\n`;
    ged += `2 GIVN ${firstName}\n`;
    ged += `2 SURN ${lastName}\n`;
    ged += `1 SEX ${p.gender === 'male' ? 'M' : p.gender === 'female' ? 'F' : 'U'}\n`;
    
    if (p.dob) {
      ged += `1 BIRT\n2 DATE ${formatGEDCOMDate(p.dob)}\n`;
      if (p.city) {
        ged += `2 PLAC ${p.city}\n`;
      }
    }
    
    if (!p.living) {
      ged += `1 DEAT Y\n`;
      if (p.dod) {
        ged += `2 DATE ${formatGEDCOMDate(p.dod)}\n`;
      }
    }

    if (p.profession) {
      ged += `1 OCCU ${p.profession}\n`;
    }

    if (p.notes) {
      ged += `1 NOTE ${p.notes}\n`;
    }

    // Prepare family unions
    p.spouseIds.forEach(sid => {
      const pairKey = [p.id, sid].sort().join('&');
      if (!processedUnions.has(pairKey)) {
        processedUnions.has(pairKey);
        processedUnions.add(pairKey);
        
        const husband = p.gender === 'male' ? p.id : sid;
        const wife = p.gender === 'female' ? p.id : sid;
        const children = p.childIds.filter(cid => 
          people[sid]?.childIds.includes(cid) || people[cid]?.parentIds.includes(sid)
        );

        unions.push({
          id: `F${unions.length + 1}`,
          husband: people[husband] ? husband : undefined,
          wife: people[wife] ? wife : undefined,
          children: children
        });
      }
    });
  });

  // 2. Link individuals to families
  Object.values(people).forEach(p => {
    // Add FAMS (Family Spouse) links
    unions.forEach(u => {
      if (u.husband === p.id || u.wife === p.id) {
        ged += `0 @${p.id}@ INDI\n1 FAMS @${u.id}@\n`;
      }
    });

    // Add FAMC (Family Child) links
    unions.forEach(u => {
      if (u.children.includes(p.id)) {
        ged += `0 @${p.id}@ INDI\n1 FAMC @${u.id}@\n`;
      }
    });
  });

  // 3. Output Family Records
  unions.forEach(u => {
    ged += `0 @${u.id}@ FAM\n`;
    if (u.husband) ged += `1 HUSB @${u.husband}@\n`;
    if (u.wife) ged += `1 WIFE @${u.wife}@\n`;
    u.children.forEach(cid => {
      ged += `1 CHIL @${cid}@\n`;
    });
  });

  ged += '0 TRLR\n';
  return ged;
}

/**
 * Basic GEDCOM Parser
 */
export function importFromGEDCOM(gedcomText: string): Record<string, Person> {
  const people: Record<string, Person> = {};
  const lines = gedcomText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let currentIndiId: string | null = null;
  let currentFamId: string | null = null;
  
  let tempPerson: Partial<Person> & { spouseIds: string[]; parentIds: string[]; childIds: string[] } = {
    spouseIds: [],
    parentIds: [],
    childIds: []
  };

  interface FamRecord {
    husband?: string;
    wife?: string;
    children: string[];
  }
  const families: Record<string, FamRecord> = {};

  let activeTag: string | null = null; // 'BIRT', 'DEAT', etc.

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(\d+)\s+@([^@]+)@\s+(INDI|FAM)$/);
    
    if (match) {
      const [, level, id, type] = match;
      if (type === 'INDI') {
        if (currentIndiId && tempPerson.id) {
          people[tempPerson.id] = finalizeParsedPerson(tempPerson);
        }
        currentIndiId = id;
        currentFamId = null;
        activeTag = null;
        tempPerson = {
          id: id,
          name: '',
          gender: 'other',
          dob: '',
          dod: undefined,
          profession: '',
          city: '',
          living: true,
          notes: '',
          photo: '',
          gallery: [],
          spouseIds: [],
          parentIds: [],
          childIds: []
        };
      } else if (type === 'FAM') {
        if (currentIndiId && tempPerson.id) {
          people[tempPerson.id] = finalizeParsedPerson(tempPerson);
          currentIndiId = null;
        }
        currentFamId = id;
        families[id] = { children: [] };
        activeTag = null;
      }
      continue;
    }

    const standardMatch = line.match(/^(\d+)\s+(\w+)(?:\s+(.*))?$/);
    if (!standardMatch) continue;

    const [, levelStr, tag, value] = standardMatch;
    const level = parseInt(levelStr, 10);

    if (currentIndiId && tempPerson) {
      if (level === 1) {
        activeTag = tag;
        if (tag === 'NAME') {
          // Parse name, e.g. "Oliver /Sterling/" -> "Oliver Sterling"
          tempPerson.name = (value || '').replace(/\//g, '').trim();
        } else if (tag === 'SEX') {
          const sex = (value || 'U').toUpperCase();
          tempPerson.gender = sex === 'M' ? 'male' : sex === 'F' ? 'female' : 'other';
        } else if (tag === 'OCCU') {
          tempPerson.profession = value || '';
        } else if (tag === 'NOTE') {
          tempPerson.notes = value || '';
        } else if (tag === 'DEAT') {
          tempPerson.living = false;
        }
      } else if (level === 2 && activeTag) {
        if (tag === 'DATE') {
          const dateStr = parseGEDCOMDate(value || '');
          if (activeTag === 'BIRT') {
            tempPerson.dob = dateStr;
          } else if (activeTag === 'DEAT') {
            tempPerson.dod = dateStr;
            tempPerson.living = false;
          }
        } else if (tag === 'PLAC') {
          if (activeTag === 'BIRT') {
            tempPerson.city = value || '';
          }
        }
      }
    } else if (currentFamId && families[currentFamId]) {
      const fam = families[currentFamId];
      if (level === 1) {
        const idValue = (value || '').replace(/@/g, '').trim();
        if (tag === 'HUSB') {
          fam.husband = idValue;
        } else if (tag === 'WIFE') {
          fam.wife = idValue;
        } else if (tag === 'CHIL') {
          fam.children.push(idValue);
        }
      }
    }
  }

  // Save the last individual
  if (currentIndiId && tempPerson.id) {
    people[tempPerson.id] = finalizeParsedPerson(tempPerson);
  }

  // Process family links back into Person objects
  Object.values(families).forEach(fam => {
    const husb = fam.husband;
    const wife = fam.wife;
    const children = fam.children;

    if (husb && wife) {
      if (people[husb] && !people[husb].spouseIds.includes(wife)) {
        people[husb].spouseIds.push(wife);
      }
      if (people[wife] && !people[wife].spouseIds.includes(husb)) {
        people[wife].spouseIds.push(husb);
      }
    }

    children.forEach(cid => {
      const child = people[cid];
      if (child) {
        if (husb && !child.parentIds.includes(husb)) {
          child.parentIds.push(husb);
          if (people[husb] && !people[husb].childIds.includes(cid)) {
            people[husb].childIds.push(cid);
          }
        }
        if (wife && !child.parentIds.includes(wife)) {
          child.parentIds.push(wife);
          if (people[wife] && !people[wife].childIds.includes(cid)) {
            people[wife].childIds.push(cid);
          }
        }
      }
    });
  });

  return people;
}

function finalizeParsedPerson(temp: any): Person {
  return {
    id: temp.id || '',
    name: temp.name || 'Unknown',
    gender: temp.gender || 'other',
    dob: temp.dob || '1980-01-01',
    dod: temp.dod || undefined,
    profession: temp.profession || '',
    city: temp.city || '',
    living: temp.living !== undefined ? temp.living : true,
    notes: temp.notes || '',
    photo: temp.photo || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300&h=300`,
    gallery: temp.gallery || [],
    spouseIds: temp.spouseIds || [],
    parentIds: temp.parentIds || [],
    childIds: temp.childIds || [],
    createdAt: temp.createdAt || new Date().toISOString(),
    updatedAt: temp.updatedAt || new Date().toISOString()
  };
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function formatGEDCOMDate(dateStr: string): string {
  // YYYY-MM-DD -> DD MMM YYYY
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const month = MONTHS[monthIdx] || 'JAN';
  return `${day} ${month} ${year}`;
}

function parseGEDCOMDate(gedDate: string): string {
  // e.g. "14 APR 1912" or "APR 1912" or "1912"
  const parts = gedDate.split(/\s+/);
  let day = '01';
  let month = '01';
  let year = '1980';

  if (parts.length === 3) {
    day = String(parseInt(parts[0], 10)).padStart(2, '0');
    const monthIdx = MONTHS.indexOf(parts[1].toUpperCase());
    month = String(monthIdx !== -1 ? monthIdx + 1 : 1).padStart(2, '0');
    year = parts[2];
  } else if (parts.length === 2) {
    const monthIdx = MONTHS.indexOf(parts[0].toUpperCase());
    month = String(monthIdx !== -1 ? monthIdx + 1 : 1).padStart(2, '0');
    year = parts[1];
  } else if (parts.length === 1 && /^\d+$/.test(parts[0])) {
    year = parts[0];
  }

  return `${year}-${month}-${day}`;
}
