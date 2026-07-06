/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Person } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './utils/supabase';

// Hooks
import { useAudioFeedback } from './hooks/useAudioFeedback';
import { useToast } from './hooks/useToast';
import { useTreeLayout } from './hooks/useTreeLayout';
import { useCanvasTransform } from './hooks/useCanvasTransform';
import { useFamilyData } from './hooks/useFamilyData';

// Existing Components
import AddRelationshipModal from './components/AddRelationshipModal';
import MiniMap from './components/MiniMap';
import ProfileSidebar from './components/ProfileSidebar';
import SearchOverlay from './components/SearchOverlay';
import StatsModal from './components/StatsModal';

// New Extracted Components
import SplashScreen from './components/SplashScreen';
import HeaderHUD from './components/HeaderHUD';
import CanvasToolbar from './components/CanvasToolbar';
import SVGConnectors from './components/SVGConnectors';
import NodeCard from './components/NodeCard';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import ResetConfirmModal from './components/ResetConfirmModal';
import SignOutConfirmModal from './components/SignOutConfirmModal';
import ToastNotification from './components/ToastNotification';
import ZoomControls from './components/ZoomControls';
import EmptyState from './components/EmptyState';
import PhotoLightbox from './components/PhotoLightbox';
import LoginOverlay from './components/LoginOverlay';
import UserProfileHUD from './components/UserProfileHUD';

