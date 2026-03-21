import { RagService } from '../../src/modules/ai-chatbot/rag.service';

describe('RagService', () => {
  const execute = jest.fn();
  const em = {
    fork: () => ({
      getConnection: () => ({
        execute,
      }),
    }),
  };

  const configService = {
    getOrThrow: jest.fn().mockReturnValue('openai-key'),
  };

  const embeddingService = {
    generateEmbedding: jest.fn(),
    vectorToString: jest.fn(),
  };

  let service: RagService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RagService(
      em as any,
      configService as any,
      embeddingService as any,
    );
  });

  it('retrieves relevant chunks and parses metadata', async () => {
    embeddingService.generateEmbedding.mockResolvedValue([0.1, 0.2]);
    embeddingService.vectorToString.mockReturnValue('[0.1,0.2]');
    execute.mockResolvedValue([
      {
        id: 'chunk_1',
        content: 'Trecho relevante',
        documentId: 'doc_1',
        knowledgeBaseId: 'kb_1',
        metadata: '{"section":"faq"}',
        distance: '0.12',
        chunkIndex: 0,
      },
    ]);

    const chunks = await service.retrieve('tenant_1', 'pergunta', 5, 'kb_1');

    expect(chunks).toEqual([
      expect.objectContaining({
        id: 'chunk_1',
        metadata: { section: 'faq' },
        distance: 0.12,
      }),
    ]);
  });

  it('returns fallback answer when no chunks are available', async () => {
    const answer = await service.generateAnswer('pergunta', []);

    expect(answer.confidence).toBe(0);
    expect(answer.sources).toEqual([]);
    expect(answer.answer).toContain('could not find relevant information');
  });

  it('builds an answer from OpenAI output and extracts confidence', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'Resposta final. {"confidence": 0.83}',
            },
          },
        ],
      }),
    });

    global.fetch = fetchMock as any;

    const answer = await service.generateAnswer('pergunta', [
      {
        id: 'chunk_1',
        content: 'Contexto',
        documentId: 'doc_1',
        knowledgeBaseId: 'kb_1',
        metadata: {},
        distance: 0.01,
        chunkIndex: 0,
      },
    ]);

    expect(fetchMock).toHaveBeenCalled();
    expect(answer).toEqual({
      answer: 'Resposta final.',
      sources: ['chunk_1'],
      confidence: 0.83,
    });
  });
});
