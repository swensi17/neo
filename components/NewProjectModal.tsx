import React, { useState, useEffect } from 'react';
import { X, Briefcase, DollarSign, Smartphone, GraduationCap, Pencil, Leaf, Code, Image, Music, ShoppingBag, Scissors, Palette, Dumbbell, Snowflake, Printer, Scale, Lightbulb, Plane, Globe, Wrench, Users, FlaskConical, Heart, ShoppingCart, FolderPlus } from 'lucide-react';
import { Project } from '../types';

// Available icons for projects
const PROJECT_ICONS = [
  { name: 'Briefcase', icon: Briefcase },
  { name: 'DollarSign', icon: DollarSign },
  { name: 'Smartphone', icon: Smartphone },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'Pencil', icon: Pencil },
  { name: 'Leaf', icon: Leaf },
  { name: 'Code', icon: Code },
  { name: 'Image', icon: Image },
  { name: 'Music', icon: Music },
  { name: 'ShoppingBag', icon: ShoppingBag },
  { name: 'Scissors', icon: Scissors },
  { name: 'Palette', icon: Palette },
  { name: 'Dumbbell', icon: Dumbbell },
  { name: 'Snowflake', icon: Snowflake },
  { name: 'Printer', icon: Printer },
  { name: 'Scale', icon: Scale },
  { name: 'Lightbulb', icon: Lightbulb },
  { name: 'Plane', icon: Plane },
  { name: 'Globe', icon: Globe },
  { name: 'Wrench', icon: Wrench },
  { name: 'Users', icon: Users },
  { name: 'FlaskConical', icon: FlaskConical },
  { name: 'Heart', icon: Heart },
  { name: 'ShoppingCart', icon: ShoppingCart },
];

// Available colors
const PROJECT_COLORS = [
  '#ffffff', // white
  '#ef4444', // red
  '#f97316', // orange
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#a855f7', // purple
  '#ec4899', // pink
];