export default function App() {
  // 0. Supabase Auth State
  const [user, setUser] = useState<any>(null);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem('family_nexus_is_guest') === 'true';
  });
  const [authLoading, setAuthLoading] = useState(true);

  // Theme state needed early for Login screen
  const [theme, setTheme] = useState<'dark' | 'light-high-contrast'>(() => {
    return (localStorage.getItem('family-nexus-theme') as 'dark' | 'light-high-contrast') || 'dark';
  });
  const isHighContrastLight = theme === 'light-high-contrast';

  useEffect(() => {
    localStorage.setItem('family-nexus-theme', theme);
  }, [theme]);

  // Auth session listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setIsGuest(false);
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsGuest(false);
        localStorage.setItem('family_nexus_is_guest', 'false');
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsGuest(false);
    localStorage.removeItem('family_nexus_is_guest');
    setHasCenteredOnLoad(false);
    setIsSignOutConfirmOpen(false);
  };

  // 1. Core utilities and states
  const [layoutOrientation, setLayoutOrientation] = useState<'TB' | 'LR'>('TB');
  const { toast, showToast, clearToast } = useToast();
  const { isMuted, toggleMute, playTick, playSwoosh, playSuccess } = useAudioFeedback();
  
  const {
    people, selectedId, setSelectedId,
    rootUserId, getRootId, setRootUser,
    handleUpdatePerson, handleDeletePerson, handleAddRelationship,
    handleExportTree, handleImportTree, handleResetTree,
    handleExportGEDCOM, handleImportGEDCOM,
    fileUploadRef, gedcomUploadRef,
    undo, canUndo, isLoading: isDataLoading
  } = useFamilyData(user, isGuest, showToast);

  // Collapse/Expand state for sub-branches (Tier 2 feature)
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set());

  const toggleNodeCollapse = useCallback((nodeId: string) => {
    setCollapsedNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
    playTick();
  }, [playTick]);

  useEffect(() => {
    setCollapsedNodeIds(new Set());
  }, [people]);

  const { layout, nodesArr, maxGen, minNodeX } = useTreeLayout(people, layoutOrientation, collapsedNodeIds);
  const {
    transform, isDragging, isAnimating,
    isSpacePressed, setIsSpacePressed,
    containerRef,
    centerOnNode, fitTree,
    handleMouseDown, handleMouseMove, handleMouseUp,
    handleDoubleClick,
    handleMiniMapPan, zoomIn, zoomOut
  } = useCanvasTransform(layout);

  // Auto-fit tree when layout orientation changes
  const orientationChangedRef = useRef(false);
  useEffect(() => {
    if (orientationChangedRef.current) {
      orientationChangedRef.current = false;
      // Small delay to let the new layout settle in the DOM
      const timer = setTimeout(() => fitTree(), 50);
      return () => clearTimeout(timer);
    }
  }, [layoutOrientation, fitTree]);

  // 2. Modals and HUD states
  const [isAdmin, setIsAdmin] = useState(false);
  const [splashActive, setSplashActive] = useState(true);
  const [lineageFilter, setLineageFilter] = useState<'all' | 'paternal' | 'maternal' | 'descendants'>('all');

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);

  const [addRelConfig, setAddRelConfig] = useState<{
    type: 'parent' | 'child' | 'spouse' | 'sibling' | null;
    anchorId: string | null;
  }>({ type: null, anchorId: null });

  const [searchFlashNodeId, setSearchFlashNodeId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string[] | null>(null);

  const [statHighlightedIds, setStatHighlightedIds] = useState<Set<string> | null>(null);
  const [statHighlightLabel, setStatHighlightLabel] = useState<string | null>(null);

  // Compare mode states (Tier 6 relationship solver from canvas)
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [tracerTargetId, setTracerTargetId] = useState('');

  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null);
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);

  const clearGroupHighlight = useCallback(() => {
    setStatHighlightedIds(null);
    setStatHighlightLabel(null);
  }, []);

  const [hasCenteredOnLoad, setHasCenteredOnLoad] = useState(false);

  // Center on designated node on splash dismissal
  const handleDismissSplash = useCallback(() => {
    setSplashActive(false);
    playSuccess();
  }, [playSuccess]);

  // Paternal / Maternal ancestor / Descendants recursive trace algorithm (Memoized)
  const filterHighlightedIds = useMemo(() => {
    if (lineageFilter === 'all') return null;
    const refId = selectedId || getRootId();
    const result = new Set<string>();
    result.add(refId);

    const refPerson = people[refId];
    if (!refPerson) return result;

    if (lineageFilter === 'descendants') {
      const queue: string[] = [refId];
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        const current = people[currentId];
        if (current) {
          for (const childId of current.childIds) {
            if (!result.has(childId)) {
              result.add(childId);
              queue.push(childId);
            }
          }
          for (const sId of current.spouseIds) {
            result.add(sId);
          }
        }
      }
      return result;
    }

    const queue: string[] = [];
    const parents = refPerson.parentIds;
    const targetParent = parents.find(pid => {
      const p = people[pid];
      if (!p) return false;
      return lineageFilter === 'paternal' ? p.gender === 'male' : p.gender === 'female';
    });

    if (targetParent) {
      queue.push(targetParent);
      result.add(targetParent);
    }

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const current = people[currentId];
      if (current) {
        for (const parentId of current.parentIds) {
          if (!result.has(parentId)) {
            result.add(parentId);
            queue.push(parentId);
          }
        }
        for (const spouseId of current.spouseIds) {
          result.add(spouseId);
        }
      }
    }
    return result;
  }, [lineageFilter, selectedId, people, getRootId]);

  // Determine node opacity based on focus (Memoized / Callback)
  const isFocused = useCallback((nodeId: string): boolean => {
    if (statHighlightedIds !== null) {
      return statHighlightedIds.has(nodeId);
    }

    if (filterHighlightedIds !== null) {
      return filterHighlightedIds.has(nodeId);
    }

    if (!selectedId) return true;
    if (nodeId === selectedId) return true;
    
    const p = people[selectedId];
    if (!p) return true;

    return (
      p.parentIds.includes(nodeId) ||
      p.childIds.includes(nodeId) ||
      p.spouseIds.includes(nodeId)
    );
  }, [statHighlightedIds, filterHighlightedIds, selectedId, people]);

  // Find nodes connected to hovered person (Memoized)
  const relatedToHovered = useMemo((): Set<string> | null => {
    if (!hoveredId) return null;
    const person = people[hoveredId];
    if (!person) return null;
    const related = new Set<string>([hoveredId]);
    person.parentIds.forEach(id => related.add(id));
    person.spouseIds.forEach(id => related.add(id));
    person.childIds.forEach(id => related.add(id));
    
    (Object.values(people) as Person[]).forEach(p => {
      if (p.id !== hoveredId && p.parentIds.some(pid => person.parentIds.includes(pid))) {
        related.add(p.id);
      }
    });
    return related;
  }, [hoveredId, people]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isTyping = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';

      // Global Escape handler
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsStatsOpen(false);
        setIsShortcutsOpen(false);
        setLightboxImages(null);
        setSelectedId(null);
        setIsCompareMode(false);
      }

      if (isTyping) return;

      // Undo shortcut (Ctrl + Z)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === '/') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(true);
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        const rootId = getRootId();
        if (rootId) {
          centerOnNode(rootId, 0.85);
        }
      } else if (e.key === 'p' || e.key === 'P') {
        setLineageFilter('paternal');
        playTick();
      } else if (e.key === 'm' || e.key === 'M') {
        setLineageFilter('maternal');
        playTick();
      } else if (e.key === 'a' || e.key === 'A') {
        setLineageFilter('all');
        playTick();
      } else if (e.key === 's' || e.key === 'S') {
        setIsStatsOpen(prev => !prev);
        playTick();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [people, centerOnNode, getRootId, undo, zoomIn, zoomOut, playTick, setIsSpacePressed]);

  // Relationship calculations relative to selected node
  const getRelationshipLabel = useCallback((targetId: string): string => {
    if (!selectedId) return '';
    if (targetId === selectedId) return 'Self';
    
    const anchor = people[selectedId];
    if (!anchor) return '';

    if (anchor.spouseIds.includes(targetId)) return 'Spouse';
    if (anchor.parentIds.includes(targetId)) return 'Parent';
    if (anchor.childIds.includes(targetId)) return 'Child';

    const isSibling = anchor.parentIds.length > 0 && 
                      people[targetId]?.parentIds.length > 0 && 
                      anchor.parentIds.every(id => people[targetId].parentIds.includes(id));
    if (isSibling) return 'Sibling';

    for (const pId of anchor.parentIds) {
      if (people[pId]?.parentIds.includes(targetId)) return 'Grandparent';
    }

    for (const cId of anchor.childIds) {
      if (people[cId]?.childIds.includes(targetId)) return 'Grandchild';
    }

    return '';
  }, [selectedId, people]);

  const handlePhotoClick = useCallback((images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxInitialIndex(index);
  }, []);

  // 3. Auth Loading Guard
  // Center on root node on initial load
  useEffect(() => {
    if (!splashActive && (user || isGuest) && !isDataLoading && !hasCenteredOnLoad) {
      const rootId = getRootId();
      if (rootId) {
        setSelectedId(rootId);
        setTimeout(() => {
          centerOnNode(rootId, 0.9);
          setHasCenteredOnLoad(true);
        }, 150);
      }
    }
  }, [splashActive, user, isGuest, isDataLoading, hasCenteredOnLoad, getRootId, setSelectedId, centerOnNode]);

  // 3. Splash Screen is displayed first
  if (splashActive) {
    return (
      <SplashScreen
        isHighContrastLight={isHighContrastLight}
        onEnter={handleDismissSplash}
      />
    );
  }

  // 3.1. Auth Loading Guard
  if (authLoading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#0B0C0E] text-white">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-neutral-400 mt-4 tracking-widest uppercase">Initializing Registry Auth...</span>
      </div>
    );
  }

  // 4. Force Sign In / Guest account selection
  if (!user && !isGuest) {
    return (
      <LoginOverlay
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          setIsGuest(false);
          localStorage.setItem('family_nexus_is_guest', 'false');
        }}
        onContinueAsGuest={() => {
          setIsGuest(true);
          localStorage.setItem('family_nexus_is_guest', 'true');
        }}
        isHighContrastLight={isHighContrastLight}
      />
    );
  }

  // 5. Data Loading Guard (fetching from Supabase)
  if (isDataLoading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#0B0C0E] text-white">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-neutral-400 mt-4 tracking-widest uppercase">Synchronizing Lineage Tree...</span>
      </div>
    );
  }

  return (
    <div className={`relative w-screen h-screen select-none font-sans overflow-hidden transition-colors duration-300 ${
      isHighContrastLight 
        ? 'bg-white text-black theme-light-high-contrast' 
        : 'bg-[#0B0C0E] text-white'
    }`}>

      {/* Top Header HUD */}
      <HeaderHUD
        isAdmin={isAdmin}
        lineageFilter={lineageFilter}
        setLineageFilter={setLineageFilter}
        statHighlightLabel={statHighlightLabel}
        clearGroupHighlight={clearGroupHighlight}
        playTick={playTick}
      />

      {/* User Profile HUD */}
      <UserProfileHUD
        user={user}
        isGuest={isGuest}
        onLogout={() => setIsSignOutConfirmOpen(true)}
        people={people}
        rootUserId={rootUserId}
        setRootUser={setRootUser}
        theme={theme}
        onToggleTheme={() => {
          setTheme(prev => (prev === 'dark' ? 'light-high-contrast' : 'dark'));
          playSwoosh();
        }}
        playTick={playTick}
      />

      {/* Infinite Family Canvas Area */}
      <div
        ref={containerRef}
        id="infinite-canvas-container"
        className="w-full h-full cursor-grab active:cursor-grabbing outline-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        <div
          id="infinite-canvas-bg"
          className="w-full h-full relative"
          onClick={(e) => {
            const isBgClick = e.target instanceof HTMLElement && (
              e.target.id === 'infinite-canvas-bg' || 
              e.target.id === 'grid-pattern'
            );
            if (isBgClick) {
              setSelectedId(null);
              clearGroupHighlight();
              setHighlightedPath(null);
              setLineageFilter('all');
              playTick();
              setIsCompareMode(false);
            }
          }}
          style={{
            backgroundPosition: `${transform.x}px ${transform.y}px`,
            backgroundSize: `${60 * transform.zoom}px ${60 * transform.zoom}px`,
          }}
        >
          {/* Transforming workspace */}
          <div
            id="workspace-layer"
            className="absolute transform-gpu origin-top-left"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
              transition: isAnimating ? 'transform 700ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none'
            }}
          >
            {/* SVG Relationship Connector Lines */}
            <SVGConnectors
              links={layout.links}
              people={people}
              selectedId={selectedId}
              hoveredId={hoveredId}
              highlightedPath={highlightedPath}
              filterHighlightedIds={filterHighlightedIds}
              statHighlightedIds={statHighlightedIds}
              isHighContrastLight={isHighContrastLight}
              isFocused={isFocused}
              minNodeX={minNodeX}
              maxGen={maxGen}
              orientation={layoutOrientation}
            />

            {/* Visual Cards Nodes / Empty State */}
            {nodesArr.length === 0 ? (
              <EmptyState isAdmin={isAdmin} onEnableAdmin={() => setIsAdmin(true)} />
            ) : (
              nodesArr.map((node) => {
                const isSelected = node.id === selectedId;
                const bright = isFocused(node.id);
                const relLabel = getRelationshipLabel(node.id);
                return (
                  <NodeCard
                    key={node.id}
                    node={node}
                    isSelected={isSelected}
                    bright={bright}
                    relLabel={relLabel}
                    highlightedPath={highlightedPath}
                    hoveredId={hoveredId}
                    relatedToHovered={relatedToHovered}
                    searchFlashNodeId={searchFlashNodeId}
                    people={people}
                    zoom={transform.zoom}
                    isCollapsed={collapsedNodeIds.has(node.id)}
                    onToggleCollapse={toggleNodeCollapse}
                    onSelect={(id) => {
                      if (isCompareMode) {
                        setTracerTargetId(id);
                        setIsCompareMode(false);
                        playSuccess();
                      } else {
                        setSelectedId(id);
                        centerOnNode(id);
                      }
                    }}
                    onHoverStart={setHoveredId}
                    onHoverEnd={() => setHoveredId(null)}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Glass Floating Bottom Toolbar */}
      <CanvasToolbar
        onSearchOpen={() => setIsSearchOpen(true)}
        onHomeClick={() => {
          const rootId = getRootId();
          if (rootId) {
            setSelectedId(rootId);
            centerOnNode(rootId, 0.95);
          }
        }}
        onFitTree={fitTree}
        onStatsOpen={() => setIsStatsOpen(true)}
        onExportTree={handleExportTree}
        onImportTrigger={() => fileUploadRef.current?.click()}
        onExportGEDCOM={handleExportGEDCOM}
        onImportGEDCOMTrigger={() => gedcomUploadRef.current?.click()}
        onResetConfirmOpen={() => {
          setIsResetConfirmOpen(true);
          playTick();
        }}
        isAdmin={isAdmin}
        onToggleAdmin={() => setIsAdmin(!isAdmin)}
        onShortcutsOpen={() => {
          setIsShortcutsOpen(true);
          playTick();
        }}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        theme={theme}
        onToggleTheme={() => {
          setTheme(prev => (prev === 'dark' ? 'light-high-contrast' : 'dark'));
          playSwoosh();
        }}
        canUndo={canUndo}
        onUndo={undo}
        isLoggedIn={user !== null}
        userEmail={user?.email}
        onLogout={() => setIsSignOutConfirmOpen(true)}
        orientation={layoutOrientation}
        onToggleOrientation={() => {
          orientationChangedRef.current = true;
          setLayoutOrientation(prev => prev === 'TB' ? 'LR' : 'TB');
          playSwoosh();
        }}
      />
      <input
        ref={fileUploadRef}
        type="file"
        accept=".json"
        onChange={handleImportTree}
        className="hidden"
      />
      <input
        ref={gedcomUploadRef}
        type="file"
        accept=".ged"
        onChange={handleImportGEDCOM}
        className="hidden"
      />

      {/* Zoom Controls UI Component */}
      {nodesArr.length > 0 && (
        <ZoomControls
          zoom={transform.zoom}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onFitTree={fitTree}
        />
      )}

      {/* Miniature Navigation Map Tracker */}
      <MiniMap
        layout={layout}
        transform={transform}
        containerRef={containerRef}
        people={people}
        selectedId={selectedId}
        onMiniMapClick={handleMiniMapPan}
      />

      {/* Spotlight Search Autocomplete Bar */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        people={people}
        onSelectPerson={(id) => {
          setSelectedId(id);
          centerOnNode(id, 0.95);
          setSearchFlashNodeId(id);
          setTimeout(() => setSearchFlashNodeId(null), 3000);
        }}
      />

      {/* Right Profile Sidebar */}
      <ProfileSidebar
        personId={selectedId}
        people={people}
        isAdmin={isAdmin}
        onClose={() => setSelectedId(null)}
        onSelectPerson={(id) => {
          setSelectedId(id);
          centerOnNode(id);
        }}
        onUpdatePerson={handleUpdatePerson}
        onDeletePerson={handleDeletePerson}
        onAddRelationship={(type, anchorId) => {
          setAddRelConfig({ type, anchorId });
        }}
        generation={selectedId && layout.nodes[selectedId] ? layout.nodes[selectedId].generation : undefined}
        onHighlightPath={setHighlightedPath}
        onPhotoClick={handlePhotoClick}
        showToast={showToast}
        isCompareMode={isCompareMode}
        onToggleCompareMode={() => setIsCompareMode(!isCompareMode)}
        tracerTargetId={tracerTargetId}
        onTracerTargetChange={setTracerTargetId}
      />

      {/* Demographics Statistics Insight Modal */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        people={people}
        onHighlightGroup={(groupName, ids) => {
          setStatHighlightedIds(new Set(ids));
          setStatHighlightLabel(groupName);
          setLineageFilter('all');
          playSuccess();
        }}
      />

      {/* Keyboard Shortcuts Helper Overlay */}
      <AnimatePresence>
        {isShortcutsOpen && (
          <KeyboardShortcutsModal onClose={() => setIsShortcutsOpen(false)} />
        )}
      </AnimatePresence>

      {/* Reset Database Confirmation Modal */}
      <AnimatePresence>
        {isResetConfirmOpen && (
          <ResetConfirmModal
            onConfirm={() => {
              handleResetTree();
              setIsResetConfirmOpen(false);
            }}
            onClose={() => setIsResetConfirmOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sign Out Confirmation Modal */}
      <AnimatePresence>
        {isSignOutConfirmOpen && (
          <SignOutConfirmModal
            onConfirm={handleLogout}
            onClose={() => setIsSignOutConfirmOpen(false)}
            isGuest={isGuest}
          />
        )}
      </AnimatePresence>

      {/* Relationship Tree Expansion Modal */}
      <AddRelationshipModal
        isOpen={addRelConfig.type !== null}
        onClose={() => setAddRelConfig({ type: null, anchorId: null })}
        type={addRelConfig.type}
        anchorId={addRelConfig.anchorId}
        people={people}
        onAdd={handleAddRelationship}
      />

      {/* Floating Toast Notifications System */}
      <AnimatePresence>
        {toast && (
          <ToastNotification
            message={toast.message}
            type={toast.type}
            onDismiss={clearToast}
            onUndo={undo}
            canUndo={canUndo}
          />
        )}
      </AnimatePresence>

      {/* Photo Lightbox View */}
      <AnimatePresence>
        {lightboxImages && (
          <PhotoLightbox
            images={lightboxImages}
            initialIndex={lightboxInitialIndex}
            onClose={() => setLightboxImages(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
