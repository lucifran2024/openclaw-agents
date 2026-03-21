import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { BotFlowNodeEntity, NodeType } from './entities/bot-flow-node.entity';
import { BotFlowEdgeEntity } from './entities/bot-flow-edge.entity';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

@Injectable()
export class FlowValidatorService {
  constructor(private readonly em: EntityManager) {}

  async validateFlow(
    tenantId: string,
    flowId: string,
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    const nodes = await this.em.find(BotFlowNodeEntity, {
      tenantId,
      flowId,
    });

    const edges = await this.em.find(BotFlowEdgeEntity, {
      tenantId,
      flowId,
    });

    // Check: has at least one start node
    const startNodes = nodes.filter((n) => n.type === NodeType.START);
    if (startNodes.length === 0) {
      errors.push('Flow must have at least one start node');
    } else if (startNodes.length > 1) {
      errors.push('Flow must have exactly one start node');
    }

    // Check: has at least one end node
    const endNodes = nodes.filter((n) => n.type === NodeType.END);
    if (endNodes.length === 0) {
      errors.push('Flow must have at least one end node');
    }

    // Build adjacency sets
    const nodeIds = new Set(nodes.map((n) => n.id));
    const nodesWithIncoming = new Set<string>();
    const nodesWithOutgoing = new Set<string>();

    for (const edge of edges) {
      // Validate edge references existing nodes
      if (!nodeIds.has(edge.sourceNodeId)) {
        errors.push(
          `Edge references non-existent source node: ${edge.sourceNodeId}`,
        );
      }
      if (!nodeIds.has(edge.targetNodeId)) {
        errors.push(
          `Edge references non-existent target node: ${edge.targetNodeId}`,
        );
      }

      nodesWithIncoming.add(edge.targetNodeId);
      nodesWithOutgoing.add(edge.sourceNodeId);
    }

    // Check: orphan nodes (no incoming AND no outgoing edges, excluding start nodes)
    for (const node of nodes) {
      if (node.type === NodeType.START) continue;
      if (!nodesWithIncoming.has(node.id) && !nodesWithOutgoing.has(node.id)) {
        errors.push(
          `Node "${node.id}" (${node.type}) is orphaned — not connected to any edge`,
        );
      }
    }

    // Check: non-end nodes should have outgoing edges
    for (const node of nodes) {
      if (node.type === NodeType.END) continue;
      if (!nodesWithOutgoing.has(node.id)) {
        errors.push(
          `Node "${node.id}" (${node.type}) has no outgoing edges`,
        );
      }
    }

    // Check: non-start nodes should have incoming edges
    for (const node of nodes) {
      if (node.type === NodeType.START) continue;
      if (!nodesWithIncoming.has(node.id)) {
        errors.push(
          `Node "${node.id}" (${node.type}) has no incoming edges`,
        );
      }
    }

    // Check: condition nodes should have at least 2 outgoing edges (true/false or multiple handles)
    const conditionNodes = nodes.filter((n) => n.type === NodeType.CONDITION);
    for (const cNode of conditionNodes) {
      const outEdges = edges.filter((e) => e.sourceNodeId === cNode.id);
      if (outEdges.length < 2) {
        errors.push(
          `Condition node "${cNode.id}" must have at least 2 outgoing edges (has ${outEdges.length})`,
        );
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
