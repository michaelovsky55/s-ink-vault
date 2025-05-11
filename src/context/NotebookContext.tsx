
import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'sonner';

// Define types for our data structures
export type Note = {
  id: string;
  title: string;
  content: string;
  tabId: string;
  createdAt: string;
  updatedAt: string;
};

export type Tab = {
  id: string;
  name: string;
  createdAt: string;
};

interface NotebookContextType {
  notes: Note[];
  tabs: Tab[];
  activeTabId: string;
  activeNoteId: string | null;
  setActiveTabId: (id: string) => void;
  setActiveNoteId: (id: string | null) => void;
  createTab: (name: string) => void;
  updateTabName: (id: string, name: string) => void;
  deleteTab: (id: string) => void;
  createNote: (tabId: string, title?: string) => string;
  updateNote: (id: string, data: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  getNotesByTabId: (tabId: string) => Note[];
  getActiveNote: () => Note | null;
}

const NotebookContext = createContext<NotebookContextType | undefined>(undefined);

export function NotebookProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  
  // Initialize with a default tab if none exists
  useEffect(() => {
    const loadData = () => {
      try {
        // Load tabs from localStorage
        const savedTabs = localStorage.getItem('notebook-tabs');
        const parsedTabs = savedTabs ? JSON.parse(savedTabs) as Tab[] : [];
        
        // Load notes from localStorage
        const savedNotes = localStorage.getItem('notebook-notes');
        const parsedNotes = savedNotes ? JSON.parse(savedNotes) as Note[] : [];
        
        // If no tabs, create a default one
        if (parsedTabs.length === 0) {
          const defaultTab: Tab = {
            id: 'tab-' + Date.now(),
            name: 'General',
            createdAt: new Date().toISOString(),
          };
          parsedTabs.push(defaultTab);
        }
        
        // Get active tab from localStorage or use the first tab
        const savedActiveTabId = localStorage.getItem('notebook-active-tab-id');
        const initialActiveTabId = savedActiveTabId || parsedTabs[0].id;
        
        // Get active note from localStorage
        const savedActiveNoteId = localStorage.getItem('notebook-active-note-id');
        
        // Set state
        setTabs(parsedTabs);
        setNotes(parsedNotes);
        setActiveTabId(initialActiveTabId);
        setActiveNoteId(savedActiveNoteId);
        
        toast.success('Notes loaded successfully', {
          description: `${parsedNotes.length} notes in ${parsedTabs.length} tabs`,
          duration: 2000,
        });
      } catch (error) {
        console.error('Error loading notebook data:', error);
        toast.error('Failed to load your notes');
      }
    };
    
    loadData();
  }, []);
  
  // Save to localStorage whenever data changes
  useEffect(() => {
    if (tabs.length > 0) {
      localStorage.setItem('notebook-tabs', JSON.stringify(tabs));
    }
    if (notes.length > 0 || tabs.length > 0) {
      localStorage.setItem('notebook-notes', JSON.stringify(notes));
    }
    if (activeTabId) {
      localStorage.setItem('notebook-active-tab-id', activeTabId);
    }
    if (activeNoteId) {
      localStorage.setItem('notebook-active-note-id', activeNoteId);
    } else {
      localStorage.removeItem('notebook-active-note-id');
    }
  }, [tabs, notes, activeTabId, activeNoteId]);
  
  // Tab operations
  const createTab = (name: string) => {
    const newTab: Tab = {
      id: 'tab-' + Date.now(),
      name,
      createdAt: new Date().toISOString(),
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
    toast.success(`Tab "${name}" created`);
  };
  
  const updateTabName = (id: string, name: string) => {
    setTabs(tabs.map(tab => tab.id === id ? { ...tab, name } : tab));
    toast.success(`Tab renamed to "${name}"`);
  };
  
  const deleteTab = (id: string) => {
    // If we're deleting the active tab, set a different active tab
    if (activeTabId === id) {
      const otherTab = tabs.find(t => t.id !== id);
      if (otherTab) {
        setActiveTabId(otherTab.id);
      }
    }
    
    // Delete the tab and associated notes
    setTabs(tabs.filter(tab => tab.id !== id));
    setNotes(notes.filter(note => note.tabId !== id));
    
    toast.success('Tab deleted');
  };
  
  // Note operations
  const createNote = (tabId: string, title = 'New Note') => {
    const id = 'note-' + Date.now();
    const newNote: Note = {
      id,
      title,
      content: '',
      tabId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes([...notes, newNote]);
    setActiveNoteId(id);
    toast.success('New note created');
    return id;
  };
  
  const updateNote = (id: string, data: Partial<Note>) => {
    setNotes(notes.map(note => {
      if (note.id === id) {
        return {
          ...note,
          ...data,
          updatedAt: new Date().toISOString(),
        };
      }
      return note;
    }));
  };
  
  const deleteNote = (id: string) => {
    // If we're deleting the active note, clear the active note
    if (activeNoteId === id) {
      setActiveNoteId(null);
    }
    
    // Delete the note
    setNotes(notes.filter(note => note.id !== id));
    toast.success('Note deleted');
  };
  
  // Helper functions
  const getNotesByTabId = (tabId: string) => {
    return notes.filter(note => note.tabId === tabId);
  };
  
  const getActiveNote = () => {
    return activeNoteId ? notes.find(note => note.id === activeNoteId) || null : null;
  };
  
  const value = {
    notes,
    tabs,
    activeTabId,
    activeNoteId,
    setActiveTabId,
    setActiveNoteId,
    createTab,
    updateTabName,
    deleteTab,
    createNote,
    updateNote,
    deleteNote,
    getNotesByTabId,
    getActiveNote,
  };
  
  return (
    <NotebookContext.Provider value={value}>
      {children}
    </NotebookContext.Provider>
  );
}

export function useNotebook() {
  const context = useContext(NotebookContext);
  if (context === undefined) {
    throw new Error('useNotebook must be used within a NotebookProvider');
  }
  return context;
}
