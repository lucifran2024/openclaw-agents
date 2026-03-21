'use client';

import { useState, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Upload,
  Loader2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  useFlow,
  useSaveCanvas,
  useValidateFlow,
  usePublishFlow,
  type FlowNode,
  type FlowEdge,
} from '@/hooks/use-bot-builder';
import { FlowCanvas } from '@/components/bot-builder/flow-canvas';
import { NodePalette } from '@/components/bot-builder/node-palette';
import { NodeEditor } from '@/components/bot-builder/node-editor';
import type { Node, Edge } from 'reactflow';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  published: { label: 'Publicado', variant: 'default' },
  archived: { label: 'Arquivado', variant: 'outline' },
};

export default function FlowEditorPage({
  params,
}: {
  params: Promise<{ flowId: string }>;
}) {
  const { flowId } = use(params);
  const router = useRouter();
  const { data: flow, isLoading } = useFlow(flowId);
  const saveCanvas = useSaveCanvas(flowId);
  const validateFlow = useValidateFlow(flowId);
  const publishFlow = usePublishFlow(flowId);

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidation, setShowValidation] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);

  const handleNodesChange = useCallback((nodes: Node[]) => {
    nodesRef.current = nodes;
  }, []);

  const handleEdgesChange = useCallback((edges: Edge[]) => {
    edgesRef.current = edges;
  }, []);

  const handleNodeSelect = useCallback((node: Node | null) => {
    setSelectedNode(node);
  }, []);

  const handleSave = useCallback(() => {
    setSaveStatus('saving');
    const nodes: FlowNode[] = nodesRef.current.map((n) => ({
      id: n.id,
      type: n.type || 'message',
      data: n.data,
      position: n.position,
    }));
    const edges: FlowEdge[] = edgesRef.current.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle || undefined,
      label: (e.label as string) || undefined,
    }));

    saveCanvas.mutate(
      { nodes, edges },
      {
        onSuccess: () => {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        },
        onError: () => {
          setSaveStatus('idle');
        },
      },
    );
  }, [saveCanvas]);

  const handleValidate = useCallback(() => {
    validateFlow.mutate(undefined, {
      onSuccess: (result) => {
        setValidationErrors(result.errors);
        setShowValidation(true);
      },
    });
  }, [validateFlow]);

  const handlePublish = useCallback(() => {
    publishFlow.mutate();
  }, [publishFlow]);

  const handleNodeUpdate = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      nodesRef.current = nodesRef.current.map((n) =>
        n.id === nodeId ? { ...n, data } : n,
      );
      setSelectedNode((prev) => (prev?.id === nodeId ? { ...prev, data } : prev));
    },
    [],
  );

  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      nodesRef.current = nodesRef.current.filter((n) => n.id !== nodeId);
      edgesRef.current = edgesRef.current.filter(
        (e) => e.source !== nodeId && e.target !== nodeId,
      );
      setSelectedNode(null);
    },
    [],
  );

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] flex-col">
        <div className="flex items-center gap-4 border-b border-[var(--color-border)] px-4 py-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-5 w-48" />
          <div className="ml-auto flex gap-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>
        <div className="flex flex-1">
          <Skeleton className="w-56 h-full" />
          <Skeleton className="flex-1 h-full" />
        </div>
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-[var(--color-muted-foreground)]" />
          <p className="text-sm font-medium text-[var(--color-muted-foreground)]">
            Fluxo não encontrado
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/bot-builder')}
          >
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const status = STATUS_LABELS[flow.status] || STATUS_LABELS.draft;

  const initialNodes: Node[] = (flow.nodes || []).map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: n.data,
  }));

  const initialEdges: Edge[] = (flow.edges || []).map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    label: e.label,
  }));

  // Initialize refs with flow data
  if (nodesRef.current.length === 0 && initialNodes.length > 0) {
    nodesRef.current = initialNodes;
  }
  if (edgesRef.current.length === 0 && initialEdges.length > 0) {
    edgesRef.current = initialEdges;
  }

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col -m-6">
      {/* Top Toolbar */}
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/bot-builder')}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-sm font-semibold text-[var(--color-foreground)] truncate">
            {flow.name}
          </h1>
          <Badge variant={status.variant} className="shrink-0">
            {status.label}
          </Badge>
          <span className="text-xs text-[var(--color-muted-foreground)] shrink-0">
            v{flow.version}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Salvo
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={saveCanvas.isPending}
            className="gap-1.5"
          >
            {saveCanvas.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Salvar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleValidate}
            disabled={validateFlow.isPending}
            className="gap-1.5"
          >
            {validateFlow.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            Validar
          </Button>

          <Button
            size="sm"
            onClick={handlePublish}
            disabled={publishFlow.isPending || flow.status === 'published'}
            className="gap-1.5"
          >
            {publishFlow.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            Publicar
          </Button>
        </div>
      </div>

      {/* Validation Errors Banner */}
      {showValidation && validationErrors.length > 0 && (
        <div className="flex items-start gap-2 bg-destructive/10 border-b border-destructive/20 px-4 py-2.5 shrink-0">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-destructive mb-1">
              {validationErrors.length}{' '}
              {validationErrors.length === 1 ? 'erro encontrado' : 'erros encontrados'}
            </p>
            <ul className="text-xs text-destructive/80 space-y-0.5">
              {validationErrors.map((err, i) => (
                <li key={i}>- {err}</li>
              ))}
            </ul>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => setShowValidation(false)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {showValidation && validationErrors.length === 0 && (
        <div className="flex items-center gap-2 bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 shrink-0">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <p className="text-xs font-medium text-emerald-700">
            Fluxo válido! Pronto para publicar.
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-auto"
            onClick={() => setShowValidation(false)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Node Palette */}
        <NodePalette />

        {/* Center: Canvas */}
        <FlowCanvas
          initialNodes={initialNodes}
          initialEdges={initialEdges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onNodeSelect={handleNodeSelect}
        />

        {/* Right: Node Editor */}
        {selectedNode && (
          <NodeEditor
            node={selectedNode}
            onUpdate={handleNodeUpdate}
            onDelete={handleNodeDelete}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  );
}
