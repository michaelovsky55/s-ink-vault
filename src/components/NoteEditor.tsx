
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useNotebook } from '@/context/NotebookContext';
import { Mic, MicOff, Save } from 'lucide-react';
import { toast } from 'sonner';

export function NoteEditor() {
  const { activeNoteId, getActiveNote, updateNote } = useNotebook();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  
  const activeNote = getActiveNote();
  
  // Initialize title and content when active note changes
  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
    } else {
      setTitle('');
      setContent('');
    }
  }, [activeNote]);
  
  // Auto-save note content after a delay
  useEffect(() => {
    if (activeNoteId && (title !== activeNote?.title || content !== activeNote?.content)) {
      const timer = setTimeout(() => {
        updateNote(activeNoteId, { title, content });
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [title, content, activeNoteId, activeNote, updateNote]);
  
  // Set up speech recognition
  useEffect(() => {
    // Check if browser supports the Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join(' ');
        
        setContent(prev => prev + ' ' + transcript);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        toast.error('Speech recognition error', {
          description: event.error,
        });
        setIsRecording(false);
      };
      
      recognitionInstance.onend = () => {
        setIsRecording(false);
      };
      
      setRecognition(recognitionInstance);
    }
    
    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (error) {
          console.error('Error stopping recognition:', error);
        }
      }
    };
  }, []);
  
  const toggleSpeechRecognition = () => {
    if (!recognition) {
      toast.error('Speech recognition not supported by your browser');
      return;
    }
    
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
      toast.success('Voice recording stopped');
    } else {
      recognition.start();
      setIsRecording(true);
      toast.success('Voice recording started', {
        description: 'Speak clearly into your microphone',
      });
    }
  };
  
  if (!activeNote) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <h3 className="text-xl font-medium mb-2">No note selected</h3>
        <p className="text-muted-foreground">
          Select a note from the list or create a new one
        </p>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          className="text-xl font-semibold bg-transparent border-none shadow-none focus-visible:ring-0 p-0 h-auto"
        />
        <div className="flex items-center gap-2">
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            onClick={toggleSpeechRecognition}
            title={isRecording ? "Stop recording" : "Start voice recording"}
          >
            {isRecording ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
          <Button
            onClick={() => {
              updateNote(activeNoteId, { title, content });
              toast.success('Note saved successfully');
            }}
            size="sm"
            className="gap-1"
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-hidden">
        <Card 
          className={`h-full note-content p-4 ${isRecording ? 'ring-2 ring-destructive pulse' : ''}`}
        >
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start typing your note content here..."
            className="w-full h-full resize-none bg-transparent border-none shadow-none focus-visible:ring-0 p-0 text-lg"
          />
        </Card>
      </div>
    </div>
  );
}
