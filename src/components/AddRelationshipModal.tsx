/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Person, Gender } from '../types';
import { X, Save, AlertCircle, Sparkles, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AddRelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'parent' | 'child' | 'spouse' | 'sibling' | null;
  anchorId: string | null;
  people: Record<string, Person>;
  onAdd: (newPerson: Person, relationshipConfig: {
    type: 'parent' | 'child' | 'spouse' | 'sibling';
    anchorId: string;
  }) => void;
}

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=James&skinColor=ffdbb4&clothing=blazerAndShirt&clothesColor=262e33&top=shortFlat&hairColor=2c1b18&mouth=smile&eyes=default&eyebrows=defaultNatural&facialHairProbability=0&accessoriesProbability=0&style=circle&backgroundColor=f0f0f0',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&skinColor=ffdbb4&clothing=blazerAndShirt&clothesColor=262e33&top=straight01&hairColor=d6b370&mouth=twinkle&eyes=happy&eyebrows=defaultNatural&facialHairProbability=0&accessoriesProbability=0&style=circle&backgroundColor=f0f0f0',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert&skinColor=ffdbb4&clothing=blazerAndShirt&clothesColor=262e33&top=theCaesarAndSidePart&hairColor=2c1b18&mouth=smile&eyes=default&eyebrows=defaultNatural&facialHairProbability=0&accessoriesProbability=0&style=circle&backgroundColor=f0f0f0',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Grace&skinColor=ffdbb4&clothing=blazerAndShirt&clothesColor=262e33&top=bob&hairColor=2c1b18&mouth=smile&eyes=happy&eyebrows=defaultNatural&facialHairProbability=0&accessoriesProbability=0&style=circle&backgroundColor=f0f0f0',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Daniel&skinColor=ffdbb4&clothing=blazerAndShirt&clothesColor=262e33&top=shortWaved&hairColor=d6b370&mouth=default&eyes=default&eyebrows=defaultNatural&facialHairProbability=0&accessoriesProbability=0&style=circle&backgroundColor=f0f0f0',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma&skinColor=ffdbb4&clothing=blazerAndShirt&clothesColor=262e33&top=longButNotTooLong&hairColor=d6b370&mouth=twinkle&eyes=default&eyebrows=defaultNatural&facialHairProbability=0&accessoriesProbability=0&style=circle&backgroundColor=f0f0f0'
];

