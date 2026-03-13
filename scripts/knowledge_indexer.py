import os
import json
import re

# Pastas que o indexador deve ignorar para não poluir o LLM (como experimentos ou bundles legados)
EXCLUDED_DIRS = ['bundles-legados', 'experimentos', 'backups', 'patches', '.git', 'docs', 'scripts']

def clean_text(text):
    """Limpa quebras de linha excessivas para o preview do JSON"""
    return re.sub(r'\s+', ' ', text).strip()

def index_repository(root_path):
    system_map = {
        "metadata": {
            "purpose": "Este arquivo mapeia todos os documentos .txt da base para o LLM. Use isso como um RAG Index.",
            "instructions_for_llm": "Não tente ler os arquivos .txt diretamente se forem muito grandes. Leia este mapa primeiro para descobrir em qual documento está a regra que você precisa, e então puxe a informação daquele documento exato."
        },
        "core_rules_location": "knowledge-core/PROMPT_SYSTEM.txt",
        "documents": []
    }

    for dirpath, dirnames, filenames in os.walk(root_path):
        # Ignorar pastas excluidas
        dirnames[:] = [d for d in dirnames if d not in EXCLUDED_DIRS]
        
        for filename in filenames:
            if filename.endswith(".txt"):
                filepath = os.path.join(dirpath, filename)
                relative_path = os.path.relpath(filepath, root_path).replace('\\', '/')
                
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                        # Extrair o preview das primeiras 300 letras para o LLM saber do que se trata o arquivo
                        preview = clean_text(content[:300]) + "..." if len(content) > 300 else clean_text(content)
                        
                        # Tenta extrair titulos principais (linhas que comecam com CAPS LOCK ou #)
                        titles = re.findall(r'^#{1,3}\s+(.+)$|^([A-ZÇÃÕÁÉÍÓÚ\s_]+):$', content, re.MULTILINE)
                        extracted_topics = [t[0] or t[1] for t in titles if t[0] or t[1]][:10] # Pega no maximo 10 topicos
                        
                        doc_info = {
                            "file": relative_path,
                            "category": relative_path.split('/')[0],
                            "char_count": len(content),
                            "preview": preview,
                            "main_topics_found": extracted_topics
                        }
                        
                        system_map["documents"].append(doc_info)
                        
                except Exception as e:
                    print(f"Erro ao ler {relative_path}: {e}")

    # Salva o mapa na raiz do repositorio
    map_path = os.path.join(root_path, 'system_map.json')
    with open(map_path, 'w', encoding='utf-8') as f:
        json.dump(system_map, f, ensure_ascii=False, indent=4)
        
    print(f"Sucesso! Mapa RAG criado em {map_path} com {len(system_map['documents'])} documentos indexados.")

if __name__ == "__main__":
    # Roda no diretório atual (raiz do repo)
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    index_repository(repo_root)
