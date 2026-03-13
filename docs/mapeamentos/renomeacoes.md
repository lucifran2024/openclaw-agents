# Mapeamento de Renomeações

Nesta listagem encontram-se todos os registros de mudanças de nomes do formato original (na pasta `PVC VOZ 5`) para os novos nomes da estrutura limpa do repositório `openclaw-agents`.
A premissa da renomeação foi retirar espaços excessivos, vírgulas, pontos que não pertenciam à extensão do arquivo e adotar `_` (underscore).

## Arquivos Core
| Nome Antigo | Nome Novo | Motivo |
| :--- | :--- | :--- |
| `PROMPT SYSTEM.txt` | `PROMPT_SYSTEM.txt` | Remoção de espaço |
| `SECAO6.TXT` | `SECAO6.txt` | Extensão de arquivo em minúscula (.txt) |

## Arquivos Opcionais
| Nome Antigo | Nome Novo | Motivo |
| :--- | :--- | :--- |
| `Conhecimento_Compilado_Essencial.v1.4.txt` | `CONHECIMENTO_COMPILADO_ESSENCIAL_v1_4.txt` | Adequação ao padrão MAIÚSCULAS_COM_UNDERSCORES e substituição do '.v' para '_v' a fim de evitar falsas extensões de arquivos |

## Modos Individuais
| Nome Antigo | Nome Novo | Motivo |
| :--- | :--- | :--- |
| `MODO 1.txt` | `MODO_1.txt` | Remoção de espaço |
| `MODO 1.9.5.txt` | `MODO_1_9_5.txt` | Substituição de espaços e dos pontos da versão para evitar falsas extensões de arquivo |

## Bundles / Legados
| Nome Antigo | Nome Novo | Motivo |
| :--- | :--- | :--- |
| `M1.2- M1.4 -ATE M1.9.txt` | `M1_2_M1_4_ATE_M1_9.txt` | Retirada de traços, espaços e pontos na estrutura de versão quebrando padrão regex URL do prompt system |
| `M2 - M4.1 - 4.2  - 4.3.txt` | `M2_M4_1_M4_2_M4_3.txt` | O arquivo possuía múltiplos traços duplos e espaços irregulares |
| `MODO MASTER ,MODO FIA , M3 AO M31.TXT` | `MODO_MASTER_MODO_FIA_M3_AO_M31.txt` | Remoção de texto em minúsculas (extensão), remoção de vírgulas dentro do nome do arquivo |
