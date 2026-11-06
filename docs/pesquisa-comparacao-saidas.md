---
aliases: [Comparação portátil de saídas]
tags: [learned/testes]
status: consolidado
tipo: research
data_criacao: 2026-11-06
data_atualizacao: 2026-11-06
origem: ai-learn
---

# Comparação portátil de saídas de processos

Objetivo: evitar falsos positivos causados por convenções de fim de linha ao comparar JavaScript e Python, preservando divergências relevantes. Consulta em 2026-11-06; documentação do Python, aplicável ao uso de subprocess.

| Conceito | Explicação e aplicação | Evidência e limites |
|---|---|---|
| Captura em texto | `subprocess.run(..., capture_output=True, text=True, encoding="utf-8")` devolve texto e normaliza fins de linha na saída e no erro. | [Documentação de subprocess, argumentos usados frequentemente](https://docs.python.org/3/library/subprocess.html#frequently-used-arguments). Depende da codificação real dos processos. |
| Quebras universais | O leitor em modo universal converte CR, LF e CRLF para LF. | [TextIOWrapper, parâmetro newline](https://docs.python.org/3/library/io.html#io.TextIOWrapper). Isso também oculta diferenças intencionais em caracteres CR; use captura binária quando bytes exatos forem requisito. |
| Comparação de comportamento | Compare saída completa após normalização explicitamente escolhida, sem aplicar `strip()`, e verifique código de retorno e erro separadamente. | Inferência para os testes deste projeto; espaços, linhas em branco e ausência de quebra final continuam observáveis. Normalização não resolve diferenças de tipos ou valores. |

No diagnóstico local, os cinco exemplos válidos tiveram conteúdo igual depois de normalizar CRLF/LF; antes disso, a comparação binária apontou diferenças de plataforma. A próxima verificação é testar a suíte tanto em Windows quanto em um ambiente Unix e incluir casos em que CR seja conteúdo significativo.

Este registro fica no projeto porque o cofre `E:/Obsidian/P.DATA/learned` não está entre os diretórios autorizados para escrita; o índice do cofre não foi atualizado.