export default function AddRelationshipModal({
  isOpen,
  onClose,
  type,
  anchorId,
  people,
  onAdd
}: AddRelationshipModalProps) {
  const anchor = anchorId ? people[anchorId] : null;

  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [dob, setDob] = useState('');
  const [living, setLiving] = useState(true);
  const [profession, setProfession] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(PRESET_AVATARS[0]);
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Profile picture size must be less than 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64 = event.target.result as string;
        setCustomPhoto(base64);
        setPhoto(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  // Chronological verification check
  useEffect(() => {
    setValidationWarning(null);
    if (!dob || !anchor || !anchor.dob) return;

    const anchorYear = new Date(anchor.dob).getFullYear();
    const newYear = new Date(dob).getFullYear();
    const currentYear = new Date().getFullYear();

    if (newYear > currentYear) {
      setValidationWarning(`Chronological Warning: Birth year is set in the future (${newYear}).`);
      return;
    }

    if (type === 'parent') {
      if (newYear >= anchorYear) {
        setValidationWarning(`Chronological Warning: Parent's birth year (${newYear}) is after or equal to the child's (${anchorYear}).`);
      } else if (anchorYear - newYear < 14) {
        setValidationWarning(`Chronological Warning: Narrow generational gap (${anchorYear - newYear} years). The parent would have been under 14.`);
      } else if (anchorYear - newYear > 70) {
        setValidationWarning(`Chronological Warning: Unusually wide generational gap (${anchorYear - newYear} years). The parent would have been over 70.`);
      }
    } else if (type === 'child') {
      if (newYear <= anchorYear) {
        setValidationWarning(`Chronological Warning: Child's birth year (${newYear}) is before or equal to the parent's (${anchorYear}).`);
      } else if (newYear - anchorYear < 14) {
        setValidationWarning(`Chronological Warning: Narrow generational gap (${newYear - anchorYear} years). The parent would have been under 14.`);
      } else if (newYear - anchorYear > 70) {
        setValidationWarning(`Chronological Warning: Unusually wide generational gap (${newYear - anchorYear} years). The parent would have been over 70.`);
      }
    } else if (type === 'spouse') {
      const gap = Math.abs(newYear - anchorYear);
      if (gap > 45) {
        setValidationWarning(`Chronological Warning: Unusually wide age difference between spouses (${gap} years).`);
      }
    } else if (type === 'sibling') {
      const gap = Math.abs(newYear - anchorYear);
      if (gap > 35) {
        setValidationWarning(`Chronological Warning: Unusually wide age difference between siblings (${gap} years).`);
      }
    }
  }, [dob, type, anchor]);

  // Adjust defaults based on relationship type
  useEffect(() => {
    if (isOpen && type && anchor) {
      setName('');
      setDob('');
      setProfession('');
      setCity(anchor.city || '');
      setNotes('');
      setLiving(type !== 'parent'); // Parents of an adult anchor might be deceased
      setCustomPhoto(null);

      // Intelligently set preset gender/photo
      if (type === 'parent') {
        setGender('male');
        setPhoto(PRESET_AVATARS[1]); // Male avatar
      } else if (type === 'spouse') {
        const spouseGender = anchor.gender === 'male' ? 'female' : 'male';
        setGender(spouseGender);
        setPhoto(spouseGender === 'female' ? PRESET_AVATARS[0] : PRESET_AVATARS[3]);
      } else if (type === 'child') {
        setGender('female');
        setPhoto(PRESET_AVATARS[4]);
      } else {
        setGender('male');
        setPhoto(PRESET_AVATARS[5]);
      }
    }
  }, [isOpen, type, anchor]);

  if (!isOpen || !type || !anchor) return null;

  // Validation
  const hasSiblingParentsError = type === 'sibling' && anchor.parentIds.length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Generate random mock sequential-like id
    const existingNums = Object.keys(people).map(k => parseInt(k.replace('FM-', ''), 10)).filter(n => !isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
    const padNum = String(nextNum).padStart(6, '0');
    const newId = `FM-${padNum}`;

    const newPerson: Person = {
      id: newId,
      name,
      gender,
      dob,
      profession,
      city,
      living,
      notes: notes.slice(0, 300),
      photo,
      gallery: [photo],
      spouseIds: [],
      parentIds: [],
      childIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onAdd(newPerson, { type, anchorId: anchor.id });
    onClose();
  };

  return (
    <AnimatePresence>
      <div id="add-relationship-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          id="add-relationship-container"
          className="w-full max-w-lg bg-[#161719] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/80"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#1D1E21]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-semibold text-white tracking-tight">
                Add {type.charAt(0).toUpperCase() + type.slice(1)} to {anchor.name}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {hasSiblingParentsError ? (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-4 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div className="space-y-1">
                  <span className="font-semibold block">Missing Parents Record</span>
                  <p className="leading-relaxed font-light">
                    To add a sibling, the anchor person (<strong className="text-white">{anchor.name}</strong>) must have at least one parent registered first. Please register a parent for them before adding siblings.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Form Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Richard Sterling"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full mt-1 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 focus:border-emerald-500 focus:outline-none rounded-lg p-2.5 text-xs text-white transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as Gender)}
                        className="w-full mt-1 bg-neutral-900 border border-neutral-800 focus:border-emerald-500 focus:outline-none rounded-lg p-2.5 text-xs text-white transition-all"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Status</label>
                      <select
                        value={living ? 'living' : 'deceased'}
                        onChange={(e) => setLiving(e.target.value === 'living')}
                        className="w-full mt-1 bg-neutral-900 border border-neutral-800 focus:border-emerald-500 focus:outline-none rounded-lg p-2.5 text-xs text-white transition-all"
                      >
                        <option value="living">Living</option>
                        <option value="deceased">Deceased</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Date of Birth</label>
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full mt-1 bg-neutral-900 border border-neutral-800 focus:border-emerald-500 focus:outline-none rounded-lg p-2.5 text-xs text-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">City</label>
                      <input
                        type="text"
                        placeholder="e.g. Oxford"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full mt-1 bg-neutral-900 border border-neutral-800 focus:border-emerald-500 focus:outline-none rounded-lg p-2.5 text-xs text-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Profession</label>
                    <input
                      type="text"
                      placeholder="e.g. Researcher"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      className="w-full mt-1 bg-neutral-900 border border-neutral-800 focus:border-emerald-500 focus:outline-none rounded-lg p-2.5 text-xs text-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">Avatar Selection</label>
                    <div className="flex flex-wrap gap-2.5 items-center">
                      {PRESET_AVATARS.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setPhoto(url)}
                          className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${
                            photo === url ? 'border-emerald-500 scale-110' : 'border-neutral-800 hover:border-neutral-700'
                          }`}
                        >
                          <img src={url} alt="preset" className="w-full h-full object-cover" />
                        </button>
                      ))}

                      {customPhoto && (
                        <button
                          type="button"
                          onClick={() => setPhoto(customPhoto)}
                          className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${
                            photo === customPhoto ? 'border-emerald-500 scale-110' : 'border-neutral-800 hover:border-neutral-700'
                          }`}
                        >
                          <img src={customPhoto} alt="custom" className="w-full h-full object-cover" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-10 h-10 rounded-full border-2 border-dashed border-neutral-700 hover:border-emerald-500 flex items-center justify-center text-neutral-400 hover:text-emerald-400 bg-neutral-900/40 hover:bg-neutral-900 transition-all cursor-pointer"
                        title="Upload custom profile picture"
                      >
                        <Plus className="w-4 h-4" />
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Biography / Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value.slice(0, 300))}
                      placeholder="Enter short lineage details (max 300 characters)..."
                      rows={3}
                      className="w-full mt-1 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 focus:border-emerald-500 focus:outline-none rounded-lg p-2.5 text-xs text-white transition-all resize-none leading-relaxed"
                    />
                    <div className="text-[10px] text-neutral-500 text-right">
                      {notes.length}/300
                    </div>
                  </div>
                </div>
              </>
            )}

            {validationWarning && (
              <div className="bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs rounded-xl p-3 flex gap-2.5 items-center">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-light leading-snug">{validationWarning}</span>
              </div>
            )}

            {/* Actions */}
            <div className="border-t border-neutral-800/60 pt-4 flex justify-end gap-3.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white rounded-lg transition-colors border border-neutral-700/50"
              >
                Cancel
              </button>
              {!hasSiblingParentsError && (
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
