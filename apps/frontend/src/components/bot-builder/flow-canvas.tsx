'use client';

import { useCallback, useRef, type DragEvent } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type ReactFlowInstance,
  BackgroundVariant,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypes } from './custom-nodes';

interface FlowCanvasProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  onNodeSelect: (node: Node | null) => void;
}

let nodeIdCounter = 0;
function getNextNodeId() {
  nodeIdCounter += 1;
  return `node_${Date.now()}_${nodeIdCounter}`;
}

export function FlowCanvas({
  initialNodes,
  initialEdges,
  onNodesChange: onNodesUpdate,
  onEdgesChange: onEdgesUpdate,
  onNodeSelect,
}: FlowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        style: { strokeWidth: 2 },
        animated: false,
      };
      setEdges((eds) => {
        const updated = addEdge(newEdge, eds);
        onEdgesUpdate(updated);
        return updated;
      });
    },
    [setEdges, onEdgesUpdate],
  );

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const nodeType = event.dataTransfer.getData('application/reactflow');
      if (!nodeType || !reactFlowInstance.current || !reactFlowWrapper.current) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.current.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const newNode: Node = {
        id: getNextNodeId(),
        type: nodeType,
        position,
        data: getDefaultData(nodeType),
      };

      setNodes((nds) => {
        const updated = nds.concat(newNode);
        onNodesUpdate(updated);
        return updated;
      });
    },
    [setNodes, onNodesUpdate],
  );

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
  }, []);

  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes);
      // Defer the update to after state settles
      setTimeout(() => {
        const currentNodes = reactFlowInstance.current?.getNodes();
        if (currentNodes) {
          onNodesUpdate(currentNodes);
        }
      }, 0);
    },
    [onNodesChange, onNodesUpdate],
  );

  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      onEdgesChange(changes);
      setTimeout(() => {
        const currentEdges = reactFlowInstance.current?.getEdges();
        if (currentEdges) {
          onEdgesUpdate(currentEdges);
        }
      }, 0);
    },
    [onEdgesChange, onEdgesUpdate],
  );

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeSelect(node);
    },
    [onNodeSelect],
  );

  const handlePaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      const deletedIds = new Set(deleted.map((n) => n.id));
      setEdges((eds) => {
        const filtered = eds.filter(
          (e) => !deletedIds.has(e.source) && !deletedIds.has(e.target),
        );
        onEdgesUpdate(filtered);
        return filtered;
      });
    },
    [setEdges, onEdgesUpdate],
  );

  return (
    <div ref={reactFlowWrapper} className="flex-1 h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onNodesDelete={onNodesDelete}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode="Delete"
        defaultEdgeOptions={{
          markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
          style: { strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
        className="bg-[var(--color-surface)]"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#d1d5db"
        />
        <Controls
          showInteractive={false}
          className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg shadow-sm"
        />
        <MiniMap
          nodeStrokeWidth={3}
          pannable
          zoomable
          className="rounded-lg border border-[var(--color-border)] shadow-sm"
          maskColor="rgba(0,0,0,0.08)"
        />
      </ReactFlow>
    </div>
  );
}

function getDefaultData(type: string): Record<string, unknown> {
  switch (type) {
    case 'start':
      return { label: 'Início' };
    case 'message':
      return { text: '' };
    case 'question':
      return { text: '', options: [] };
    case 'condition':
      return { variable: '', operator: 'equals', value: '' };
    case 'action':
      return { actionType: 'set_variable', key: '', actionValue: '' };
    case 'delay':
      return { duration: 5, unit: 'min' };
    case 'api_call':
      return { url: '', method: 'GET', headers: '', body: '' };
    case 'ai_response':
      return { prompt: '', model: 'gpt-4' };
    case 'assign_agent':
      return { agentName: '', transferMessage: '' };
    case 'end':
      return { text: '' };
    default:
      return {};
  }
}
