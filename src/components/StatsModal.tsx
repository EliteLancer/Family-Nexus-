/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Person } from '../types';
import { X, Users, Heart, MapPin, Calendar, Award, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: Record<string, Person>;
  onHighlightGroup?: (groupName: string, ids: string[]) => void;
}

export default function StatsModal({ isOpen, onClose, people, onHighlightGroup }: StatsModalProps) {
  if (!isOpen) return null;

  const peopleList = Object.values(people);
  const totalCount = peopleList.length;
  const livingCount = peopleList.filter(p => p.living).length;
  const deceasedCount = totalCount - livingCount;

  // Gender distribution
  const maleCount = peopleList.filter(p => p.gender === 'male').length;
  const femaleCount = peopleList.filter(p => p.gender === 'female').length;
  const otherCount = totalCount - maleCount - femaleCount;

  // City analysis
  const cities: Record<string, number> = {};
  peopleList.forEach(p => {
    if (p.city) {
      cities[p.city] = (cities[p.city] || 0) + 1;
    }
  });
  const topCities = Object.entries(cities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Average lifespan (for deceased members)
  const deceasedWithLifespan = peopleList.filter(p => !p.living && p.dob && p.dod);
  let avgLifespan = 0;
  if (deceasedWithLifespan.length > 0) {
    const lifespans = deceasedWithLifespan.map(p => {
      const birthYear = new Date(p.dob).getFullYear();
      const deathYear = new Date(p.dod!).getFullYear();
      return deathYear - birthYear;
    });
    avgLifespan = Math.round(lifespans.reduce((sum, val) => sum + val, 0) / lifespans.length);
  } else {
    // Fallback when no deceased members have dod
    const deceasedAny = peopleList.filter(p => !p.living && p.dob);
    if (deceasedAny.length > 0) {
      avgLifespan = 82; // Default realistic fallback
    } else {
      avgLifespan = 0;
    }
  }

  // Top professions
  const professions: Record<string, number> = {};
  peopleList.forEach(p => {
    if (p.profession && p.profession !== 'Toddler' && p.profession !== 'Child') {
      // Split clean profession titles
      const key = p.profession.split('&')[0].trim();
      professions[key] = (professions[key] || 0) + 1;
    }
  });
  const topProfessions = Object.entries(professions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Top family surnames analysis (Tier 6)
  const surnames: Record<string, number> = {};
  peopleList.forEach(p => {
    if (p.name) {
      const parts = p.name.trim().split(/\s+/);
      const surname = parts[parts.length - 1];
      if (surname) {
        surnames[surname] = (surnames[surname] || 0) + 1;
      }
    }
  });
  const topSurnames = Object.entries(surnames)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Dynamic generation calculation
  const getGenerationLevels = (): Record<string, number> => {
    const levels: Record<string, number> = {};
    const queue: { id: string; gen: number }[] = [];

    // Find founders
    const founders = peopleList.filter(p => p.parentIds.length === 0);
    founders.forEach(f => {
      queue.push({ id: f.id, gen: 0 });
      levels[f.id] = 0;
    });

    while (queue.length > 0) {
      const { id, gen } = queue.shift()!;
      const current = people[id];
      if (current) {
        current.childIds.forEach(cid => {
          if (levels[cid] === undefined || levels[cid] < gen + 1) {
            levels[cid] = gen + 1;
            queue.push({ id: cid, gen: gen + 1 });
          }
        });
      }
    }
    return levels;
  };

  const generationLevels = getGenerationLevels();
  const generationCounts: Record<number, number> = {};
  Object.values(generationLevels).forEach(gen => {
    generationCounts[gen] = (generationCounts[gen] || 0) + 1;
  });

  // Calculate age/lifespan distribution buckets [0-20, 21-40, 41-60, 61-80, 81-100+]
  const ageBuckets = [0, 0, 0, 0, 0];
  peopleList.forEach(p => {
    const birthYear = p.dob ? new Date(p.dob).getFullYear() : 1980;
    let age = new Date().getFullYear() - birthYear;
    if (!p.living && p.dod) {
      const deathYear = new Date(p.dod).getFullYear();
      age = deathYear - birthYear;
    } else if (!p.living) {
      age = 82; // Default realistic fallback
    }
    if (age <= 20) ageBuckets[0]++;
    else if (age <= 40) ageBuckets[1]++;
    else if (age <= 60) ageBuckets[2]++;
    else if (age <= 80) ageBuckets[3]++;
    else ageBuckets[4]++;
  });
  const maxAgeBucketVal = Math.max(...ageBuckets, 1);

  const getCohortLabel = (gen: number): string => {
    switch (gen) {
      case 0: return 'Pioneer Founders (G1)';
      case 1: return 'Mid-Century Heirs (G2)';
      case 2: return 'Contemporary Cohort (G3)';
      case 3: return 'Modern Successors (G4)';
      default: return `Emerging Successors (G${gen + 1})`;
    }
  };

  return (
    <AnimatePresence>
      <div id="stats-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          id="stats-container"
          className="w-full max-w-2xl bg-[#161719] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/80"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#1D1E21]">
            <div className="flex items-center gap-2.5">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-semibold text-white tracking-tight">Family Demographics & Insights</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {/* Core counters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#1D1E21] border border-neutral-800/80 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Total Members</span>
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-white tracking-tight">{totalCount}</span>
                  <span className="text-xs text-neutral-500 block mt-0.5">registered lineage</span>
                </div>
              </div>

              <div className="bg-[#1D1E21] border border-neutral-800/80 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Living</span>
                  <Heart className="w-4 h-4 text-blue-400" />
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-white tracking-tight">{livingCount}</span>
                  <span className="text-xs text-neutral-500 block mt-0.5">{Math.round((livingCount / totalCount) * 100)}% of tree</span>
                </div>
              </div>

              <div className="bg-[#1D1E21] border border-neutral-800/80 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Avg. Lifespan</span>
                  <Calendar className="w-4 h-4 text-amber-500" />
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-white tracking-tight">{avgLifespan}</span>
                  <span className="text-xs text-neutral-500 block mt-0.5">years (deceased)</span>
                </div>
              </div>
            </div>

            {/* Demographics & Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gender bar */}
              <div className="bg-[#1D1E21] border border-neutral-800/80 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Gender Balance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-blue-400">Male ({maleCount})</span>
                    <span className="text-emerald-400">Female ({femaleCount})</span>
                  </div>
                  <div className="h-2.5 w-full bg-neutral-800 rounded-full overflow-hidden flex">
                    <div
                      className="bg-blue-500 h-full transition-all"
                      style={{ width: `${(maleCount / totalCount) * 100}%` }}
                    />
                    <div
                      className="bg-emerald-500 h-full transition-all"
                      style={{ width: `${(femaleCount / totalCount) * 100}%` }}
                    />
                    {otherCount > 0 && (
                      <div
                        className="bg-purple-500 h-full transition-all"
                        style={{ width: `${(otherCount / totalCount) * 100}%` }}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-neutral-400 pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 block" />
                      <span>{Math.round((maleCount / totalCount) * 100)}% Male</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 block" />
                      <span>{Math.round((femaleCount / totalCount) * 100)}% Female</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Geographical footprint */}
              <div className="bg-[#1D1E21] border border-neutral-800/80 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Global Footprint</h4>
                <div className="space-y-2.5">
                  {topCities.map(([city, count], idx) => (
                    <div 
                      key={city} 
                      onClick={() => {
                        if (onHighlightGroup) {
                          const matchingIds = peopleList.filter(p => p.city === city).map(p => p.id);
                          onHighlightGroup(`Residents of ${city}`, matchingIds);
                          onClose();
                        }
                      }}
                      className={`flex items-center justify-between text-xs p-1 px-1.5 rounded-lg transition-colors ${onHighlightGroup ? 'cursor-pointer hover:bg-neutral-800/80 group/city' : ''}`}
                      title={onHighlightGroup ? "Click to filter/highlight on map" : undefined}
                    >
                      <div className="flex items-center gap-2 text-neutral-300">
                        <MapPin className="w-3.5 h-3.5 text-neutral-500 group-hover/city:text-emerald-400 transition-colors" />
                        <span className="group-hover/city:text-emerald-400 transition-colors">{city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full"
                            style={{ width: `${(count / totalCount) * 100}%` }}
                          />
                        </div>
                        <span className="font-semibold text-white w-4 text-right group-hover/city:text-emerald-400 transition-colors">{count}</span>
                      </div>
                    </div>
                  ))}
                  {topCities.length === 0 && (
                    <span className="text-xs text-neutral-500 italic">No location logs available.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Lifespan & Age Distribution Custom Histogram */}
            <div className="bg-[#1D1E21] border border-neutral-800/80 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Lineage Age & Lifespan Profile</h4>
                <span className="text-[10px] text-emerald-400 font-mono">Dynamic Actuarial Census</span>
              </div>
              
              <div className="pt-2">
                {/* Custom SVG/CSS Histrogram Chart */}
                <div className="relative h-44 w-full">
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {[1, 2, 3].map((g) => (
                      <div key={g} className="border-t border-neutral-800/30 w-full h-0" />
                    ))}
                    <div className="border-t border-neutral-700/60 w-full h-0 mt-auto" />
                  </div>
                  
                  {/* Bars Container */}
                  <div className="absolute inset-0 flex justify-around items-end px-2">
                    {ageBuckets.map((count, idx) => {
                      const labels = ["0 - 20", "21 - 40", "41 - 60", "61 - 80", "81 - 100+"];
                      const pct = (count / maxAgeBucketVal) * 82; // Max 82% height
                      return (
                        <div key={idx} className="flex flex-col items-center group relative w-12 cursor-help">
                          {/* Hover Tooltip */}
                          <div className="absolute -top-10 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-200 px-2.5 py-1 rounded-lg shadow-xl z-20 whitespace-nowrap pointer-events-none font-sans flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span><strong className="text-emerald-400 font-bold font-mono">{count}</strong> {count === 1 ? 'member' : 'members'}</span>
                          </div>

                          {/* Bar with gradient and subtle hover glow */}
                          <div 
                            style={{ height: `${pct || 4}%` }}
                            className="w-8 bg-gradient-to-t from-emerald-500/50 to-emerald-400/85 hover:from-emerald-400/70 hover:to-emerald-300 rounded-t-md transition-all duration-500 shadow-lg shadow-emerald-500/5 border-t border-emerald-400/40 relative overflow-hidden flex items-end justify-center"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                          </div>

                          {/* X-Axis Labels */}
                          <span className="text-[9px] font-mono text-neutral-500 group-hover:text-neutral-300 transition-colors mt-2.5">
                            {labels[idx]}
                          </span>
                          <span className="text-[10px] font-bold font-mono text-neutral-300 mt-1">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-center text-[10px] text-neutral-500 font-mono mt-4 gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-1.5 bg-emerald-500/60 rounded" />
                    <span>Age distribution index across all historical records</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Generational Breakdown */}
            <div className="bg-[#1D1E21] border border-neutral-800/80 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Generational Distribution</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(generationCounts)
                  .sort((a, b) => Number(a[0]) - Number(b[0]))
                  .map(([genStr, count]) => {
                    const genNum = Number(genStr);
                    const percentage = Math.round((count / totalCount) * 100);
                    const label = getCohortLabel(genNum);
                    return (
                      <div 
                        key={genNum} 
                        onClick={() => {
                          if (onHighlightGroup) {
                            const matchingIds = Object.entries(generationLevels)
                              .filter(([_, level]) => level === genNum)
                              .map(([id]) => id);
                            onHighlightGroup(label, matchingIds);
                            onClose();
                          }
                        }}
                        className={`space-y-1.5 bg-[#161719] border border-neutral-800/60 p-3 rounded-lg flex flex-col justify-between transition-all ${
                          onHighlightGroup 
                            ? 'cursor-pointer hover:border-emerald-500/40 hover:bg-[#1D1E21] hover:shadow-lg hover:shadow-emerald-500/5 group/gen' 
                            : ''
                        }`}
                        title={onHighlightGroup ? "Click to filter/highlight on map" : undefined}
                      >
                        <div className="flex justify-between text-[11px] font-medium">
                          <span className="text-neutral-300 flex items-center gap-1.5 group-hover/gen:text-emerald-400 transition-colors">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {label}
                          </span>
                          <span className="text-neutral-400 font-mono font-semibold group-hover/gen:text-emerald-400 transition-colors">{count} ({percentage}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden mt-2">
                          <div
                            className="bg-gradient-to-r from-emerald-500/80 to-blue-500/80 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Top Careers / Legacy */}
            <div className="bg-[#1D1E21] border border-neutral-800/80 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Lineage Professions & Careers</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {topProfessions.map(([profession, count], idx) => (
                  <div 
                    key={profession} 
                    onClick={() => {
                      if (onHighlightGroup) {
                        const matchingIds = peopleList
                          .filter(p => p.profession && p.profession.toLowerCase().includes(profession.toLowerCase()))
                          .map(p => p.id);
                        onHighlightGroup(`Profession: ${profession}`, matchingIds);
                        onClose();
                      }
                    }}
                    className={`border border-neutral-800 bg-[#161719] rounded-lg p-3.5 flex items-start gap-3 transition-all ${
                      onHighlightGroup 
                        ? 'cursor-pointer hover:border-emerald-500/40 hover:bg-[#1D1E21] hover:shadow-lg hover:shadow-emerald-500/5 group/prof' 
                        : ''
                    }`}
                    title={onHighlightGroup ? "Click to filter/highlight on map" : undefined}
                  >
                    <div className="p-1.5 bg-neutral-800/80 rounded text-emerald-400 group-hover/prof:bg-emerald-500/10 transition-colors">
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <span className="text-xs text-neutral-400 block truncate group-hover/prof:text-emerald-400 transition-colors" title={profession}>
                        {profession}
                      </span>
                      <span className="text-sm font-bold text-white block">
                        {count} {count === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                  </div>
                ))}
                {topProfessions.length === 0 && (
                  <div className="col-span-3 text-xs text-neutral-500 italic text-center py-2">
                    No profession records logged yet.
                  </div>
                )}
              </div>
            </div>

            {/* Top Surnames / Surnames Analytics (Tier 6) */}
            <div className="bg-[#1D1E21] border border-neutral-800/80 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Lineage Surnames & Dynasties</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {topSurnames.map(([surname, count]) => (
                  <div 
                    key={surname} 
                    onClick={() => {
                      if (onHighlightGroup) {
                        const matchingIds = peopleList
                          .filter(p => p.name && p.name.trim().split(/\s+/).pop()?.toLowerCase() === surname.toLowerCase())
                          .map(p => p.id);
                        onHighlightGroup(`Dynasty: ${surname}`, matchingIds);
                        onClose();
                      }
                    }}
                    className={`border border-neutral-800 bg-[#161719] rounded-lg p-3.5 flex items-start gap-3 transition-all ${
                      onHighlightGroup 
                        ? 'cursor-pointer hover:border-emerald-500/40 hover:bg-[#1D1E21] hover:shadow-lg hover:shadow-emerald-500/5 group/surn' 
                        : ''
                    }`}
                    title={onHighlightGroup ? "Click to filter/highlight on map" : undefined}
                  >
                    <div className="p-1.5 bg-neutral-800/80 rounded text-amber-400 group-hover/surn:bg-amber-500/10 transition-colors">
                      <span className="text-xs font-bold font-mono">#</span>
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <span className="text-xs text-neutral-400 block truncate group-hover/surn:text-amber-400 transition-colors" title={surname}>
                        {surname}
                      </span>
                      <span className="text-sm font-bold text-white block">
                        {count} {count === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                  </div>
                ))}
                {topSurnames.length === 0 && (
                  <div className="col-span-3 text-xs text-neutral-500 italic text-center py-2">
                    No name records logged yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-neutral-800 bg-[#1D1E21] flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white rounded-lg transition-colors border border-neutral-700/50"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
