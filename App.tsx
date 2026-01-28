import React, { useState, useEffect, useCallback } from 'react';
import { Search, Settings, Clock, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { TileCard } from './components/TileCard';
import { LinkManager } from './components/LinkManager';
import { DEFAULT_TILES } from './constants';
import { UserConfig, TileDefinition } from './types';
import { supabase } from './lib/supabase';

export default function App() {
  const [tiles, setTiles] = useState<TileDefinition[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isManaging, setIsManaging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch tiles from Supabase
  const fetchTiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('tiles')
        .select('*')
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        // Map database fields to our TileDefinition interface
        const mappedTiles: TileDefinition[] = data.map(row => ({
          id: row.id,
          label: row.label,
          url: row.url,
          icon: row.icon,
          imageUrl: row.image_url || undefined,
          description: row.description || undefined
        }));
        setTiles(mappedTiles);

        // Get the most recent update timestamp
        const latestUpdate = data.reduce((latest, row) => {
          const rowDate = new Date(row.updated_at);
          return rowDate > latest ? rowDate : latest;
        }, new Date(0));

        if (latestUpdate.getTime() > 0) {
          setLastUpdated(latestUpdate.toLocaleString());
        }
      } else {
        // No tiles exist, seed with defaults
        await seedDefaultTiles();
      }
    } catch (err) {
      console.error('Error fetching tiles:', err);
      setError('Failed to load links. Please refresh the page.');
      // Fall back to defaults
      setTiles(DEFAULT_TILES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Seed default tiles on first use
  const seedDefaultTiles = async () => {
    try {
      const tilesToInsert = DEFAULT_TILES.map((tile, index) => ({
        id: tile.id,
        label: tile.label,
        url: tile.url,
        icon: tile.icon,
        image_url: tile.imageUrl || null,
        description: tile.description || null,
        sort_order: index
      }));

      const { error: insertError } = await supabase
        .from('tiles')
        .insert(tilesToInsert);

      if (insertError) throw insertError;

      setTiles(DEFAULT_TILES);
    } catch (err) {
      console.error('Error seeding defaults:', err);
      setTiles(DEFAULT_TILES);
    }
  };

  useEffect(() => {
    fetchTiles();
  }, [fetchTiles]);

  // Subscribe to real-time changes
  useEffect(() => {
    const channel = supabase
      .channel('tiles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tiles' },
        () => {
          // Refetch when any change happens
          fetchTiles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTiles]);

  const handleSave = async (newTiles: TileDefinition[]) => {
    setIsSaving(true);
    setError(null);

    try {
      // Delete all existing tiles first
      const { error: deleteError } = await supabase
        .from('tiles')
        .delete()
        .neq('id', ''); // Delete all rows

      if (deleteError) throw deleteError;

      // Insert all new tiles with sort order
      const tilesToInsert = newTiles.map((tile, index) => ({
        id: tile.id,
        label: tile.label,
        url: tile.url,
        icon: tile.icon,
        image_url: tile.imageUrl || null,
        description: tile.description || null,
        sort_order: index
      }));

      const { error: insertError } = await supabase
        .from('tiles')
        .insert(tilesToInsert);

      if (insertError) throw insertError;

      const timestamp = new Date().toLocaleString();
      setTiles(newTiles);
      setLastUpdated(timestamp);
      setIsManaging(false);
    } catch (err) {
      console.error('Error saving tiles:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Delete all existing tiles
      const { error: deleteError } = await supabase
        .from('tiles')
        .delete()
        .neq('id', '');

      if (deleteError) throw deleteError;

      // Re-seed with defaults
      await seedDefaultTiles();
      setLastUpdated(null);
      setIsManaging(false);
    } catch (err) {
      console.error('Error resetting:', err);
      setError('Failed to reset. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTiles = tiles.filter(tile =>
    tile.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tile.description && tile.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 size={40} className="animate-spin text-teal-600" />
          <p className="text-slate-500">Loading links...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-teal-600 p-2 rounded-lg text-white shadow-md">
              <Sparkles size={24} fill="currentColor" className="text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
                Seren Steps <span className="text-teal-600">Manager Dashboard</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">QUICK LINKS & RESOURCES</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
             {/* Search Box - Hidden on very small screens if needed, or compact */}
            <div className="relative hidden sm:block w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Find an app..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-full leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-all"
              />
            </div>
          </div>
        </div>

        {/* Mobile Search Bar (visible only on mobile) */}
        <div className="sm:hidden px-4 pb-4">
             <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Find an app..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 sm:text-sm"
              />
            </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center space-x-2 text-red-700">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">

          {/* Last Updated Indicator - Only shown if changes have been saved */}
          {lastUpdated && (
            <div className="flex justify-end mb-4">
               <div className="flex items-center text-xs text-slate-400">
                  <Clock size={12} className="mr-1.5" />
                  Configuration last updated: {lastUpdated}
               </div>
            </div>
          )}

          {/* Grid */}
          {filteredTiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredTiles.map(tile => (
                <TileCard
                  key={tile.id}
                  tile={tile}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-slate-500 text-lg">No apps found matching "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-teal-600 font-medium hover:text-teal-700 hover:underline"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer / Manager Toggle */}
      <footer className="mt-auto">
        {!isManaging ? (
          <div className="bg-white border-t border-slate-200 py-4">
            <div className="max-w-7xl mx-auto px-4 flex justify-center">
              <button
                onClick={() => setIsManaging(true)}
                className="flex items-center text-sm text-slate-500 hover:text-teal-600 transition-colors px-4 py-2 rounded-md hover:bg-slate-50"
              >
                <Settings size={16} className="mr-2" />
                Manage Links
              </button>
            </div>
          </div>
        ) : (
          <LinkManager
            initialTiles={tiles}
            onSave={handleSave}
            onReset={handleReset}
            onClose={() => setIsManaging(false)}
            isSaving={isSaving}
          />
        )}
      </footer>
    </div>
  );
}
