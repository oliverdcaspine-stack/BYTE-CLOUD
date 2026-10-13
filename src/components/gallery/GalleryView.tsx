import React, { useState } from 'react';
import { Image, Video, Star, Play, Lock, Filter, RefreshCw, Calendar } from 'lucide-react';
import { FileItemModel } from '../../server/types';
import { apiUrl } from '../../lib/config';

interface GalleryViewProps {
  items: FileItemModel[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectMedia: (item: FileItemModel, index: number) => void;
  onToggleFavorite: (id: string) => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  items,
  isLoading,
  onRefresh,
  onSelectMedia,
  onToggleFavorite,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'photos' | 'videos' | 'favorites'>('all');

  // Filter items
  const filteredItems = items.filter((item) => {
    if (filterType === 'photos') return item.mimeType.startsWith('image/');
    if (filterType === 'videos') return item.mimeType.startsWith('video/');
    if (filterType === 'favorites') return item.isFavorite;
    return true;
  });

  // Group items by date string (e.g. "March 12, 2026")
  const groupedItems = filteredItems.reduce<Record<string, FileItemModel[]>>((acc, item) => {
    const date = new Date(item.createdAt);
    const dateKey = date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});

  const dateGroups = Object.keys(groupedItems);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Gallery Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-slab text-2xl lg:text-3xl font-bold tracking-tight text-white">
            Media Gallery
          </h2>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
            <span>External 500GB Storage</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-cyan-400">{filteredItems.length} items</span>
            <span aria-hidden="true">·</span>
            <span>Direct Tailscale Stream</span>
          </div>
        </div>

        {/* Filter Segmented Control & Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1 p-1 bg-[#16161a] border border-[#23232b] rounded-xl text-xs font-medium">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filterType === 'all'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('photos')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filterType === 'photos'
                  ? 'bg-zinc-800 text-cyan-300 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Photos
            </button>
            <button
              onClick={() => setFilterType('videos')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filterType === 'videos'
                  ? 'bg-zinc-800 text-cyan-300 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Videos
            </button>
            <button
              onClick={() => setFilterType('favorites')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filterType === 'favorites'
                  ? 'bg-zinc-800 text-amber-300 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Favorites
            </button>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-xl bg-[#16161a] border border-[#23232b] text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh gallery cache"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && !isLoading && (
        <div className="py-20 text-center rounded-2xl bg-[#121216] border border-zinc-800/80 p-8">
          <Image className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-200">No media found</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {filterType === 'favorites'
              ? 'Star photos or videos to add them to your favorites list.'
              : 'Upload photos or videos to your 500GB storage drive to see them here.'}
          </p>
        </div>
      )}

      {/* Timeline Date Groups */}
      {dateGroups.map((dateKey) => {
        const groupList = groupedItems[dateKey];
        return (
          <section key={dateKey} className="space-y-3">
            {/* Date Kicker */}
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 pt-2">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-zinc-300">{dateKey}</span>
              <span className="text-zinc-600">({groupList.length})</span>
            </div>

            {/* Thumbnail Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {groupList.map((item) => {
                const globalIndex = filteredItems.findIndex((x) => x.id === item.id);
                const isVideo = item.mimeType.startsWith('video/');

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectMedia(item, globalIndex)}
                    className="group relative aspect-4/3 rounded-xl overflow-hidden bg-[#16161a] border border-[#23232b] hover:border-cyan-500/50 transition-all cursor-pointer shadow-md"
                  >
                    {/* Media Thumbnail with lazy loading */}
                    <img
                      src={apiUrl(`/media/${item.id}/stream`)}
                      alt={item.name}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        // Resilient styled fallback container
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.fallback-box')) {
                          const fallback = document.createElement('div');
                          fallback.className =
                            'fallback-box w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-zinc-900 to-zinc-950 text-zinc-500';
                          fallback.innerHTML = `<span class="text-xs font-mono truncate max-w-full">${item.name}</span>`;
                          parent.appendChild(fallback);
                        }
                      }}
                    />

                    {/* Gradient Scrim */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Video Duration / Play Icon */}
                    {isVideo && (
                      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/75 text-[11px] font-mono text-white backdrop-blur-sm">
                        <Play className="w-2.5 h-2.5 fill-white" />
                        <span>
                          {item.mediaMetadata?.durationSeconds
                            ? `${Math.floor(item.mediaMetadata.durationSeconds / 60)}:${Math.floor(
                                item.mediaMetadata.durationSeconds % 60
                              )
                                .toString()
                                .padStart(2, '0')}`
                            : 'VIDEO'}
                        </span>
                      </div>
                    )}

                    {/* Encrypted Flag */}
                    {item.isEncrypted && (
                      <div className="absolute top-2.5 left-2.5 p-1 rounded-md bg-violet-950/80 text-violet-300 border border-violet-700/50 backdrop-blur-sm">
                        <Lock className="w-3 h-3" />
                      </div>
                    )}

                    {/* Top Right Action (Favorite) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(item.id);
                      }}
                      className={`absolute top-2.5 right-2.5 p-1.5 rounded-md backdrop-blur-sm transition-all ${
                        item.isFavorite
                          ? 'bg-amber-500/20 text-amber-400 opacity-100'
                          : 'bg-black/50 text-zinc-300 opacity-0 group-hover:opacity-100 hover:text-white'
                      }`}
                      title="Favorite"
                    >
                      <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-amber-400' : ''}`} />
                    </button>

                    {/* Bottom Metadata Title on hover */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 hidden group-hover:block transition-all">
                      <p className="text-xs font-medium text-white truncate drop-shadow">
                        {item.name}
                      </p>
                      <p className="text-[10px] font-mono text-zinc-300 drop-shadow">
                        {(item.sizeBytes / (1024 * 1024)).toFixed(1)} MB · {item.mediaMetadata?.cameraMake || 'EXT-STORAGE'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};
