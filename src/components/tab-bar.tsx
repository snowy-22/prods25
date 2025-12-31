
'use client';

import React, { useEffect, useState } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { X, GripVertical, Plus, LayoutGrid, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { ContentItem } from '@/lib/initial-content';
import { getIconByName, IconName } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu';
import Image from 'next/image';
import type { Tab, TabGroup } from '@/lib/store';

interface TabBarProps {
  tabs: Tab[];
  tabGroups: TabGroup[];
  activeTabId: string;
  onTabClick: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
  onSetLayout: (columns: number) => void;
  onToggleGroup?: (groupId: string) => void;
  tabAccessHistory?: Array<{ tabId: string; timestamp: number }>;
}

export default function TabBar({
  tabs,
  tabGroups,
  activeTabId,
  onTabClick,
  onCloseTab,
  onNewTab,
  onSetLayout,
  onToggleGroup,
  tabAccessHistory = [],
}: TabBarProps) {
  const [thirdTabVisible, setThirdTabVisible] = useState(true);

  useEffect(() => {
    if (tabAccessHistory.length >= 3) {
      setThirdTabVisible(true);
      const timer = setTimeout(() => {
        setThirdTabVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [tabAccessHistory]);

  const getTabAccessRank = (tabId: string): number | null => {
    const index = tabAccessHistory.findIndex(h => h.tabId === tabId);
    return index === -1 ? null : index;
  };

  const getTracerColor = (rank: number): string => {
    if (rank === 0) return 'bg-blue-500';
    if (rank === 1) return 'bg-purple-500';
    if (rank === 2) return 'bg-pink-400';
    return 'bg-transparent';
  };

  const getTracerOpacity = (rank: number): string => {
    if (rank === 0) return 'opacity-100';
    if (rank === 1) return 'opacity-75';
    if (rank === 2 && thirdTabVisible) return 'opacity-50';
    return 'opacity-0';
  };

  // Organize tabs by groups
  const ungroupedTabs = tabs.filter(t => !t.groupId);
  const groupedData: Array<{ group: TabGroup; tabs: Tab[] } | { tab: Tab }> = [];

  // Add grouped tabs
  tabGroups.forEach(group => {
    const groupTabs = tabs.filter(t => t.groupId === group.id);
    if (groupTabs.length > 0) {
      groupedData.push({ group, tabs: groupTabs });
    }
  });

  // Add ungrouped tabs
  ungroupedTabs.forEach(tab => {
    groupedData.push({ tab });
  });
  
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Handle wheel scroll for horizontal scrolling
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div className="flex items-center justify-between border-b bg-muted/30 backdrop-blur-md h-10 px-2 gap-2">
      <div className="flex items-center flex-1 min-w-0 overflow-hidden">
        <div 
          ref={scrollContainerRef}
          className="flex items-center overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
        <Droppable droppableId="tab-bar" direction="horizontal" type="tab">
          {(provided) => (
            <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex items-center gap-1"
            >
                {groupedData.map((item, idx) => {
                  // Render tab group
                  if ('group' in item) {
                    const { group, tabs: groupTabs } = item;
                    const isCollapsed = group.collapsed;
                    
                    return (
                      <div key={group.id} className="flex items-center gap-0.5">
                        {/* Group indicator */}
                        <button
                          onClick={() => onToggleGroup?.(group.id)}
                          className="flex items-center gap-1 px-2 h-8 rounded-md hover:bg-muted/50 transition-colors"
                          style={{ borderLeft: `3px solid ${group.color}` }}
                        >
                          {isCollapsed ? (
                            <ChevronRight className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                          <span className="text-xs font-medium truncate max-w-[80px]">
                            {group.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({groupTabs.length})
                          </span>
                        </button>

                        {/* Group tabs */}
                        {!isCollapsed && groupTabs.map((tab, tabIndex) => {
                          const TabIcon = getIconByName(tab.icon as IconName | undefined);
                          const isActive = tab.id === activeTabId;
                          const useThumbnail = !tab.isTemporary && tab.thumbnail_url && !['folder', 'list'].includes(tab.type);

                          return (
                            <Draggable key={tab.id} draggableId={tab.id} index={idx + tabIndex}>
                              {(provided, snapshot) => (
                                <Droppable droppableId={`tab-drop-${tab.id}`} type="canvas-item">
                                  {(dropProvided, dropSnapshot) => (
                                    <div
                                      ref={(el) => {
                                        provided.innerRef(el);
                                        dropProvided.innerRef(el);
                                      }}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      {...dropProvided.droppableProps}
                                      onClick={() => onTabClick(tab.id)}
                                      className={cn(
                                        "flex items-center gap-2 px-3 h-full border-b-2 cursor-pointer transition-colors relative group flex-shrink-0 min-w-[140px] max-w-[200px]",
                                        isActive 
                                          ? 'border-primary text-primary bg-background/80' 
                                          : 'border-transparent text-muted-foreground hover:bg-muted/50',
                                        dropSnapshot.isDraggingOver && "bg-primary/20"
                                      )}
                                      style={{ borderTop: `2px solid ${group.color}` }}
                                    >
                                      {(() => {
                                        const rank = getTabAccessRank(tab.id);
                                        return rank !== null && rank < 3 && (
                                          <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ 
                                              opacity: rank === 2 && !thirdTabVisible ? 0 : (rank === 0 ? 1 : rank === 1 ? 0.75 : 0.5),
                                              scale: 1 
                                            }}
                                            transition={{ duration: 0.3 }}
                                            className={cn(
                                              "absolute bottom-0 left-0 right-0 h-0.5",
                                              getTracerColor(rank)
                                            )}
                                          />
                                        );
                                      })()}
                                      {useThumbnail ? (
                                        <div className="relative w-4 h-4 rounded-sm overflow-hidden">
                                          <Image src={tab.thumbnail_url!} alt={tab.title || ''} layout="fill" objectFit="cover" />
                                        </div>
                                      ) : TabIcon ? (
                                        <TabIcon className="h-4 w-4" />
                                      ) : tab.isTemporary ? (
                                        <Search className="h-4 w-4" />
                                      ) : null}

                                      <span className={cn("text-sm font-medium truncate", tab.isTemporary && "italic")}>{tab.title}</span>
                                      {tab.id !== 'root' && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onCloseTab(tab.id);
                                          }}
                                          className="p-1 rounded-full hover:bg-destructive/20 group-hover:opacity-100 opacity-50"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      )}
                                      {dropProvided.placeholder}
                                    </div>
                                  )}
                                </Droppable>
                              )}
                            </Draggable>
                          );
                        })}
                      </div>
                    );
                  }

                  // Render ungrouped tab
                  const tab = item.tab;
                  const TabIcon = getIconByName(tab.icon as IconName | undefined);
                  const isActive = tab.id === activeTabId;
                  const useThumbnail = !tab.isTemporary && tab.thumbnail_url && !['folder', 'list'].includes(tab.type);

                  return (
                    <Draggable key={tab.id} draggableId={tab.id} index={idx}>
                      {(provided, snapshot) => (
                        <Droppable droppableId={`tab-drop-${tab.id}`} type="canvas-item">
                          {(dropProvided, dropSnapshot) => (
                            <div
                              ref={(el) => {
                                provided.innerRef(el);
                                dropProvided.innerRef(el);
                              }}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              {...dropProvided.droppableProps}
                              onClick={() => onTabClick(tab.id)}
                              className={cn(
                                "flex items-center gap-2 px-3 h-full border-b-2 cursor-pointer transition-colors relative group flex-shrink-0 min-w-[140px] max-w-[200px]",
                                isActive 
                                  ? 'border-primary text-primary bg-background/80' 
                                  : 'border-transparent text-muted-foreground hover:bg-muted/50',
                                dropSnapshot.isDraggingOver && "bg-primary/20"
                              )}
                            >
                              {(() => {
                                const rank = getTabAccessRank(tab.id);
                                return rank !== null && rank < 3 && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ 
                                      opacity: rank === 2 && !thirdTabVisible ? 0 : (rank === 0 ? 1 : rank === 1 ? 0.75 : 0.5),
                                      scale: 1 
                                    }}
                                    transition={{ duration: 0.3 }}
                                    className={cn(
                                      "absolute bottom-0 left-0 right-0 h-0.5",
                                      getTracerColor(rank)
                                    )}
                                  />
                                );
                              })()}
                              {useThumbnail ? (
                                <div className="relative w-4 h-4 rounded-sm overflow-hidden">
                                  <Image src={tab.thumbnail_url!} alt={tab.title || ''} layout="fill" objectFit="cover" />
                                </div>
                              ) : TabIcon ? (
                                <TabIcon className="h-4 w-4" />
                              ) : tab.isTemporary ? (
                                <Search className="h-4 w-4" />
                              ) : null}

                              <span className={cn("text-sm font-medium truncate", tab.isTemporary && "italic")}>{tab.title}</span>
                              {tab.id !== 'root' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onCloseTab(tab.id);
                                  }}
                                  className="p-1 rounded-full hover:bg-destructive/20 group-hover:opacity-100 opacity-50"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                              {dropProvided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
            </div>
          )}
        </Droppable>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 ml-1 flex-shrink-0" onClick={onNewTab}>
            <Plus className="h-4 w-4" />
        </Button>
      </div>
       <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant='ghost' size="icon" className='h-8 w-8' data-testid="layout-settings-button">
                    <LayoutGrid className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onSetLayout(1)}>Tek Ekran</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSetLayout(2)}>2'li Bölünmüş</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSetLayout(3)}>3'lü Bölünmüş</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSetLayout(4)}>4'lü Izgara</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSetLayout(6)}>6'lı Izgara</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
  );
}

    