import { FlowValidatorService } from '../../src/modules/bot-builder/flow-validator.service';
import { NodeType } from '../../src/modules/bot-builder/entities/bot-flow-node.entity';

describe('FlowValidatorService', () => {
  const em = {
    find: jest.fn(),
  };

  let service: FlowValidatorService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FlowValidatorService(em as any);
  });

  it('accepts a valid flow with start, condition and end', async () => {
    em.find.mockResolvedValueOnce([
      { id: 'start', type: NodeType.START },
      { id: 'condition', type: NodeType.CONDITION },
      { id: 'yes', type: NodeType.MESSAGE },
      { id: 'end', type: NodeType.END },
    ]);
    em.find.mockResolvedValueOnce([
      { sourceNodeId: 'start', targetNodeId: 'condition' },
      { sourceNodeId: 'condition', targetNodeId: 'yes' },
      { sourceNodeId: 'condition', targetNodeId: 'end' },
      { sourceNodeId: 'yes', targetNodeId: 'end' },
    ]);

    const result = await service.validateFlow('tenant_1', 'flow_1');

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('flags orphan nodes and missing required structure', async () => {
    em.find.mockResolvedValueOnce([
      { id: 'condition', type: NodeType.CONDITION },
      { id: 'orphan', type: NodeType.MESSAGE },
    ]);
    em.find.mockResolvedValueOnce([
      { sourceNodeId: 'condition', targetNodeId: 'missing' },
    ]);

    const result = await service.validateFlow('tenant_1', 'flow_1');

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'Flow must have at least one start node',
        'Flow must have at least one end node',
        expect.stringContaining('Condition node "condition" must have at least 2 outgoing edges'),
      ]),
    );
  });
});
