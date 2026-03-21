'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
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
} from 'lucide-react';

const NODE_STYLES: Record<
  string,
  { icon: React.ElementType; color: string; bg: string; border: string; label: string }
> = {
  start: {
    icon: Play,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    label: 'Início',
  },
  message: {
    icon: MessageSquare,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    label: 'Mensagem',
  },
  question: {
    icon: HelpCircle,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    label: 'Pergunta',
  },
  condition: {
    icon: GitBranch,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    label: 'Condição',
  },
  action: {
    icon: Zap,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    label: 'Ação',
  },
  delay: {
    icon: Clock,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    border: 'border-cyan-300',
    label: 'Atraso',
  },
  api_call: {
    icon: Globe,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-300',
    label: 'API Call',
  },
  ai_response: {
    icon: Bot,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-300',
    label: 'Resposta IA',
  },
  assign_agent: {
    icon: UserCheck,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-300',
    label: 'Transferir Agente',
  },
  end: {
    icon: Square,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-300',
    label: 'Fim',
  },
};

function getPreview(type: string, data: Record<string, unknown>): string {
  switch (type) {
    case 'message':
      return (data.text as string)?.slice(0, 60) || 'Sem texto';
    case 'question':
      return (data.text as string)?.slice(0, 40) || 'Sem pergunta';
    case 'condition':
      return data.variable
        ? `${data.variable} ${data.operator} ${data.value}`
        : 'Configurar condição';
    case 'delay': {
      const dur = data.duration as number;
      const unit = (data.unit as string) || 'min';
      return dur ? `${dur} ${unit}` : 'Configurar atraso';
    }
    case 'api_call':
      return data.url
        ? `${(data.method as string) || 'GET'} ${(data.url as string).slice(0, 30)}`
        : 'Configurar API';
    case 'ai_response':
      return (data.prompt as string)?.slice(0, 50) || 'Configurar IA';
    case 'assign_agent':
      return (data.agentName as string) || 'Selecionar agente';
    default:
      return '';
  }
}

const handleStyle = {
  width: 10,
  height: 10,
  border: '2px solid white',
};

function CustomNodeComponent({ data, type, selected }: NodeProps) {
  const nodeType = (type as string) || 'message';
  const style = NODE_STYLES[nodeType] || NODE_STYLES.message;
  const Icon = style.icon;
  const preview = getPreview(nodeType, data as Record<string, unknown>);
  const nodeLabel = (data.label as string) || style.label;

  return (
    <div
      className={`min-w-[200px] max-w-[260px] rounded-xl border-2 ${style.border} ${style.bg} shadow-sm transition-shadow ${
        selected ? 'shadow-lg ring-2 ring-primary/40' : 'hover:shadow-md'
      }`}
    >
      {nodeType !== 'start' && (
        <Handle
          type="target"
          position={Position.Top}
          style={{ ...handleStyle, background: '#6b7280' }}
        />
      )}

      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2 mb-1">
          <div className={`rounded-lg p-1.5 ${style.bg} ${style.color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {nodeLabel}
          </span>
        </div>
        {preview && (
          <p className="text-xs text-gray-600 leading-relaxed truncate">
            {preview}
          </p>
        )}
      </div>

      {nodeType !== 'end' && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ ...handleStyle, background: '#3b82f6' }}
        />
      )}

      {nodeType === 'condition' && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{ ...handleStyle, background: '#22c55e', top: '50%' }}
          />
          <Handle
            type="source"
            position={Position.Left}
            id="false"
            style={{ ...handleStyle, background: '#ef4444', top: '50%' }}
          />
        </>
      )}

      {nodeType === 'question' &&
        Array.isArray(data.options) &&
        (data.options as string[]).length > 0 && (
          <div className="border-t border-purple-200 px-3 py-1.5">
            {(data.options as string[]).slice(0, 3).map((opt, i) => (
              <Handle
                key={i}
                type="source"
                position={Position.Bottom}
                id={`option-${i}`}
                style={{
                  ...handleStyle,
                  background: '#8b5cf6',
                  left: `${((i + 1) / ((data.options as string[]).length + 1)) * 100}%`,
                }}
              />
            ))}
            <div className="flex flex-wrap gap-1">
              {(data.options as string[]).slice(0, 3).map((opt, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded"
                >
                  {opt}
                </span>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}

export const StartNode = memo(CustomNodeComponent);
export const MessageNode = memo(CustomNodeComponent);
export const QuestionNode = memo(CustomNodeComponent);
export const ConditionNode = memo(CustomNodeComponent);
export const ActionNode = memo(CustomNodeComponent);
export const DelayNode = memo(CustomNodeComponent);
export const ApiCallNode = memo(CustomNodeComponent);
export const AiResponseNode = memo(CustomNodeComponent);
export const AssignAgentNode = memo(CustomNodeComponent);
export const EndNode = memo(CustomNodeComponent);

export const nodeTypes = {
  start: StartNode,
  message: MessageNode,
  question: QuestionNode,
  condition: ConditionNode,
  action: ActionNode,
  delay: DelayNode,
  api_call: ApiCallNode,
  ai_response: AiResponseNode,
  assign_agent: AssignAgentNode,
  end: EndNode,
};

export { NODE_STYLES };