// Suggested project names
const SUGGESTED_PROJECTS = [
  { name: 'Инвестиции', icon: 'DollarSign', color: '#22c55e' },
  { name: 'Домашняя работа', icon: 'GraduationCap', color: '#3b82f6' },
  { name: 'Стартап', icon: 'Lightbulb', color: '#f97316' },
];

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: Omit<Project, 'id' | 'createdAt' | 'chatIds'>) => void;
  onSelectExisting?: (projectId: string) => void;
  existingProjects?: Array<{ id: string; name: string }>;
  isRu: boolean;
  isLight: boolean;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
  onSelectExisting,
  existingProjects = [],
  isRu,
  isLight
}) => {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Briefcase');
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setSelectedIcon('Briefcase');
      setSelectedColor('#ffffff');
      setShowIconPicker(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!name.trim()) return;
    
    // Check if project with same name exists
    const existing = existingProjects.find(
      p => p.name.toLowerCase() === name.trim().toLowerCase()
    );
    
    if (existing && onSelectExisting) {
      // Redirect to existing project
      onSelectExisting(existing.id);
      onClose();
      return;
    }
    
    onCreateProject({
      name: name.trim(),
      icon: selectedIcon,
      color: selectedColor,
    });
    onClose();
  };

  const handleSuggestionClick = (suggestion: typeof SUGGESTED_PROJECTS[0]) => {
    setName(suggestion.name);
    setSelectedIcon(suggestion.icon);
    setSelectedColor(suggestion.color);
  };

  const SelectedIconComponent = PROJECT_ICONS.find(i => i.name === selectedIcon)?.icon || Briefcase;

  const bgMain = isLight ? 'bg-white' : 'bg-[#000000]';
  const bgCard = isLight ? 'bg-zinc-100' : 'bg-[#1a1a1a]';
  const textColor = isLight ? 'text-zinc-900' : 'text-white';
  const textMuted = isLight ? 'text-zinc-500' : 'text-zinc-400';
  const borderColor = isLight ? 'border-zinc-200' : 'border-zinc-800';

  // Icon Picker Modal
  if (showIconPicker) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={() => setShowIconPicker(false)}>
        <div className="absolute inset-0 bg-black/60" />
        <div 
          className={`relative w-full max-w-md ${bgMain} rounded-2xl overflow-hidden animate-slide-up`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4">
            <span className={`text-[17px] font-semibold ${textColor}`}>
              {isRu ? 'Выберите значок' : 'Choose icon'}
            </span>
            <button 
              onClick={() => setShowIconPicker(false)}
              className={`px-4 py-1.5 rounded-full ${isLight ? 'bg-zinc-200' : 'bg-zinc-800'} ${textColor} text-sm font-medium`}
            >
              {isRu ? 'Готово' : 'Done'}
            </button>
          </div>

          {/* Preview */}
          <div className="flex justify-center py-6">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: selectedColor === '#ffffff' ? (isLight ? '#e4e4e7' : '#27272a') : selectedColor + '20' }}
            >
              <SelectedIconComponent 
                size={32} 
                style={{ color: selectedColor === '#ffffff' ? (isLight ? '#71717a' : '#a1a1aa') : selectedColor }} 
              />
            </div>
          </div>

          {/* Colors */}
          <div className="flex justify-center gap-3 px-4 pb-6">
            {PROJECT_COLORS.map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded-full transition-transform ${selectedColor === color ? 'ring-2 ring-offset-2 ring-offset-black ring-white scale-110' : ''}`}
                style={{ 
                  backgroundColor: color === '#ffffff' ? 'transparent' : color,
                  border: color === '#ffffff' ? '2px solid #71717a' : 'none'
                }}
              />
            ))}
          </div>

          {/* Icons Grid */}
          <div className="grid grid-cols-6 gap-2 px-4 pb-6 max-h-[300px] overflow-y-auto">
            {PROJECT_ICONS.map(({ name, icon: Icon }) => (
              <button
                key={name}
                onClick={() => setSelectedIcon(name)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  selectedIcon === name 
                    ? (isLight ? 'bg-zinc-200' : 'bg-zinc-700') 
                    : 'hover:bg-zinc-800/50'
                }`}
              >
                <Icon size={24} className={textMuted} />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div 
        className={`relative w-full max-w-md ${bgMain} rounded-2xl overflow-hidden animate-slide-up`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4">
          <button 
            onClick={onClose}
            className={`w-9 h-9 rounded-full ${bgCard} flex items-center justify-center`}
          >
            <X size={18} className={textMuted} />
          </button>
          <span className={`text-[17px] font-semibold ${textColor}`}>
            {isRu ? 'Новый проект' : 'New Project'}
          </span>
          <button 
            onClick={onClose}
            className={`w-9 h-9 rounded-full flex items-center justify-center opacity-0`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Description */}
        <p className={`text-center text-sm ${textMuted} px-8 pb-4`}>
          {isRu 
            ? 'Проекты предоставляют общий контекст для чатов и файлов в одном месте.'
            : 'Projects provide shared context for chats and files in one place.'}
        </p>

        {/* Name Input */}
        <div className={`mx-4 mb-4 flex items-center gap-3 px-4 py-3 ${bgCard} rounded-xl`}>
          <button 
            onClick={() => setShowIconPicker(true)}
            className="flex-shrink-0"
          >
            <SelectedIconComponent 
              size={24} 
              style={{ color: selectedColor === '#ffffff' ? textMuted : selectedColor }} 
            />
          </button>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={isRu ? 'Название проекта' : 'Project name'}
            className={`flex-1 bg-transparent ${textColor} placeholder-zinc-500 focus:outline-none text-[16px]`}
            autoFocus
          />
        </div>

        {/* Suggestions */}
        <div className="flex gap-2 px-4 pb-6 overflow-x-auto scrollbar-hide">
          {SUGGESTED_PROJECTS.map((suggestion, i) => {
            const SugIcon = PROJECT_ICONS.find(ic => ic.name === suggestion.icon)?.icon || Briefcase;
            return (
              <button
                key={i}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`flex items-center gap-2 px-3 py-2 ${bgCard} rounded-full whitespace-nowrap`}
              >
                <SugIcon size={16} style={{ color: suggestion.color }} />
                <span className={`text-sm ${textColor}`}>{suggestion.name}</span>
              </button>
            );
          })}
        </div>

        {/* Create Button */}
        <div className="px-4 pb-6">
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className={`w-full py-3.5 rounded-xl font-medium transition-all ${
              name.trim()
                ? 'bg-zinc-200 text-zinc-900 active:bg-zinc-300'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {isRu ? 'Создать проект' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
};
