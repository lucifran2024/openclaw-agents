import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { BotFlowEntity, FlowStatus } from './entities/bot-flow.entity';
import {
  BotFlowNodeEntity,
  NodeType,
} from './entities/bot-flow-node.entity';
import { BotFlowEdgeEntity } from './entities/bot-flow-edge.entity';
import {
  BotFlowSessionEntity,
  SessionStatus,
} from './entities/bot-flow-session.entity';

@Injectable()
export class FlowEngineService {
  private readonly logger = new Logger(FlowEngineService.name);

  constructor(private readonly em: EntityManager) {}

  /**
   * Start a flow execution for a given conversation/contact.
   */
  async startFlow(
    tenantId: string,
    flowId: string,
    conversationId: string,
    contactId: string,
  ): Promise<BotFlowSessionEntity> {
    const flow = await this.em.findOne(BotFlowEntity, {
      id: flowId,
      tenantId,
      status: FlowStatus.PUBLISHED,
    });
    if (!flow) {
      throw new NotFoundException('Published flow not found');
    }

    // Find the start node
    const startNode = await this.em.findOne(BotFlowNodeEntity, {
      tenantId,
      flowId,
      type: NodeType.START,
    });
    if (!startNode) {
      throw new BadRequestException('Flow has no start node');
    }

    const session = this.em.create(BotFlowSessionEntity, {
      tenantId,
      flowId,
      conversationId,
      contactId,
      currentNodeId: startNode.id,
      status: SessionStatus.ACTIVE,
      variables: {},
      startedAt: new Date(),
      lastActivityAt: new Date(),
    } as any);

    await this.em.persistAndFlush(session);

    // Advance past the start node immediately
    await this.advanceToNextNode(session);

    return session;
  }

  /**
   * Resume a paused session (e.g. after a question node received user input).
   */
  async continueFlow(
    tenantId: string,
    sessionId: string,
    userInput: string,
  ): Promise<BotFlowSessionEntity> {
    const session = await this.em.findOne(BotFlowSessionEntity, {
      id: sessionId,
      tenantId,
      status: SessionStatus.ACTIVE,
    });
    if (!session) {
      throw new NotFoundException('Active session not found');
    }

    const currentNode = await this.em.findOne(BotFlowNodeEntity, {
      id: session.currentNodeId,
      tenantId,
    });
    if (!currentNode) {
      throw new BadRequestException('Current node not found');
    }

    // Store user input in variables
    if (currentNode.type === NodeType.QUESTION) {
      const variableName =
        (currentNode.data.variableName as string) || 'lastInput';
      session.variables = {
        ...session.variables,
        [variableName]: userInput,
      };
    }

    session.lastActivityAt = new Date();
    await this.em.flush();

    // Advance to the next node
    await this.advanceToNextNode(session);

    return session;
  }

  /**
   * Follow the edge from the current node and process the next node.
   */
  async advanceToNextNode(session: BotFlowSessionEntity): Promise<void> {
    const currentNode = await this.em.findOne(BotFlowNodeEntity, {
      id: session.currentNodeId,
      tenantId: session.tenantId,
    });
    if (!currentNode) return;

    // Find outgoing edges from the current node
    const edges = await this.em.find(BotFlowEdgeEntity, {
      tenantId: session.tenantId,
      flowId: session.flowId,
      sourceNodeId: currentNode.id,
    });

    if (edges.length === 0) {
      // Dead end — complete session
      session.status = SessionStatus.COMPLETED;
      session.completedAt = new Date();
      session.lastActivityAt = new Date();
      await this.em.flush();
      return;
    }

    let nextEdge: BotFlowEdgeEntity;

    if (currentNode.type === NodeType.CONDITION) {
      // Evaluate condition to pick the correct edge
      nextEdge = this.evaluateCondition(currentNode, edges, session.variables);
    } else {
      // Take the first (only) edge
      nextEdge = edges[0];
    }

    const nextNode = await this.em.findOne(BotFlowNodeEntity, {
      id: nextEdge.targetNodeId,
      tenantId: session.tenantId,
    });
    if (!nextNode) {
      this.logger.error(
        `Next node ${nextEdge.targetNodeId} not found for session ${session.id}`,
      );
      session.status = SessionStatus.FAILED;
      session.lastActivityAt = new Date();
      await this.em.flush();
      return;
    }

    session.currentNodeId = nextNode.id;
    session.lastActivityAt = new Date();
    await this.em.flush();

    await this.processNode(session, nextNode);
  }

