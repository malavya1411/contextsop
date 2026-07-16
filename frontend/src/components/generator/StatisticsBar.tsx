import React from "react";
import { Hash, AlignLeft, Type, Cpu } from "lucide-react";

interface Statistics {
  characters: number;
  words: number;
  lines: number;
  estimatedTokens: number;
}

interface StatisticsBarProps {
  stats: Statistics;
}

export default function StatisticsBar({ stats }: StatisticsBarProps) {
  const statItems = [
    {
      label: "Lines",
      value: stats.lines.toLocaleString(),
      icon: AlignLeft,
      color: "text-violet-500 dark:text-violet-400",
      glow: "bg-violet-500/5 group-hover:bg-violet-500/10",
    },
    {
      label: "Words",
      value: stats.words.toLocaleString(),
      icon: Hash,
      color: "text-amber-500 dark:text-amber-400",
      glow: "bg-amber-500/5 group-hover:bg-amber-500/10",
    },
    {
      label: "Characters",
      value: stats.characters.toLocaleString(),
      icon: Type,
      color: "text-emerald-500 dark:text-emerald-400",
      glow: "bg-emerald-500/5 group-hover:bg-emerald-500/10",
    },
    {
      label: "Est. Tokens",
      value: stats.estimatedTokens.toLocaleString(),
      icon: Cpu,
      color: "text-blue-500 dark:text-blue-400",
      glow: "bg-blue-500/5 group-hover:bg-blue-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full select-none">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="flex flex-col gap-4 p-5 rounded-2xl border border-box-border bg-box-bg hover:border-accent-primary/30 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
          >
            {/* Background Glow Mesh */}
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl transition-colors duration-300 ${item.glow}`} />

            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-box-line-numbers-bg border border-box-border/80 group-hover:scale-105 transition-all duration-300 ${item.color}`}>
              <Icon className="w-5 h-5" />
            </div>

            <div className="space-y-1 z-10">
              <div className="text-[10px] font-bold text-text-muted font-mono uppercase tracking-wider">{item.label}</div>
              <div className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                {item.value}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
