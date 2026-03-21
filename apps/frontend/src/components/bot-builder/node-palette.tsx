'use client';

import {
  Play,
  MessageSquare,
  HelpCircle,
  GitBranch,
  Zap,
  Clock,
  Globe,
  Bot,
  UserCheck,
  Square,
  GripVertical,
} from 'lucide-react';
import type { DragEvent } from 'react';

const NODE_ITEMS = [
  { type: 'start', label: 'Início', icon: Play, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { type: 'message', label: 'Mensagem', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { type: 'question', label: 'Pergunta', icon: HelpCircle, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  { type: 'condition', label: 'Condição', icon: GitBranch, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { type: 'action', label: 'Ação', icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  { type: 'delay', label: 'Atraso', icon: Clock, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200' },
  { type: 'api_call', label: 'API Call', icon: Globe, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  { type: 'ai_response', label: 'Resposta IA', icon: Bot, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
  { type: 'assign_agent', label: 'Transferir Agente', icon: UserCheck, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
  { type: 'end', label: 'Fim', icon: Square, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
] as const;

export function NodePalette() {
  function onDragStart(event: DragEvent<HTMLDivElement>, nodeType: string) {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  }

  return (
    <div className="w-56 border-r border-[var(--color-border)] bg-[var(--color-background)] flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
          Componentes
        </h3>
        <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
          Arraste para o canvas
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {NODE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => onDragStart(e, item.type)}
              className={`flex items-center gap-2.5 rounded-lg border ${item.border} ${item.bg} px-3 py-2.5 cursor-grab active:cursor-grabbing hover:shadow-sm transition-all group`}
            >
              <GripVertical className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-400 shrink-0" />
              <div className={`${item.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-gray-700">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
