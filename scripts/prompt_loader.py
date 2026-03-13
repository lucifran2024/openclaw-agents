import os

def load_document_rules(repo_root, relative_filepath):
    """
    Função Helper para o LLM no ambiente de Code Interpreter.
    Permite que o LLM "puxe" regras pesadas via código sem estourar o limite de tokens da janela de contexto.
    Uso pelo LLM: content = load_document_rules('.', 'knowledge-core/MEU_ESTILO_PESSOAL.txt')
    """
    filepath = os.path.join(repo_root, relative_filepath)
    if not os.path.exists(filepath):
        return f"[ERRO] Arquivo não encontrado: {relative_filepath}"
        
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()

def search_in_knowledge(repo_root, keyword):
    """
    Permite que o LLM pesquise uma palavra chave dentro de toda a base de conhecimento instantaneamente.
    """
    results = []
    import json
    map_path = os.path.join(repo_root, 'system_map.json')
    
    if not os.path.exists(map_path):
        return "system_map.json não encontrado. Rode knowledge_indexer.py primeiro."
        
    with open(map_path, 'r', encoding='utf-8') as f:
        system_map = json.load(f)
        
    for doc in system_map['documents']:
        filepath = os.path.join(repo_root, doc['file'])
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                for i, line in enumerate(lines):
                    if keyword.lower() in line.lower():
                        results.append(f"[{doc['file']}: Linha {i+1}] -> {line.strip()}")
        except:
            pass
            
    return "\n".join(results) if results else f"Palavra '{keyword}' não encontrada na base."
