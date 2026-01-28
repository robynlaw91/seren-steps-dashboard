import React, { useState, useEffect, useRef } from 'react';
import { Save, RotateCcw, X, AlertCircle, Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { TileDefinition } from '../types';
import { IconMap } from '../constants';
import { supabase, IMAGES_BUCKET } from '../lib/supabase';

interface LinkManagerProps {
  initialTiles: TileDefinition[];
  onSave: (tiles: TileDefinition[]) => void;
  onReset: () => void;
  onClose: () => void;
  isSaving?: boolean;
}

export const LinkManager: React.FC<LinkManagerProps> = ({
  initialTiles,
  onSave,
  onReset,
  onClose,
  isSaving = false
}) => {
  const [tiles, setTiles] = useState<TileDefinition[]>([]);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    // Deep copy to avoid mutating props directly
    setTiles(JSON.parse(JSON.stringify(initialTiles)));
  }, [initialTiles]);

  const handleUpdateTile = (id: string, field: keyof TileDefinition, value: string) => {
    setTiles(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleDeleteTile = (id: string) => {
    if (window.confirm('Are you sure you want to delete this shortcut?')) {
      setTiles(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleAddTile = () => {
    const newId = `custom-${Date.now()}`;
    const newTile: TileDefinition = {
      id: newId,
      label: 'New App',
      url: '',
      icon: 'Globe',
      description: 'Description here'
    };
    setTiles(prev => [...prev, newTile]);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newTiles = [...tiles];
    const [draggedTile] = newTiles.splice(draggedIndex, 1);
    newTiles.splice(dropIndex, 0, draggedTile);
    setTiles(newTiles);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleImageUpload = async (id: string, file: File) => {
    // Limit upload to 2MB for Supabase Storage
    if (file.size > 2 * 1024 * 1024) {
      alert("Image is too large. Please use an image smaller than 2MB.");
      return;
    }

    setUploadingId(id);

    try {
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(IMAGES_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(IMAGES_BUCKET)
        .getPublicUrl(fileName);

      // Update the tile with the new image URL
      handleUpdateTile(id, 'imageUrl', publicUrl);
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingId(null);
    }
  };

  const handleRemoveImage = async (id: string, imageUrl: string | undefined) => {
    if (!imageUrl) return;

    try {
      // Extract filename from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // Delete from Supabase Storage (optional - cleanup)
      await supabase.storage
        .from(IMAGES_BUCKET)
        .remove([fileName]);
    } catch (err) {
      console.error('Error deleting image from storage:', err);
      // Continue anyway - the image URL will be removed
    }

    // Clear the image URL from the tile
    handleUpdateTile(id, 'imageUrl', '');
  };

  const handleSave = () => {
    onSave(tiles);
  };

  const iconOptions = Object.keys(IconMap);

  return (
    <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-6 shadow-inner animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-800">Manage Dashboard Links</h2>
            <span className="bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded-full font-medium">Admin Mode</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
            aria-label="Close manager"
            disabled={isSaving}
          >
            <X size={24} />
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-4 flex items-center">
          <GripVertical size={16} className="mr-1 text-slate-400" />
          Drag tiles to reorder them
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {tiles.map((tile, index) => {
            const Icon = IconMap[tile.icon] || IconMap['Globe'];
            const isUploading = uploadingId === tile.id;
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;

            return (
              <div
                key={tile.id}
                draggable={!isSaving}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  bg-white p-4 rounded-lg border-2 shadow-sm relative group transition-all
                  ${isDragging ? 'opacity-50 scale-95 border-teal-400' : 'border-slate-200'}
                  ${isDragOver ? 'border-teal-500 bg-teal-50' : ''}
                  ${!isSaving ? 'cursor-grab active:cursor-grabbing' : ''}
                `}
              >
                <div className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                   <button
                     onClick={() => handleDeleteTile(tile.id)}
                     className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md"
                     title="Delete Tile"
                     disabled={isSaving}
                   >
                     <Trash2 size={16} />
                   </button>
                </div>

                <div className="flex items-start space-x-3 mb-3">
                   <div className="pt-2 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing">
                     <GripVertical size={20} />
                   </div>
                   <div className="flex-1 space-y-3">
                      {/* Row 1: Label */}
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Label</label>
                        <input
                          type="text"
                          value={tile.label}
                          onChange={(e) => handleUpdateTile(tile.id, 'label', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                          disabled={isSaving}
                        />
                      </div>

                      {/* Row 2: URL */}
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">URL</label>
                        <input
                          type="url"
                          value={tile.url}
                          onChange={(e) => handleUpdateTile(tile.id, 'url', e.target.value)}
                          placeholder="https://..."
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono text-xs"
                          disabled={isSaving}
                        />
                      </div>

                      {/* Row 3: Icon and Image Upload */}
                      <div className="flex gap-2">
                         <div className="w-1/3">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Icon</label>
                            <div className="relative">
                               <select
                                 value={tile.icon}
                                 onChange={(e) => handleUpdateTile(tile.id, 'icon', e.target.value)}
                                 className="w-full pl-8 pr-2 py-1.5 border border-slate-300 rounded text-sm appearance-none focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                 disabled={isSaving}
                               >
                                 {iconOptions.map(iconName => (
                                   <option key={iconName} value={iconName}>{iconName}</option>
                                 ))}
                               </select>
                               <div className="absolute left-2 top-1.5 pointer-events-none text-teal-600">
                                 <Icon size={14} />
                               </div>
                            </div>
                         </div>
                         <div className="w-2/3">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Or Upload Image</label>
                            {isUploading ? (
                              <div className="flex items-center space-x-2 border border-slate-200 rounded px-2 py-1.5 bg-slate-50">
                                <Loader2 size={16} className="animate-spin text-teal-600" />
                                <span className="text-xs text-slate-500">Uploading...</span>
                              </div>
                            ) : tile.imageUrl ? (
                                <div className="flex items-center space-x-2 border border-slate-200 rounded px-2 py-1 bg-slate-50">
                                    <img src={tile.imageUrl} alt="Preview" className="h-6 w-6 object-contain" />
                                    <span className="text-xs text-slate-500 truncate flex-1">Image set</span>
                                    <button
                                        onClick={() => handleRemoveImage(tile.id, tile.imageUrl)}
                                        className="text-xs text-red-500 hover:text-red-700 font-medium px-1"
                                        disabled={isSaving}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleImageUpload(tile.id, file);
                                        }}
                                        className="block w-full text-xs text-slate-500
                                          file:mr-2 file:py-1 file:px-2
                                          file:rounded-full file:border-0
                                          file:text-xs file:font-medium
                                          file:bg-teal-50 file:text-teal-700
                                          hover:file:bg-teal-100
                                          cursor-pointer
                                        "
                                        disabled={isSaving}
                                    />
                                </div>
                            )}
                         </div>
                      </div>

                       {/* Row 4: Description */}
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                        <input
                          type="text"
                          value={tile.description || ''}
                          onChange={(e) => handleUpdateTile(tile.id, 'description', e.target.value)}
                          placeholder="Short description"
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                          disabled={isSaving}
                        />
                      </div>
                   </div>
                </div>
              </div>
            );
          })}

          {/* Add New Button */}
          <button
            onClick={handleAddTile}
            className="flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50 transition-all min-h-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving}
          >
            <div className="bg-white p-3 rounded-full shadow-sm mb-3">
               <Plus size={24} />
            </div>
            <span className="font-medium">Add New App</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 sticky bottom-0 bg-slate-50 pb-2">
            <div className="flex items-center text-sm text-slate-500">
                 <AlertCircle size={16} className="mr-2 text-slate-400" />
                 Changes sync across all devices.
            </div>
            <div className="flex space-x-3 w-full sm:w-auto">
                <button
                    onClick={() => {
                        if (window.confirm('Resetting will delete all custom links and restore defaults. Continue?')) {
                            onReset();
                        }
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSaving}
                >
                    <RotateCcw size={18} className="mr-2" />
                    Reset Defaults
                </button>
                <button
                    onClick={handleSave}
                    className="flex-1 sm:flex-none flex items-center justify-center px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSaving || uploadingId !== null}
                >
                    {isSaving ? (
                      <>
                        <Loader2 size={18} className="mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} className="mr-2" />
                        Save Changes
                      </>
                    )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
