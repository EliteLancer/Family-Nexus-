import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Person } from '../types';
import { INITIAL_PEOPLE } from '../utils/seedData';
import { supabase } from '../utils/supabase';
import { exportToGEDCOM, importFromGEDCOM } from '../utils/gedcom';

const MAX_UNDO_STACK = 15;

export function useFamilyData(
  user: any,
  isGuest: boolean,
  showToast: (msg: string, type?: 'success' | 'error') => void
) {
  const [people, setPeople] = useState<Record<string, Person>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const undoStackRef = useRef<Record<string, Person>[]>([]);
  const fileUploadRef = useRef<HTMLInputElement>(null);
  const gedcomUploadRef = useRef<HTMLInputElement>(null);

  // Configurable root user
  const [rootUserId, setRootUserId] = useState<string>(() => {
    return localStorage.getItem('family_nexus_root_user') || 'FM-000011';
  });

  const setRootUser = useCallback((id: string) => {
    setRootUserId(id);
    localStorage.setItem('family_nexus_root_user', id);
  }, []);

  const getRootId = useCallback((): string => {
    if (people[rootUserId]) return rootUserId;
    const keys = Object.keys(people);
    return keys.length > 0 ? keys[0] : '';
  }, [people, rootUserId]);

  // Load Tree Data
  useEffect(() => {
    async function loadTree() {
      setIsLoading(true);
      if (user) {
        // Load from Supabase
        try {
          const { data, error } = await supabase
            .from('family_trees')
            .select('people')
            .eq('user_id', user.id)
            .maybeSingle();

          if (error) {
            console.error('Error fetching tree from Supabase:', error);
            showToast('Failed to load tree from cloud storage.', 'error');
            // fallback to local or seed
            const saved = localStorage.getItem('family_nexus_people');
            setPeople(saved ? JSON.parse(saved) : INITIAL_PEOPLE);
          } else if (data && data.people) {
            setPeople(data.people);
          } else {
            // First time login - save seed data to Supabase
            const { error: insertError } = await supabase
              .from('family_trees')
              .insert({ user_id: user.id, people: INITIAL_PEOPLE });

            if (insertError) {
              console.error('Error creating initial tree in Supabase:', insertError);
            }
            setPeople(INITIAL_PEOPLE);
          }
        } catch (e) {
          console.error(e);
          setPeople(INITIAL_PEOPLE);
        }
      } else if (isGuest) {
        // Load from localStorage or default
        const saved = localStorage.getItem('family_nexus_people');
        if (saved) {
          try {
            setPeople(JSON.parse(saved));
          } catch (e) {
            setPeople(INITIAL_PEOPLE);
          }
        } else {
          setPeople(INITIAL_PEOPLE);
        }
      }
      setIsLoading(false);
    }
    loadTree();
  }, [user, isGuest, showToast]);

  // Supabase postgres Realtime subscription (Collaborative Edits TIER 6)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`family-changes-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_trees',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).people) {
            const cloudPeople = (payload.new as any).people;
            setPeople(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(cloudPeople)) {
                return cloudPeople;
              }
              return prev;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const pushUndo = useCallback(() => {
    undoStackRef.current = [...undoStackRef.current.slice(-MAX_UNDO_STACK + 1), { ...people }];
  }, [people]);

  // Cloud/local save utility
  const saveTree = useCallback(
    async (updatedPeople: Record<string, Person>) => {
      setPeople(updatedPeople);
      if (user) {
        const { error } = await supabase
          .from('family_trees')
          .upsert({
            user_id: user.id,
            people: updatedPeople,
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error saving tree to Supabase:', error);
          showToast('Failed to sync tree changes to cloud.', 'error');
        }
      } else if (isGuest) {
        localStorage.setItem('family_nexus_people', JSON.stringify(updatedPeople));
      }
    },
    [user, isGuest, showToast]
  );

  const undo = useCallback(() => {
    if (undoStackRef.current.length === 0) {
      showToast('Nothing to undo.', 'error');
      return;
    }
    const previous = undoStackRef.current.pop()!;
    saveTree(previous);
    showToast('Undo successful!', 'success');
  }, [saveTree, showToast]);

  const canUndo = undoStackRef.current.length > 0;

  const handleUpdatePerson = useCallback((updated: Person) => {
    pushUndo();
    const newPeople = { ...people, [updated.id]: updated };
    saveTree(newPeople);
    showToast(`Profile details for ${updated.name} updated successfully!`, 'success');
  }, [people, pushUndo, saveTree, showToast]);

  const handleDeletePerson = useCallback((id: string) => {
    pushUndo();
    const personName = people[id]?.name || 'Family member';
    const updated = { ...people };
    delete updated[id];
    for (const pid in updated) {
      const p = { ...updated[pid] };
      p.spouseIds = p.spouseIds.filter(x => x !== id);
      p.parentIds = p.parentIds.filter(x => x !== id);
      p.childIds = p.childIds.filter(x => x !== id);
      updated[pid] = p;
    }
    saveTree(updated);
    setSelectedId(null);
    showToast(`${personName} removed successfully from the family registry.`, 'success');
  }, [people, pushUndo, saveTree, showToast]);

  const handleAddRelationship = useCallback((newPerson: Person, config: { type: 'parent' | 'child' | 'spouse' | 'sibling'; anchorId: string }) => {
    pushUndo();
    const updated = { ...people };
    const anchor = { ...updated[config.anchorId] };
    const np = { ...newPerson };

    if (config.type === 'parent') {
      anchor.parentIds = [...anchor.parentIds, np.id];
      np.childIds = [anchor.id];
      if (anchor.parentIds.length > 1) {
        const otherParentId = anchor.parentIds[0];
        const otherParent = { ...updated[otherParentId] };
        otherParent.spouseIds = [...otherParent.spouseIds, np.id];
        np.spouseIds = [otherParentId];
        updated[otherParentId] = otherParent;
      }
    } else if (config.type === 'spouse') {
      anchor.spouseIds = [...anchor.spouseIds, np.id];
      np.spouseIds = [anchor.id];
    } else if (config.type === 'child') {
      anchor.childIds = [...anchor.childIds, np.id];
      np.parentIds = [anchor.id];
      if (anchor.spouseIds.length > 0) {
        const spouseId = anchor.spouseIds[0];
        const spouse = { ...updated[spouseId] };
        spouse.childIds = [...spouse.childIds, np.id];
        np.parentIds = [...np.parentIds, spouseId];
        updated[spouseId] = spouse;
      }
    } else if (config.type === 'sibling') {
      np.parentIds = [...anchor.parentIds];
      for (const parentId of anchor.parentIds) {
        const parent = { ...updated[parentId] };
        parent.childIds = [...parent.childIds, np.id];
        updated[parentId] = parent;
      }
    }

    updated[np.id] = np;
    updated[anchor.id] = anchor;
    saveTree(updated);
    setSelectedId(np.id);
    showToast(`Added ${np.name} as a relative to the tree!`, 'success');
  }, [people, pushUndo, saveTree, showToast]);

  // Import Validation and Sanitization (Security Tier 5)
  const validateAndSanitize = (imported: any): Record<string, Person> | null => {
    if (typeof imported !== 'object' || imported === null) return null;
    const sanitized: Record<string, Person> = {};
    for (const key of Object.keys(imported)) {
      const p = imported[key];
      if (!p || typeof p !== 'object') return null;
      if (typeof p.id !== 'string' || typeof p.name !== 'string') return null;

      const cleanString = (val: any) => typeof val === 'string' ? val.replace(/<[^>]*>/g, '').trim() : '';

      sanitized[key] = {
        id: cleanString(p.id),
        name: cleanString(p.name),
        gender: (p.gender === 'male' || p.gender === 'female') ? p.gender : 'other',
        dob: cleanString(p.dob),
        dod: p.dod ? cleanString(p.dod) : undefined,
        profession: cleanString(p.profession),
        city: cleanString(p.city),
        living: typeof p.living === 'boolean' ? p.living : true,
        notes: cleanString(p.notes).slice(0, 300),
        photo: typeof p.photo === 'string' && (p.photo.startsWith('http') || p.photo.startsWith('data:image')) ? p.photo : '',
        gallery: Array.isArray(p.gallery) ? p.gallery.filter((g: any) => typeof g === 'string' && (g.startsWith('http') || g.startsWith('data:image'))) : [],
        spouseIds: Array.isArray(p.spouseIds) ? p.spouseIds.filter((id: any) => typeof id === 'string') : [],
        parentIds: Array.isArray(p.parentIds) ? p.parentIds.filter((id: any) => typeof id === 'string') : [],
        childIds: Array.isArray(p.childIds) ? p.childIds.filter((id: any) => typeof id === 'string') : [],
        createdAt: cleanString(p.createdAt) || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    return sanitized;
  };

  const handleExportTree = useCallback(() => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(people, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', 'family_nexus_lineage.json');
    dlAnchorElem.click();
    showToast('Lineage tree database exported successfully!', 'success');
  }, [people, showToast]);

  const handleImportTree = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        const validated = validateAndSanitize(imported);
        if (validated) {
          pushUndo();
          saveTree(validated);
          setSelectedId(null);
          showToast('Lineage backup file imported successfully!', 'success');
        } else {
          showToast('Failed to import: Invalid or insecure data structure.', 'error');
        }
      } catch (err) {
        showToast('Failed to parse uploaded backup file. Ensure it is valid JSON.', 'error');
      }
    };
    reader.readAsText(file);
  }, [pushUndo, saveTree, showToast]);

  // GEDCOM Import/Export (Tier 6)
  const handleExportGEDCOM = useCallback(() => {
    const gedText = exportToGEDCOM(people);
    const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(gedText);
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', 'family_nexus_lineage.ged');
    dlAnchorElem.click();
    showToast('Lineage tree exported to GEDCOM successfully!', 'success');
  }, [people, showToast]);

  const handleImportGEDCOM = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const gedText = event.target?.result as string;
        const imported = importFromGEDCOM(gedText);
        const validated = validateAndSanitize(imported);
        if (validated && Object.keys(validated).length > 0) {
          pushUndo();
          saveTree(validated);
          setSelectedId(null);
          showToast('GEDCOM file imported successfully!', 'success');
        } else {
          showToast('Failed to import GEDCOM: Invalid or empty tree structure.', 'error');
        }
      } catch (err) {
        showToast('Failed to import GEDCOM: File parsing error.', 'error');
      }
    };
    reader.readAsText(file);
  }, [pushUndo, saveTree, showToast]);

  const handleResetTree = useCallback(() => {
    pushUndo();
    saveTree(INITIAL_PEOPLE);
    setSelectedId(null);
    showToast('Family tree reset to default seed data successfully!', 'success');
  }, [pushUndo, saveTree, showToast]);

  return {
    people, selectedId, setSelectedId,
    rootUserId, getRootId, setRootUser,
    handleUpdatePerson, handleDeletePerson, handleAddRelationship,
    handleExportTree, handleImportTree, handleResetTree,
    handleExportGEDCOM, handleImportGEDCOM,
    fileUploadRef, gedcomUploadRef,
    undo, canUndo, isLoading
  };
}