  /**
   * Execute the logic for a given node type.
   */
  async processNode(
    session: BotFlowSessionEntity,
    node: BotFlowNodeEntity,
  ): Promise<void> {
    this.logger.debug(
      `Processing node ${node.id} (${node.type}) for session ${session.id}`,
    );

    switch (node.type) {
      case NodeType.START:
        // Start node is a pass-through
        await this.advanceToNextNode(session);
        break;

      case NodeType.MESSAGE:
        await this.handleMessageNode(session, node);
        // Auto-advance after sending message
        await this.advanceToNextNode(session);
        break;

      case NodeType.QUESTION:
        await this.handleQuestionNode(session, node);
        // PAUSE — wait for user reply via continueFlow()
        break;

      case NodeType.CONDITION:
        // Condition evaluation happens in advanceToNextNode
        await this.advanceToNextNode(session);
        break;

      case NodeType.ACTION:
        await this.handleActionNode(session, node);
        await this.advanceToNextNode(session);
        break;

      case NodeType.DELAY:
        await this.handleDelayNode(session, node);
        // Delay scheduling is fire-and-forget; session pauses
        break;

      case NodeType.API_CALL:
        await this.handleApiCallNode(session, node);
        await this.advanceToNextNode(session);
        break;

      case NodeType.AI_RESPONSE:
        await this.handleAiResponseNode(session, node);
        await this.advanceToNextNode(session);
        break;

      case NodeType.ASSIGN_AGENT:
        await this.handleAssignAgentNode(session, node);
        // Session completes — human takes over
        session.status = SessionStatus.COMPLETED;
        session.completedAt = new Date();
        session.lastActivityAt = new Date();
        await this.em.flush();
        break;

      case NodeType.END:
        session.status = SessionStatus.COMPLETED;
        session.completedAt = new Date();
        session.lastActivityAt = new Date();
        await this.em.flush();
        break;

      default:
        this.logger.warn(`Unknown node type: ${node.type}`);
        await this.advanceToNextNode(session);
    }
  }

  // ── Node Handlers ────────────────────────────────────────────

  private async handleMessageNode(
    session: BotFlowSessionEntity,
    node: BotFlowNodeEntity,
  ): Promise<void> {
    const messageText = this.interpolateVariables(
      (node.data.message as string) || '',
      session.variables,
    );
    // TODO: Integrate with messaging service to send message
    this.logger.log(
      `[Session ${session.id}] SEND MESSAGE to conversation ${session.conversationId}: "${messageText}"`,
    );
  }

  private async handleQuestionNode(
    session: BotFlowSessionEntity,
    node: BotFlowNodeEntity,
  ): Promise<void> {
    const questionText = this.interpolateVariables(
      (node.data.message as string) || '',
      session.variables,
    );
    // TODO: Integrate with messaging service to send question
    this.logger.log(
      `[Session ${session.id}] ASK QUESTION to conversation ${session.conversationId}: "${questionText}"`,
    );
  }

  private async handleActionNode(
    session: BotFlowSessionEntity,
    node: BotFlowNodeEntity,
  ): Promise<void> {
    const actionType = node.data.actionType as string;
    this.logger.log(
      `[Session ${session.id}] PERFORM ACTION: ${actionType}`,
    );
    // TODO: Implement action types (tag_contact, update_field, etc.)
  }

