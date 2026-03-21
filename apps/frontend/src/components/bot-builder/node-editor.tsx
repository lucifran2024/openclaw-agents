'use client';

import { useState, useEffect } from 'react';
import { X, Trash2, Save, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NODE_STYLES } from './custom-nodes';
import type { Node } from 'reactflow';

interface NodeEditorProps {
  node: Node | null;
  onUpdate: (nodeId: string, data: Record<string, unknown>) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
}

export function NodeEditor({ node, onUpdate, onDelete, onClose }: NodeEditorProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (node) {
      setFormData({ ...node.data });
    }
  }, [node]);

  if (!node) return null;

  const nodeType = node.type || 'message';
  const style = NODE_STYLES[nodeType];

  function handleSave() {
    if (node) {
      onUpdate(node.id, formData);
    }
  }

  function handleDelete() {
    if (node) {
      onDelete(node.id);
    }
  }

  function updateField(key: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function renderFields() {
    switch (nodeType) {
      case 'start':
        return (
          <div className="space-y-3">
            <FieldLabel label="Nome do gatilho">
              <Input
                value={(formData.label as string) || ''}
                onChange={(e) => updateField('label', e.target.value)}
                placeholder="Ex: Mensagem recebida"
              />
            </FieldLabel>
          </div>
        );

      case 'message':
        return (
          <div className="space-y-3">
            <FieldLabel label="Texto da mensagem">
              <textarea
                value={(formData.text as string) || ''}
                onChange={(e) => updateField('text', e.target.value)}
                placeholder="Digite a mensagem que será enviada..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[120px] resize-y"
              />
            </FieldLabel>
          </div>
        );

      case 'question':
        return (
          <div className="space-y-3">
            <FieldLabel label="Texto da pergunta">
              <textarea
                value={(formData.text as string) || ''}
                onChange={(e) => updateField('text', e.target.value)}
                placeholder="Digite a pergunta..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px] resize-y"
              />
            </FieldLabel>
            <FieldLabel label="Opções de resposta">
              <div className="space-y-2">
                {((formData.options as string[]) || []).map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...((formData.options as string[]) || [])];
                        newOptions[i] = e.target.value;
                        updateField('options', newOptions);
                      }}
                      placeholder={`Opção ${i + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newOptions = ((formData.options as string[]) || []).filter(
                          (_, idx) => idx !== i,
                        );
                        updateField('options', newOptions);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1"
                  onClick={() => {
                    const current = (formData.options as string[]) || [];
                    updateField('options', [...current, '']);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar opção
                </Button>
              </div>
            </FieldLabel>
          </div>
        );

      case 'condition':
        return (
          <div className="space-y-3">
            <FieldLabel label="Variável">
              <Input
                value={(formData.variable as string) || ''}
                onChange={(e) => updateField('variable', e.target.value)}
                placeholder="Ex: {{mensagem}}"
              />
            </FieldLabel>
            <FieldLabel label="Operador">
              <select
                value={(formData.operator as string) || 'equals'}
                onChange={(e) => updateField('operator', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="equals">Igual a</option>
                <option value="not_equals">Diferente de</option>
                <option value="contains">Contém</option>
                <option value="not_contains">Não contém</option>
                <option value="greater_than">Maior que</option>
                <option value="less_than">Menor que</option>
                <option value="starts_with">Começa com</option>
                <option value="ends_with">Termina com</option>
              </select>
            </FieldLabel>
            <FieldLabel label="Valor">
              <Input
                value={(formData.value as string) || ''}
                onChange={(e) => updateField('value', e.target.value)}
                placeholder="Valor para comparação"
              />
            </FieldLabel>
          </div>
        );

      case 'delay':
        return (
          <div className="space-y-3">
            <FieldLabel label="Duração">
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  value={(formData.duration as number) || ''}
                  onChange={(e) => updateField('duration', Number(e.target.value))}
                  placeholder="5"
                  className="flex-1"
                />
                <select
                  value={(formData.unit as string) || 'min'}
                  onChange={(e) => updateField('unit', e.target.value)}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-28"
                >
                  <option value="sec">Segundos</option>
                  <option value="min">Minutos</option>
                  <option value="hour">Horas</option>
                  <option value="day">Dias</option>
                </select>
              </div>
            </FieldLabel>
          </div>
        );

      case 'api_call':
        return (
          <div className="space-y-3">
            <FieldLabel label="URL">
              <Input
                value={(formData.url as string) || ''}
                onChange={(e) => updateField('url', e.target.value)}
                placeholder="https://api.exemplo.com/endpoint"
              />
            </FieldLabel>
            <FieldLabel label="Método">
              <select
                value={(formData.method as string) || 'GET'}
                onChange={(e) => updateField('method', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </FieldLabel>
            <FieldLabel label="Headers (JSON)">
              <textarea
                value={(formData.headers as string) || ''}
                onChange={(e) => updateField('headers', e.target.value)}
                placeholder='{"Authorization": "Bearer ..."}'
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[60px] resize-y font-mono text-xs"
              />
            </FieldLabel>
            <FieldLabel label="Body (JSON)">
              <textarea
                value={(formData.body as string) || ''}
                onChange={(e) => updateField('body', e.target.value)}
                placeholder='{"key": "value"}'
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[60px] resize-y font-mono text-xs"
              />
            </FieldLabel>
          </div>
        );

      case 'ai_response':
        return (
          <div className="space-y-3">
            <FieldLabel label="Prompt">
              <textarea
                value={(formData.prompt as string) || ''}
                onChange={(e) => updateField('prompt', e.target.value)}
                placeholder="Descreva o comportamento da IA..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[120px] resize-y"
              />
            </FieldLabel>
            <FieldLabel label="Modelo">
              <select
                value={(formData.model as string) || 'gpt-4'}
                onChange={(e) => updateField('model', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-3">Claude 3</option>
              </select>
            </FieldLabel>
          </div>
        );

      case 'assign_agent':
        return (
          <div className="space-y-3">
            <FieldLabel label="Nome do agente ou equipe">
              <Input
                value={(formData.agentName as string) || ''}
                onChange={(e) => updateField('agentName', e.target.value)}
                placeholder="Ex: Suporte Nível 2"
              />
            </FieldLabel>
            <FieldLabel label="Mensagem ao transferir">
              <textarea
                value={(formData.transferMessage as string) || ''}
                onChange={(e) => updateField('transferMessage', e.target.value)}
                placeholder="Mensagem exibida ao usuário ao transferir..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px] resize-y"
              />
            </FieldLabel>
          </div>
        );

      case 'action':
        return (
          <div className="space-y-3">
            <FieldLabel label="Tipo de ação">
              <select
                value={(formData.actionType as string) || 'set_variable'}
                onChange={(e) => updateField('actionType', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="set_variable">Definir variável</option>
                <option value="add_tag">Adicionar tag</option>
                <option value="remove_tag">Remover tag</option>
                <option value="send_email">Enviar e-mail</option>
              </select>
            </FieldLabel>
            <FieldLabel label="Chave">
              <Input
                value={(formData.key as string) || ''}
                onChange={(e) => updateField('key', e.target.value)}
                placeholder="Nome da variável ou tag"
              />
            </FieldLabel>
            <FieldLabel label="Valor">
              <Input
                value={(formData.actionValue as string) || ''}
                onChange={(e) => updateField('actionValue', e.target.value)}
                placeholder="Valor"
              />
            </FieldLabel>
          </div>
        );

      case 'end':
        return (
          <div className="space-y-3">
            <FieldLabel label="Mensagem de encerramento (opcional)">
              <textarea
                value={(formData.text as string) || ''}
                onChange={(e) => updateField('text', e.target.value)}
                placeholder="Mensagem final ao encerrar o fluxo..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px] resize-y"
              />
            </FieldLabel>
          </div>
        );

      default:
        return (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Nenhuma configuração disponível para este tipo de nó.
          </p>
        );
    }
  }

  return (
    <div className="w-80 border-l border-[var(--color-border)] bg-[var(--color-background)] flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          {style && (
            <div className={`rounded-lg p-1.5 ${style.bg} ${style.color}`}>
              <style.icon className="h-4 w-4" />
            </div>
          )}
          <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
            {style?.label || 'Editar Nó'}
          </h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto p-4">{renderFields()}</div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--color-border)]">
        <Button onClick={handleSave} size="sm" className="flex-1 gap-1.5">
          <Save className="h-3.5 w-3.5" />
          Salvar
        </Button>
        {nodeType !== 'start' && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}
