import React, { useState, useEffect } from 'react';
import { ExternalLink, Link2Off, HelpCircle } from 'lucide-react';
import { TileDefinition } from '../types';
import { IconMap } from '../constants';

interface TileCardProps {
  tile: TileDefinition;
}

export const TileCard: React.FC<TileCardProps> = ({ tile }) => {
  // Fallback to HelpCircle if icon string is invalid
  const IconComponent = IconMap[tile.icon] || HelpCircle;
  const isValidUrl = tile.url && tile.url.trim() !== '';

  // State to handle image loading errors (fallback to icon if image fails)
  const [imageError, setImageError] = useState(false);
  const showImage = tile.imageUrl && tile.imageUrl.trim() !== '' && !imageError;

  // Reset error state if the image URL changes
  useEffect(() => {
    setImageError(false);
  }, [tile.imageUrl]);

  const CardContent = (
    <div className={`
      relative h-full flex flex-col p-6 rounded-xl border transition-all duration-200
      ${isValidUrl 
        ? 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-teal-400 group cursor-pointer' 
        : 'bg-slate-50 border-slate-200 opacity-70 cursor-not-allowed'}
    `}>
      <div className="flex items-start justify-between mb-4">
        <div className={`
          rounded-lg flex items-center justify-center shrink-0 w-14 h-14 overflow-hidden
          ${isValidUrl ? 'bg-teal-50 text-teal-700 group-hover:bg-teal-100' : 'bg-slate-200 text-slate-400'}
        `}>
          {showImage ? (
            <img 
              src={tile.imageUrl} 
              alt="" 
              className="w-full h-full object-contain p-2"
              onError={() => setImageError(true)}
            />
          ) : (
            <IconComponent size={28} strokeWidth={1.5} />
          )}
        </div>
        {isValidUrl && (
          <ExternalLink size={16} className="text-slate-400 group-hover:text-teal-600 transition-colors" />
        )}
      </div>
      
      <h3 className={`font-semibold text-lg mb-1 truncate ${isValidUrl ? 'text-slate-800 group-hover:text-teal-800' : 'text-slate-500'}`}>
        {tile.label}
      </h3>
      
      {tile.description && (
        <p className="text-sm text-slate-500 line-clamp-2">
          {tile.description}
        </p>
      )}

      {!isValidUrl && (
        <div className="mt-auto pt-4 flex items-center text-xs text-red-500 font-medium">
          <Link2Off size={14} className="mr-1" />
          Link not set
        </div>
      )}
    </div>
  );

  if (isValidUrl) {
    return (
      <a 
        href={tile.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block h-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded-xl"
      >
        {CardContent}
      </a>
    );
  }

  return <div className="h-full">{CardContent}</div>;
};