  private async handleDelayNode(
    session: BotFlowSessionEntity,
    node: BotFlowNodeEntity,
  ): Promise<void> {
    const delayMs = (node.data.delaySeconds as number || 0) * 1000;
    this.logger.log(
      `[Session ${session.id}] DELAY: ${delayMs}ms — scheduling continuation`,
    );
    // TODO: Integrate with queue/scheduler to resume after delay
    // For now, the session stays at this node until externally resumed
  }

  private async handleApiCallNode(
    session: BotFlowSessionEntity,
    node: BotFlowNodeEntity,
  ): Promise<void> {
    const url = node.data.url as string;
    const method = (node.data.method as string) || 'GET';
    const resultVariable =
      (node.data.resultVariable as string) || 'apiResult';

    this.logger.log(
      `[Session ${session.id}] API CALL: ${method} ${url}`,
    );

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((node.data.headers as Record<string, string>) || {}),
      };

      const fetchOptions: RequestInit = { method, headers };
      if (node.data.body && method !== 'GET') {
        fetchOptions.body = JSON.stringify(node.data.body);
      }

      const response = await fetch(url, fetchOptions);
      const responseData = await response.json().catch(() => response.text());

      session.variables = {
        ...session.variables,
        [resultVariable]: responseData,
        [`${resultVariable}_status`]: response.status,
      };
      await this.em.flush();
    } catch (error: any) {
      this.logger.error(
        `[Session ${session.id}] API call failed: ${error.message}`,
      );
      session.variables = {
        ...session.variables,
        [resultVariable]: null,
        [`${resultVariable}_error`]: error.message,
      };
      await this.em.flush();
    }
  }

  private async handleAiResponseNode(
    session: BotFlowSessionEntity,
    node: BotFlowNodeEntity,
  ): Promise<void> {
    this.logger.log(
      `[Session ${session.id}] AI RESPONSE requested`,
    );
    // TODO: Integrate with AI pipeline service
    // Should generate a response and send to conversation
  }

  private async handleAssignAgentNode(
    session: BotFlowSessionEntity,
    node: BotFlowNodeEntity,
  ): Promise<void> {
    const agentId = node.data.agentId as string | undefined;
    this.logger.log(
      `[Session ${session.id}] ASSIGN AGENT: ${agentId || 'auto'}`,
    );
    // TODO: Integrate with inbox/assignment service
  }

  // ── Helpers ──────────────────────────────────────────────────

  /**
   * Evaluate a condition node and pick the matching edge.
   */
  private evaluateCondition(
    node: BotFlowNodeEntity,
    edges: BotFlowEdgeEntity[],
    variables: Record<string, unknown>,
  ): BotFlowEdgeEntity {
    const rules = (node.data.rules as Array<{
      variable: string;
      operator: string;
      value: unknown;
      handle: string;
    }>) || [];

    for (const rule of rules) {
      const actualValue = variables[rule.variable];
      let match = false;

      switch (rule.operator) {
        case 'equals':
          match = actualValue === rule.value;
          break;
        case 'not_equals':
          match = actualValue !== rule.value;
          break;
        case 'contains':
          match =
            typeof actualValue === 'string' &&
            actualValue.includes(String(rule.value));
          break;
        case 'greater_than':
          match = Number(actualValue) > Number(rule.value);
          break;
        case 'less_than':
          match = Number(actualValue) < Number(rule.value);
          break;
        case 'exists':
          match = actualValue != null && actualValue !== '';
          break;
        case 'not_exists':
          match = actualValue == null || actualValue === '';
          break;
        default:
          match = false;
      }

      if (match) {
        const matchingEdge = edges.find(
          (e) => e.sourceHandle === rule.handle,
        );
        if (matchingEdge) return matchingEdge;
      }
    }

    // Fallback: use the 'else' / default edge or the first edge
    const defaultEdge =
      edges.find((e) => e.sourceHandle === 'else' || e.sourceHandle === 'default') ||
      edges[0];
    return defaultEdge;
  }

  /**
   * Replace {{variable}} placeholders with actual values.
   */
  private interpolateVariables(
    template: string,
    variables: Record<string, unknown>,
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const value = variables[key];
      return value != null ? String(value) : `{{${key}}}`;
    });
  }
}
