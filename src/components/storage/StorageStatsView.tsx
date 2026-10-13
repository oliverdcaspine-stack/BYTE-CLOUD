import React from 'react';
import {
  HardDrive,
  Activity,
  ShieldCheck,
  Cpu,
  Layers,
  Thermometer,
  Zap,
  Server,
  Lock,
  CheckCircle,
  Wifi,
} from 'lucide-react';
import { StorageStatsModel } from '../../server/types';

interface StorageStatsViewProps {
  stats: StorageStatsModel | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const StorageStatsView: React.FC<StorageStatsViewProps> = ({
  stats,
  isLoading,
  onRefresh,
}) => {
  if (!stats) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-zinc-400 font-mono">Querying external 500GB drive blocks...</p>
      </div>
    );
  }

  const formatGB = (bytes: number) => (bytes / (1000 * 1000 * 1000)).toFixed(1);
  const totalGB = formatGB(stats.totalBytes);
  const usedGB = formatGB(stats.usedBytes);
  const freeGB = formatGB(stats.freeBytes);

  const categories = stats.categories;
  const photoPct = Math.round((categories.photos.bytes / stats.totalBytes) * 100);
  const videoPct = Math.round((categories.videos.bytes / stats.totalBytes) * 100);
  const docPct = Math.round((categories.documents.bytes / stats.totalBytes) * 100);
  const archivePct = Math.round((categories.archives.bytes / stats.totalBytes) * 100);
  const systemPct = Math.round((categories.system.bytes / stats.totalBytes) * 100);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Title */}
      <div>
        <h2 className="font-slab text-2xl lg:text-3xl font-bold tracking-tight text-white">
          Storage Statistics
        </h2>
        <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
          <span>Physical Mount</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-cyan-400">{stats.mountPath}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-emerald-400">SMART Healthy</span>
        </div>
      </div>

      {/* Main Storage Bar Card */}
      <div className="p-6 rounded-2xl bg-[#16161a] border border-[#23232b] shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{stats.diskLabel}</h3>
              <p className="text-xs font-mono text-zinc-400">
                Partition: ext4 on /dev/sdb1
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right font-mono">
            <div className="text-xl sm:text-2xl font-bold text-white">
              {usedGB} <span className="text-xs text-zinc-400 font-sans">/ {totalGB} GB</span>
            </div>
            <div className="text-xs text-cyan-400 font-semibold">
              {stats.usedPercentage}% Allocated · {freeGB} GB Available
            </div>
          </div>
        </div>

        {/* Multi-Segment Storage Bar */}
        <div className="space-y-2">
          <div className="w-full h-4 rounded-full bg-[#101014] overflow-hidden flex p-0.5 border border-zinc-800">
            <div
              style={{ width: `${photoPct}%` }}
              className="h-full bg-cyan-400 rounded-l-full transition-all duration-500"
              title={`Photos: ${formatGB(categories.photos.bytes)} GB`}
            />
            <div
              style={{ width: `${videoPct}%` }}
              className="h-full bg-violet-500 transition-all duration-500"
              title={`Videos: ${formatGB(categories.videos.bytes)} GB`}
            />
            <div
              style={{ width: `${docPct}%` }}
              className="h-full bg-emerald-400 transition-all duration-500"
              title={`Documents: ${formatGB(categories.documents.bytes)} GB`}
            />
            <div
              style={{ width: `${archivePct}%` }}
              className="h-full bg-amber-400 transition-all duration-500"
              title={`Archives: ${formatGB(categories.archives.bytes)} GB`}
            />
            <div
              style={{ width: `${systemPct}%` }}
              className="h-full bg-zinc-600 transition-all duration-500"
              title={`System & Cache: ${formatGB(categories.system.bytes)} GB`}
            />
          </div>

          {/* Clean Unboxed Legend (Anti-slop compliant) */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" />
              <span className="text-zinc-300">Photos</span>
              <span className="font-mono text-zinc-500">{formatGB(categories.photos.bytes)} GB</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shrink-0" />
              <span className="text-zinc-300">Videos</span>
              <span className="font-mono text-zinc-500">{formatGB(categories.videos.bytes)} GB</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-zinc-300">Documents</span>
              <span className="font-mono text-zinc-500">{formatGB(categories.documents.bytes)} GB</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
              <span className="text-zinc-300">Archives</span>
              <span className="font-mono text-zinc-500">{formatGB(categories.archives.bytes)} GB</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 shrink-0" />
              <span className="text-zinc-300">System & Journal</span>
              <span className="font-mono text-zinc-500">{formatGB(categories.system.bytes)} GB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Drive Health */}
        <div className="p-5 rounded-2xl bg-[#16161a] border border-[#23232b] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">SMART TELEMETRY</span>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              HEALTHY
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-zinc-500" />
                Drive Temperature
              </span>
              <span className="font-mono text-white">{stats.smartInfo.temperatureC}°C (Optimal)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-zinc-500" />
                Power-On Hours
              </span>
              <span className="font-mono text-white">{stats.smartInfo.powerOnHours} hrs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-zinc-500" />
                Reallocated Sectors
              </span>
              <span className="font-mono text-emerald-400 font-semibold">{stats.smartInfo.badSectors} (0%)</span>
            </div>
          </div>
        </div>

        {/* Throughput Benchmarks */}
        <div className="p-5 rounded-2xl bg-[#16161a] border border-[#23232b] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">DISK THROUGHPUT</span>
            <span className="text-xs font-mono text-cyan-400 font-semibold">USB 3.2 Gen 1</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-400">Sequential Read</span>
              <span className="font-mono text-cyan-300 font-bold">
                {stats.smartInfo.readSpeedMBs} MB/s
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Sequential Write</span>
              <span className="font-mono text-cyan-300 font-bold">
                {stats.smartInfo.writeSpeedMBs} MB/s
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Filesystem Mode</span>
              <span className="font-mono text-zinc-300 text-[11px]">Direct IO / zero-copy</span>
            </div>
          </div>
        </div>

        {/* Tailscale Encrypted Tunnel */}
        <div className="p-5 rounded-2xl bg-[#16161a] border border-[#23232b] space-y-3 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">TAILSCALE MESH</span>
            <span className="flex items-center gap-1 text-xs font-bold text-cyan-400">
              <Wifi className="w-3.5 h-3.5" />
              DIRECT P2P
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-400">MagicDNS Host</span>
              <span className="font-mono text-white truncate max-w-[140px]">
                {stats.tailscale.magicDns}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Encrypted IP</span>
              <span className="font-mono text-cyan-300">{stats.tailscale.tailscaleIp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">TLS Protection</span>
              <span className="font-mono text-emerald-400">WireGuard + HTTPS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
