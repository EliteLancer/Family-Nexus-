/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Person, Gender } from '../types';
import { 
  X, Calendar, Briefcase, MapPin, Heart, AlertTriangle, 
  Trash2, Plus, Edit3, Save, Image, ChevronLeft, ChevronRight, Upload, Route, Crosshair,
  Tag, UserPlus, UserMinus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getShortestPath, calculateKinshipDescription } from '../utils/kinship';
import { HISTORICAL_MILESTONES } from '../utils/historicalMilestones';

interface ProfileSidebarProps {
  personId: string | null;
  people: Record<string, Person>;
  isAdmin: boolean;
  onClose: () => void;
  onSelectPerson: (id: string) => void;
  onUpdatePerson: (person: Person) => void;
  onDeletePerson: (id: string) => void;
  onAddRelationship: (type: 'parent' | 'child' | 'spouse' | 'sibling', anchorId: string) => void;
  generation?: number;
  onHighlightPath?: (pathNodeIds: string[] | null) => void;
  onPhotoClick?: (images: string[], index: number) => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
  isCompareMode: boolean;
  onToggleCompareMode: () => void;
  tracerTargetId: string;
  onTracerTargetChange: (id: string) => void;
}

export default function ProfileSidebar({
  personId,
  people,
  isAdmin,
  onClose,
  onSelectPerson,
  onUpdatePerson,
  onDeletePerson,
  onAddRelationship,
  generation,
  onHighlightPath,
  onPhotoClick,
  showToast,
  isCompareMode,
  onToggleCompareMode,
  tracerTargetId,
  onTracerTargetChange
}: ProfileSidebarProps) {
  const person = personId ? people[personId] : null;

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGender, setEditGender] = useState<Gender>('male');
  const [editDob, setEditDob] = useState('');
  const [editDod, setEditDod] = useState('');
  const [editMarriageDate, setEditMarriageDate] = useState('');
  const [editProfession, setEditProfession] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editLiving, setEditLiving] = useState(true);
  const [editNotes, setEditNotes] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [editGallery, setEditGallery] = useState<string[]>([]);

  // Gallery slider / detail state
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dragOverAvatar, setDragOverAvatar] = useState(false);
  const [dragOverGallery, setDragOverGallery] = useState(false);

  // Lineage Path Tracer state
  const tracedPath = useMemo(() => {
    if (!person || !tracerTargetId) return null;
    return getShortestPath(person.id, tracerTargetId, people);
  }, [person, tracerTargetId, people]);

  useEffect(() => {
    if (onHighlightPath) {
      if (tracedPath) {
        onHighlightPath(tracedPath.map(s => s.id));
      } else {
        onHighlightPath(null);
      }
    }
  }, [tracedPath, onHighlightPath]);

  // Combine custom uploaded gallery photos + photos tagged in (Tier 6)
  const allImages = useMemo(() => {
    if (!person) return [];
    const gallery = person.gallery || [];
    const tagged = person.taggedIn || [];
    return Array.from(new Set([...gallery, ...tagged]));
  }, [person]);

  // Find all people tagged in the currently active gallery image (Tier 6)
  const taggedPeople = useMemo(() => {
    const currentPhoto = allImages[activeGalleryIndex];
    if (!currentPhoto) return [];
    return Object.values(people).filter(p => p.taggedIn?.includes(currentPhoto));
  }, [people, allImages, activeGalleryIndex]);

  // Template Narrative Bio Generator (Tier 6)
  const narrativeBio = useMemo(() => {
    if (!person) return '';
    if (!person.dob) return `${person.name} registry details are archived in the lineage database.`;
    const birthYear = new Date(person.dob).getFullYear();
    const birthPlace = person.city ? ` in ${person.city}` : "";
    let bio = `${person.name} was born${birthPlace} in ${birthYear}. `;
    
    if (person.profession) {
      bio += `Professionally, ${person.gender === 'female' ? 'she' : person.gender === 'male' ? 'he' : 'they'} worked as a ${person.profession}. `;
    }

    const spouses = person.spouseIds.map(id => people[id]?.name).filter(Boolean);
    if (spouses.length > 0) {
      bio += `Over ${person.gender === 'female' ? 'her' : person.gender === 'male' ? 'his' : 'they'} life, ${person.gender === 'female' ? 'she' : person.gender === 'male' ? 'he' : 'they'} married ${spouses.join(" and ")}. `;
    }

    const children = person.childIds.map(id => people[id]?.name).filter(Boolean);
    if (children.length > 0) {
      bio += `They raised ${children.length} ${children.length === 1 ? 'child' : 'children'}${children.length <= 3 ? ` (${children.join(", ")})` : ""}. `;
    }

    if (!person.living && person.dod) {
      const deathYear = new Date(person.dod).getFullYear();
      const age = deathYear - birthYear;
      bio += `${person.gender === 'female' ? 'She' : person.gender === 'male' ? 'He' : 'They'} lived for ${age} years, passing away in ${deathYear}.`;
    } else if (person.living) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;
      bio += `${person.gender === 'female' ? 'She' : person.gender === 'male' ? 'He' : 'They'} is currently living, aged ${age} years.`;
    }

    return bio;
  }, [person, people]);

  // Cross-reference lifespan with historical milestones (Tier 6)
  const activeMilestones = useMemo(() => {
    if (!person || !person.dob) return [];
    const birthYear = new Date(person.dob).getFullYear();
    const deathYear = person.living ? new Date().getFullYear() : (person.dod ? new Date(person.dod).getFullYear() : new Date().getFullYear());
    return HISTORICAL_MILESTONES.filter(m => m.year >= birthYear && m.year <= deathYear);
  }, [person]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleTracePath = (targetId: string) => {
    onTracerTargetChange(targetId);
  };

  const handleAddTag = (targetPersonId: string) => {
    const photoUrl = allImages[activeGalleryIndex];
    if (!photoUrl) return;
    const targetPerson = people[targetPersonId];
    if (!targetPerson) return;
    
    const updatedTaggedIn = Array.from(new Set([...(targetPerson.taggedIn || []), photoUrl]));
    const updatedPerson = { ...targetPerson, taggedIn: updatedTaggedIn };
    onUpdatePerson(updatedPerson);
    if (showToast) showToast(`Tagged ${targetPerson.name} in this photo!`, 'success');
  };

  const handleRemoveTag = (targetPersonId: string) => {
    const photoUrl = allImages[activeGalleryIndex];
    if (!photoUrl) return;
    const targetPerson = people[targetPersonId];
    if (!targetPerson) return;
    
    const updatedTaggedIn = (targetPerson.taggedIn || []).filter(url => url !== photoUrl);
    const updatedPerson = { ...targetPerson, taggedIn: updatedTaggedIn };
    onUpdatePerson(updatedPerson);
    if (showToast) showToast(`Removed tag for ${targetPerson.name}.`, 'success');
  };

  // Sync edits when person changes or edit mode toggled
  useEffect(() => {
    if (person) {
      setEditName(person.name || '');
      setEditGender(person.gender || 'male');
      setEditDob(person.dob || '');
      setEditDod(person.dod || '');
      setEditMarriageDate(person.marriageDate || '');
      setEditProfession(person.profession || '');
      setEditCity(person.city || '');
      setEditLiving(person.living);
      setEditNotes(person.notes || '');
      setEditPhoto(person.photo || '');
      setEditGallery(person.gallery || []);
      setActiveGalleryIndex(0);
    }
    setIsEditing(false);
    setShowDeleteConfirm(false);
    onTracerTargetChange('');
    if (onHighlightPath) onHighlightPath(null);
  }, [personId, person]);

  if (!person) return null;

  const handleSave = () => {
    if (!editName.trim()) return;

    const updated: Person = {
      ...person,
      name: editName,
      gender: editGender,
      dob: editDob,
      dod: editLiving ? undefined : (editDod || undefined),
      marriageDate: editMarriageDate || undefined,
      profession: editProfession,
      city: editCity,
      living: editLiving,
      notes: editNotes.slice(0, 300), // Max 300 constraint
      photo: editPhoto,
      gallery: editGallery,
      updatedAt: new Date().toISOString()
    };

    onUpdatePerson(updated);
    setIsEditing(false);
  };

  // Convert files to Base64 dataUrls
  const processFile = (file: File, target: 'avatar' | 'gallery') => {
    const maxBytes = 2 * 1024 * 1024; // 2MB limit
    if (file.size > maxBytes) {
      if (showToast) {
        showToast('Image size exceeds 2MB limit. Please upload a smaller image.', 'error');
      } else {
        alert('Image size exceeds 2MB limit. Please upload a smaller image.');
      }
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        if (target === 'avatar') {
          setEditPhoto(dataUrl);
        } else {
          setEditGallery(prev => [...prev, dataUrl]);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent, type: 'avatar' | 'gallery') => {
    e.preventDefault();
    if (type === 'avatar') setDragOverAvatar(true);
    else setDragOverGallery(true);
  };

  const handleDragLeave = (type: 'avatar' | 'gallery') => {
    if (type === 'avatar') setDragOverAvatar(false);
    else setDragOverGallery(false);
  };

  const handleDrop = (e: React.DragEvent, type: 'avatar' | 'gallery') => {
    e.preventDefault();
    if (type === 'avatar') {
      setDragOverAvatar(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        processFile(file, 'avatar');
      }
    } else {
      setDragOverGallery(false);
      const files = Array.from(e.dataTransfer.files) as File[];
      files.forEach(file => {
        if (file.type.startsWith('image/')) {
          processFile(file, 'gallery');
        }
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'avatar' | 'gallery') => {
    const files = e.target.files;
    if (!files) return;
    if (target === 'avatar') {
      if (files[0]) processFile(files[0], 'avatar');
    } else {
      (Array.from(files) as File[]).forEach(file => processFile(file, 'gallery'));
    }
  };

  const removeGalleryImage = (index: number) => {
    setEditGallery(prev => prev.filter((_, i) => i !== index));
    if (activeGalleryIndex >= editGallery.length - 1) {
      setActiveGalleryIndex(Math.max(0, editGallery.length - 2));
    }
  };

  // Cohort names mapping
  const getGenerationCohort = (gen?: number): string => {
    if (gen === undefined) return '';
    switch (gen) {
      case 0: return 'Pioneer Founders (G1)';
      case 1: return 'Mid-Century Heirs (G2)';
      case 2: return 'Contemporary Cohort (G3)';
      case 3: return 'Modern Successors (G4)';
      default: return `Emerging Lineage (G${gen + 1})`;
    }
  };

  // Derive Chronological Events
  const getTimelineEvents = () => {
    const events: { year: number; title: string; desc: string; icon: string }[] = [];
    if (!person) return events;

    // 1. Birth
    if (person.dob) {
      const birthYear = new Date(person.dob).getFullYear();
      events.push({
        year: birthYear,
        title: 'Birth of a Legacy',
        desc: `Born in ${person.city || 'Home City'}.`,
        icon: '🌟'
      });
    }

    // 2. Career
    if (person.profession && person.profession !== 'Toddler' && person.profession !== 'Child' && person.profession !== 'Family Lineage') {
      const birthYear = person.dob ? new Date(person.dob).getFullYear() : 1970;
      events.push({
        year: birthYear + 22, // Approximate career start
        title: 'Career Milestones',
        desc: `Established dynamic paths as a ${person.profession}.`,
        icon: '💼'
      });
    }

    // 3. Spouses
    person.spouseIds.forEach(sid => {
      const sp = people[sid];
      if (sp) {
        const marriageYear = person.marriageDate 
          ? new Date(person.marriageDate).getFullYear()
          : (person.dob ? new Date(person.dob).getFullYear() + 25 : null);
        
        if (marriageYear) {
          events.push({
            year: marriageYear,
            title: `Marriage to ${sp.name.split(' ')[0]}`,
            desc: `Celebrated union with ${sp.name}.`,
            icon: '💍'
          });
        }
      }
    });

    // 4. Children
    person.childIds.forEach(cid => {
      const ch = people[cid];
      if (ch && ch.dob) {
        const childYear = new Date(ch.dob).getFullYear();
        events.push({
          year: childYear,
          title: `Parenthood: ${ch.name.split(' ')[0]}`,
          desc: `Welcomed the birth of child, ${ch.name}.`,
          icon: '👶'
        });
      }
    });

    // 5. Deceased
    if (!person.living) {
      const birthYear = person.dob ? new Date(person.dob).getFullYear() : null;
      const deathYear = person.dod ? new Date(person.dod).getFullYear() : null;
      let age = 82; // default fallback
      let year = birthYear ? birthYear + 82 : 2012;

      if (birthYear && deathYear) {
        age = deathYear - birthYear;
        year = deathYear;
      } else if (person.id === 'FM-000001') {
        age = 86;
        year = 1998;
      } else if (person.id === 'FM-000002') {
        age = 90;
        year = 2005;
      } else if (person.id === 'FM-000005') {
        age = 77;
        year = 2021;
      } else if (birthYear) {
        year = birthYear + age;
      }

      events.push({
        year: year,
        title: 'Laid to Rest',
        desc: `Passed away at age ${age}. Fondly remembered.`,
        icon: '🕊\ufe0f'
      });
    }

    return events.sort((a, b) => a.year - b.year);
  };

  // Human-readable relationship resolvers (Derived fields)
  const renderRelatedClickable = (ids: string[], title: string) => {
    const validIds = ids.filter(id => people[id]);
    if (validIds.length === 0) return null;

    return (
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">{title}</span>
        <div className="flex flex-wrap gap-2">
          {validIds.map(id => {
            const rel = people[id];
            return (
              <button
                key={id}
                onClick={() => onSelectPerson(id)}
                className="flex items-center gap-2 bg-[#1D1E21] hover:bg-neutral-800 border border-neutral-800 rounded-lg py-1.5 px-2.5 text-xs text-white transition-all cursor-pointer group"
              >
                <img
                  src={rel.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rel.name}&skinColor=ffdbb4&clothing=blazerAndShirt&clothesColor=262e33&top=shortFlat&hairColor=2c1b18&mouth=smile&eyes=default&eyebrows=defaultNatural&facialHairProbability=0&accessoriesProbability=0&style=circle&backgroundColor=f0f0f0`}
                  alt={rel.name}
                  className="w-5 h-5 rounded-full object-cover border border-neutral-700 group-hover:border-emerald-500 transition-colors"
                />
                <span className="font-medium group-hover:text-emerald-400 transition-colors">{rel.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Derive other relationships
  const siblings = Object.values(people).filter(p => {
    if (p.id === person.id) return false;
    // Siblings share same parents
    return person.parentIds.length > 0 && 
           p.parentIds.length > 0 && 
           person.parentIds.every(id => p.parentIds.includes(id));
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%', opacity: 0.9 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0.9 }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        id="profile-sidebar"
        className="fixed top-0 right-0 z-40 w-full sm:w-[420px] h-full bg-[#161719] border-l border-neutral-800/80 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800/60 bg-[#1D1E21]/60 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded border border-neutral-700/50">
              {person.id}
            </span>
            {isAdmin && (
              <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/25">
                Admin
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isAdmin && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-300 hover:text-emerald-400 transition-all cursor-pointer"
                title="Edit Details"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 pb-24">
          
          {/* Avatar and Primary Details */}
          {!isEditing ? (
            <div className="flex flex-col items-center text-center space-y-3.5">
              <div className="relative group">
                <img
                  src={person.photo}
                  alt={person.name}
                  referrerPolicy="no-referrer"
                  className="w-28 h-28 rounded-full object-cover border-2 border-neutral-800 shadow-xl group-hover:border-emerald-500/50 transition-all duration-300"
                />
                {!person.living && (
                  <span className="absolute bottom-1 right-1 text-[9px] font-mono tracking-wider bg-black/80 text-neutral-400 border border-neutral-800 px-1.5 py-0.5 rounded-full">
                    Deceased
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-white tracking-tight">{person.name}</h2>
                {generation !== undefined && (
                  <span className="text-[9px] font-mono font-semibold tracking-wider uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-2.5 py-0.5 mt-1 inline-block">
                    {getGenerationCohort(generation)}
                  </span>
                )}
                <div className="flex flex-wrap justify-center gap-2 text-xs text-neutral-400 pt-1">
                  {person.profession && (
                    <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800/80 rounded px-2.5 py-0.5">
                      <Briefcase className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{person.profession}</span>
                    </div>
                  )}
                  {person.city && (
                    <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800/80 rounded px-2.5 py-0.5">
                      <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{person.city}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Edit Form Primary Header
            <div className="space-y-4">
              {/* Photo Upload with drag-and-drop support */}
              <div className="flex flex-col items-center">
                <div
                  onDragOver={(e) => handleDragOver(e, 'avatar')}
                  onDragLeave={() => handleDragLeave('avatar')}
                  onDrop={(e) => handleDrop(e, 'avatar')}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative w-28 h-28 rounded-full border-2 border-dashed cursor-pointer flex flex-col items-center justify-center transition-all ${
                    dragOverAvatar 
                      ? 'border-emerald-500 bg-emerald-500/5' 
                      : 'border-neutral-700 hover:border-emerald-500/60 bg-neutral-900/60'
                  }`}
                >
                  {editPhoto ? (
                    <img
                      src={editPhoto}
                      alt="Avatar Preview"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Upload className="w-6 h-6 text-neutral-500" />
                  )}
                  <div className="absolute inset-0 bg-black/40 hover:bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Image className="w-5 h-5 text-white mb-1" />
                    <span className="text-[10px] text-white font-medium">Upload / Drop</span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'avatar')}
                    className="hidden"
                  />
                </div>
                <span className="text-[10px] text-neutral-500 mt-2">Primary Avatar (Drag & drop image files)</span>
              </div>

              {/* Form Input fields */}
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full mt-1 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 focus:border-emerald-500 focus:outline-none rounded-lg p-2 text-xs text-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Gender</label>
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value as Gender)}
                      className="w-full mt-1 bg-neutral-900 border border-neutral-800 focus:border-emerald-500 focus:outline-none rounded-lg p-2 text-xs text-white transition-all"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Status</label>
                    <select
                      value={editLiving ? 'living' : 'deceased'}
                      onChange={(e) => setEditLiving(e.target.value === 'living')}
                      className="w-full mt-1 bg-neutral-900 border border-neutral-800 focus:border-emerald-500 focus:outline-none rounded-lg p-2 text-xs text-white transition-all"
                    >
                      <option value="living">Living</option>
                      <option value="deceased">Deceased</option>
                    </select>
                  </div>
                </div>

                <div className={`grid ${editLiving ? 'grid-cols-2' : 'grid-cols-3'} gap-3`}>
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Date of Birth</label>
                    <input
                      type="date"
                      value={editDob}
                      onChange={(e) => setEditDob(e.target.value)}
                      className="w-full mt-1 bg-neutral-900 border border-neutral-800 focus:border-emerald-500 focus:outline-none rounded-lg p-2 text-xs text-white transition-all"
                    />
                  </div>
                  {!editLiving && (
                    <div>
                      <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Date of Death</label>
                      <input
                        type="date"
                        value={editDod}
                        onChange={(e) => setEditDod(e.target.value)}
                        className="w-full mt-1 bg-neutral-900 border border-neutral-800 focus:border-emerald-500 focus:outline-none rounded-lg p-2 text-xs text-white transition-all"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Marriage Date (Optional)</label>
                    <input
                      type="date"
                      value={editMarriageDate}
                      onChange={(e) => setEditMarriageDate(e.target.value)}
                      className="w-full mt-1 bg-neutral-900 border border-neutral-800 focus:border-emerald-500 focus:outline-none rounded-lg p-2 text-xs text-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Profession</label>
                    <input
                      type="text"
                      value={editProfession}
                      onChange={(e) => setEditProfession(e.target.value)}
                      placeholder="e.g. Architect"
                      className="w-full mt-1 bg-neutral-900 border border-neutral-800 focus:border-emerald-500 focus:outline-none rounded-lg p-2 text-xs text-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">City</label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      placeholder="e.g. London"
                      className="w-full mt-1 bg-neutral-900 border border-neutral-800 focus:border-emerald-500 focus:outline-none rounded-lg p-2 text-xs text-white transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Biography Notes Section */}
          <div className="space-y-3 border-t border-neutral-800/50 pt-5">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">Biography Notes</span>
            {!isEditing ? (
              <div className="space-y-2.5">
                {narrativeBio && (
                  <p className="text-xs text-neutral-200 leading-relaxed bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/10 font-normal">
                    {narrativeBio}
                  </p>
                )}
                {person.notes && (
                  <p className="text-xs text-neutral-400 leading-relaxed bg-[#1D1E21]/30 rounded-xl p-4 border border-neutral-800/40 italic font-light">
                    {person.notes}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value.slice(0, 300))}
                  placeholder="Tell their story (career highlights, achievements, memories, family facts)..."
                  rows={4}
                  className="w-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 focus:border-emerald-500 focus:outline-none rounded-lg p-3 text-xs text-white transition-all resize-none leading-relaxed"
                />
                <div className="flex justify-between items-center text-[10px]">
                  <span className={editNotes.length >= 300 ? 'text-amber-500 font-medium' : 'text-neutral-500'}>
                    {editNotes.length}/300 characters
                  </span>
                  {editNotes.length >= 300 && (
                    <span className="flex items-center gap-1 text-amber-500">
                      <AlertTriangle className="w-3 h-3" /> Max limit reached
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* World History Milestones during Lifespan */}
          {!isEditing && activeMilestones.length > 0 && (
            <div className="space-y-3 border-t border-neutral-800/50 pt-5">
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" /> World History Context
              </span>
              <div className="relative pl-5 border-l border-neutral-800/40 space-y-4 py-1 ml-1.5 max-h-56 overflow-y-auto custom-scrollbar">
                {activeMilestones.map((m, idx) => (
                  <div key={idx} className="relative group/history">
                    <div className="absolute -left-[25.5px] top-1 w-2.5 h-2.5 rounded-full bg-[#161719] border border-neutral-600 transition-colors group-hover/history:border-emerald-500" />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono font-bold text-neutral-400">
                          {m.year}
                        </span>
                        <span className="text-xs font-medium text-neutral-200">
                          {m.title}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 font-light leading-relaxed pl-1">
                        {m.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historical Timeline Milestones (Traditional seed data eras) */}
          {!isEditing && getTimelineEvents().length > 0 && (
            <div className="space-y-3 border-t border-neutral-800/50 pt-5">
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">Life Milestones Timeline</span>
              <div className="relative pl-5 border-l border-neutral-800/60 space-y-4.5 py-1 ml-1.5">
                {getTimelineEvents().map((ev, idx) => (
                  <div key={idx} className="relative group/timeline">
                    {/* Ring dot */}
                    <div className="absolute -left-[25.5px] top-1 w-2.5 h-2.5 rounded-full bg-[#161719] border-2 border-emerald-500/80 group-hover/timeline:border-emerald-400 group-hover/timeline:scale-110 transition-all shadow-md" />
                    
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 px-1.5 py-0.2 rounded">
                          {ev.year}
                        </span>
                        <span className="text-[11px] font-semibold text-neutral-200">
                          {ev.icon} {ev.title}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 font-light leading-relaxed pl-1">
                        {ev.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photo Gallery with Carousel & Tagging */}
          <div className="space-y-3.5 border-t border-neutral-800/50 pt-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Photo Archive</span>
              {isEditing && (
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex items-center gap-1 text-[10px] bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-1 px-2.5 rounded transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Image
                </button>
              )}
            </div>

            {/* Hidden Gallery Input */}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileChange(e, 'gallery')}
              className="hidden"
            />

            {/* Read-only / Carousel */}
            {!isEditing ? (
              allImages.length > 0 ? (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden bg-black/20 border border-neutral-800 aspect-video group">
                    <img
                      src={allImages[activeGalleryIndex]}
                      alt="Gallery item"
                      className="w-full h-full object-cover cursor-zoom-in"
                      onClick={() => {
                        if (onPhotoClick) onPhotoClick(allImages, activeGalleryIndex);
                      }}
                    />
                    {allImages.length > 1 && (
                      <>
                        <button
                          onClick={() => setActiveGalleryIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setActiveGalleryIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 bg-black/40 px-2 py-0.5 rounded-full">
                          {allImages.map((_, i) => (
                            <span
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full transition-all ${
                                i === activeGalleryIndex ? 'bg-white scale-110' : 'bg-white/40'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Photo Tags Section */}
                  <div className="bg-[#1D1E21]/30 border border-neutral-800/80 rounded-xl p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-neutral-500" /> Tagged People
                      </span>
                      {isAdmin && (
                        <div className="relative group/tagdropdown">
                          <button className="text-[10px] flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-1 px-2 rounded-lg transition-all cursor-pointer">
                            <UserPlus className="w-3 h-3" /> Tag Person
                          </button>
                          <div className="absolute right-0 bottom-full mb-1.5 w-44 bg-[#161719] border border-neutral-800 rounded-xl shadow-xl py-1 z-50 hidden group-hover/tagdropdown:block max-h-36 overflow-y-auto custom-scrollbar">
                            {Object.values(people)
                              .filter(p => p.id !== person.id && !taggedPeople.some(tp => tp.id === p.id))
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map(p => (
                                <button
                                  key={p.id}
                                  onClick={() => handleAddTag(p.id)}
                                  className="w-full text-left px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                                >
                                  {p.name}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {taggedPeople.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {taggedPeople.map(tp => (
                          <div key={tp.id} className="flex items-center gap-1.5 bg-neutral-800/80 border border-neutral-700/50 rounded-lg py-1 px-2 text-[11px] text-neutral-200">
                            <span className="cursor-pointer hover:text-emerald-400 transition-colors" onClick={() => onSelectPerson(tp.id)}>{tp.name}</span>
                            {isAdmin && (
                              <button
                                onClick={() => handleRemoveTag(tp.id)}
                                className="text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer ml-0.5"
                                title="Remove Tag"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-neutral-500 block italic">No people tagged in this photo.</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 bg-neutral-900/40 border border-neutral-800 border-dashed rounded-xl text-neutral-500">
                  <Image className="w-6 h-6 mb-1 text-neutral-600" />
                  <span className="text-[11px]">No gallery images logged.</span>
                </div>
              )
            ) : (
              // Editing Gallery items list
              <div
                onDragOver={(e) => handleDragOver(e, 'gallery')}
                onDragLeave={() => handleDragLeave('gallery')}
                onDrop={(e) => handleDrop(e, 'gallery')}
                className={`grid grid-cols-3 gap-2.5 p-3 rounded-xl border border-dashed transition-all ${
                  dragOverGallery 
                    ? 'border-emerald-500 bg-emerald-500/5' 
                    : 'border-neutral-800 bg-neutral-900/30'
                }`}
              >
                {editGallery.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-neutral-800 group/edit">
                    <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeGalleryImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow transition-all cursor-pointer"
                      title="Remove"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
                <div
                  onClick={() => galleryInputRef.current?.click()}
                  className="aspect-square flex flex-col items-center justify-center border border-dashed border-neutral-700 rounded-lg hover:border-emerald-500 cursor-pointer bg-neutral-900/40 text-neutral-500 hover:text-emerald-400 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-[9px] mt-1">Upload</span>
                </div>
              </div>
            )}
          </div>

          {/* Lineage Path Tracer Solver */}
          {!isEditing && (
            <div className="space-y-3 border-t border-neutral-800/50 pt-5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Route className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Lineage Path Solver
                </span>
                {tracedPath && (
                  <button
                    onClick={() => handleTracePath('')}
                    className="text-[9px] font-mono text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded px-2 py-0.5 transition-all cursor-pointer"
                  >
                    Clear Path
                  </button>
                )}
              </div>
              <p className="text-[10px] text-neutral-400 leading-relaxed font-light">
                Map the exact relationship pathway between <strong className="text-neutral-300 font-medium">{person.name}</strong> and any other member of this lineage tree.
              </p>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <select
                    value={tracerTargetId}
                    onChange={(e) => handleTracePath(e.target.value)}
                    className="flex-1 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 focus:border-amber-500 focus:outline-none rounded-lg p-2 text-xs text-white transition-all cursor-pointer"
                  >
                    <option value="">-- Select Relative to Map --</option>
                    {(Object.values(people) as Person[])
                      .filter(p => p.id !== person.id)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={onToggleCompareMode}
                    className={`p-2 border rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                      isCompareMode 
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                        : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                    title={isCompareMode ? "Click canvas node to set target, or click here to cancel" : "Select comparison target directly from canvas"}
                  >
                    <Crosshair className="w-4 h-4" />
                  </button>
                </div>

                {tracedPath && (
                  <div className="bg-[#1D1E21]/50 border border-neutral-800/80 rounded-xl p-3 space-y-2.5">
                    <div className="flex flex-col gap-1 border-b border-neutral-800/60 pb-2">
                      <span className="text-[9px] font-mono font-bold text-amber-500 tracking-wider uppercase">Calculated Kinship</span>
                      <div className="text-xs font-extrabold text-white">
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/25 rounded px-2.5 py-1 inline-block mt-0.5 shadow-sm shadow-amber-950/20">
                          {calculateKinshipDescription(person.id, tracerTargetId, people)}
                        </span>
                      </div>
                    </div>
                    
                    <span className="text-[9px] font-mono font-bold text-neutral-400 tracking-wider uppercase block">Shortest Lineage Path:</span>
                    <div className="relative pl-4 border-l border-amber-500/30 space-y-3.5 py-1 ml-1.5">
                      {tracedPath.map((step, idx) => {
                        const relative = people[step.id];
                        if (!relative) return null;

                        const getStepRelationLabel = (rel: string, gender: string) => {
                          if (rel === 'Self') return 'Starting Profile';
                          if (rel === 'Spouse') return 'Spouse of';
                          if (rel === 'Parent') return gender === 'female' ? 'Mother' : 'Father';
                          if (rel === 'Child') return gender === 'female' ? 'Daughter' : 'Son';
                          if (rel === 'Sibling') return gender === 'female' ? 'Sister' : 'Brother';
                          return 'Relative';
                        };

                        return (
                          <div key={idx} className="relative group/step">
                            {/* Dot */}
                            <div className={`absolute -left-[20.5px] top-1 w-2 h-2 rounded-full border-2 transition-all ${
                              idx === 0 
                                ? 'bg-[#0B0C0E] border-neutral-400' 
                                : idx === tracedPath.length - 1 
                                  ? 'bg-[#0B0C0E] border-amber-500 animate-pulse scale-110' 
                                  : 'bg-[#0B0C0E] border-amber-500/60'
                            }`} />
                            
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-mono font-medium text-neutral-500 block uppercase tracking-wider">
                                {getStepRelationLabel(step.relation, relative.gender)}
                              </span>
                              <button
                                onClick={() => onSelectPerson(relative.id)}
                                className="text-xs font-semibold text-neutral-200 hover:text-amber-400 text-left transition-colors cursor-pointer block"
                              >
                                {relative.name}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Core Derived & Direct Relationships */}
          <div className="space-y-4 border-t border-neutral-800/50 pt-5">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">Lineage & Connections</span>
            
            {/* Direct Parents */}
            {renderRelatedClickable(person.parentIds, 'Parents')}

            {/* Spouses */}
            {renderRelatedClickable(person.spouseIds, 'Spouses')}

            {/* Siblings */}
            {siblings.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Siblings (Derived)</span>
                <div className="flex flex-wrap gap-2">
                  {siblings.map(sib => (
                    <button
                      key={sib.id}
                      onClick={() => onSelectPerson(sib.id)}
                      className="flex items-center gap-2 bg-[#1D1E21] hover:bg-neutral-800 border border-neutral-800 rounded-lg py-1.5 px-2.5 text-xs text-white transition-all cursor-pointer group"
                    >
                      <img
                        src={sib.photo}
                        alt={sib.name}
                        className="w-5 h-5 rounded-full object-cover border border-neutral-700"
                      />
                      <span className="font-medium group-hover:text-emerald-400 transition-colors">{sib.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Children */}
            {renderRelatedClickable(person.childIds, 'Children')}
          </div>

          {/* Admin Operations Section (Only shown when not editing but in admin mode) */}
          {isAdmin && !isEditing && (
            <div className="space-y-3 border-t border-neutral-800/50 pt-5">
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block text-neutral-400">Admin Operations</span>
              
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => onAddRelationship('parent', person.id)}
                  className="flex items-center justify-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800/80 hover:border-emerald-500/30 text-xs font-semibold text-white rounded-lg py-2 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-400" />
                  <span>Add Parent</span>
                </button>
                <button
                  onClick={() => onAddRelationship('spouse', person.id)}
                  className="flex items-center justify-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800/80 hover:border-emerald-500/30 text-xs font-semibold text-white rounded-lg py-2 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-pink-400" />
                  <span>Add Spouse</span>
                </button>
                <button
                  onClick={() => onAddRelationship('sibling', person.id)}
                  className="flex items-center justify-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800/80 hover:border-emerald-500/30 text-xs font-semibold text-white rounded-lg py-2 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Add Sibling</span>
                </button>
                <button
                  onClick={() => onAddRelationship('child', person.id)}
                  className="flex items-center justify-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800/80 hover:border-emerald-500/30 text-xs font-semibold text-white rounded-lg py-2 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Add Child</span>
                </button>
              </div>

              {/* Danger zone */}
              <div className="pt-2">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-xs font-semibold text-red-400 rounded-lg py-2.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Record</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Floating action buttons at the bottom during editing or delete confirmation */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="absolute bottom-0 left-0 w-full p-4 border-t border-neutral-800 bg-[#1D1E21] flex gap-3 z-50 shadow-2xl"
            >
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white rounded-lg border border-neutral-700/50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </motion.div>
          )}

          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex flex-col justify-center items-center p-6 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 max-w-xs">
                <h3 className="text-sm font-semibold text-white">Confirm Deletion</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Are you sure you want to delete <strong className="text-white">{person.name}</strong>? This action will remove all family tree relationships and is completely irreversible.
                </p>
              </div>
              <div className="flex gap-2.5 w-full max-w-xs pt-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white rounded-lg transition-colors border border-neutral-700/50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDeletePerson(person.id);
                    onClose();
                  }}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </AnimatePresence>
  );
}
