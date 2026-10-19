# Cronograma revisado — Compilador JavaScript → Python

> **Versão:** 07/10/2026  
> **Motivo da revisão:** saída de Lucas da disciplina; redistribuição das atividades entre quatro integrantes e replanejamento em sprints semanais.  
> **Equipe atual:** Matheus, Israel, Jorge e Ruan.  
> **Marco principal:** **Ponto de Controle 2 (P2), em 04/11/2026**, conforme o cronograma anterior. **Confirmar no canal oficial da disciplina caso haja alteração.**  
> **Horizonte:** 07/10 a 03/11 (quatro sprints até o P2), mais 04/11 a 16/11 (janela de estabilização e preparação para a entrega final).

## 1. O que muda em relação ao cronograma anterior

O cronograma original distribuiu tarefas para cinco pessoas e antecipou a implementação de semântica, gerador e testes. Como a equipe agora tem quatro integrantes, **não vamos tentar executar retroativamente as atividades das semanas passadas**. Vamos retomar a partir do que está documentado na apresentação das cinco primeiras sprints.

**Ponto de partida documentado (confirmar no repositório na primeira reunião):**

- Analisador léxico com **Flex**, gramática com **Bison** e compilação com **GCC/Makefile**.
- Núcleo da **AST** (estrutura e funções de gerenciamento de memória) já modelado em C.
- Três programas JavaScript passaram pela análise léxica/sintática com **código de saída 0**, em testes manuais.
- **Ainda falta conectar a gramática à AST**, implementar/ligar a análise semântica, gerar Python executável e automatizar a comparação com o Node.js.

> **Importante:** código de saída 0 nos testes antigos significa que o compilador terminou sem sinalizar erro; **não prova que o Python foi gerado nem que seu resultado corresponde ao JavaScript**. Este novo cronograma mede essas etapas separadamente.

### Redistribuição das tarefas do Lucas

| Trabalho antes atribuído a Lucas | Novo responsável | Ajuste prático |
|---|---|---|
| Geração de comandos, funções, `return` e chamadas | **Ruan** | Responsável exclusivo pelos arquivos do gerador; implementar por etapas, com prioridade para o subconjunto essencial. |
| Casos de teste e comparação de saídas | **Jorge** | Dono de `tests/` e do script de testes; começa com conferência manual e automatiza apenas quando já houver Python gerado. |
| Exemplos de tradução para validar o gerador | **Ruan**, com revisão de **Jorge** | Ruan propõe casos JS/Python; Jorge os incorpora e valida. |
| Ajustes do README, modo de execução e integração dos testes ao build | **Matheus** | Evita sobrecarregar Jorge e Ruan com infraestrutura e documentação geral. |

**Distribuição de foco:** Ruan assume a maior parte da implementação que era do Lucas; Jorge recebe a frente de testes além da semântica. Matheus mantém integração/build/documentação e Israel continua concentrado no Flex/Bison/AST.

## 2. Responsáveis e regra de edição

| Pessoa | Responsabilidade principal | Arquivos sob sua responsabilidade |
|---|---|---|
| **Matheus** | Liderança técnica, AST-base, `main`, compilação, integração, README e P2 | `src/ast.c`, `src/ast.h`, `src/main.c`, `Makefile`, `README.md`, `docs/cronograma.md` |
| **Israel** | Léxico, gramática, ações do Bison que constroem a AST e correções de sintaxe | `src/lexico.l`, `src/grammar.y`, `docs/gramatica_comentada.md` |
| **Jorge** | Tabela de símbolos, análise semântica, casos de teste e execução dos testes | `src/tabela.c`, `src/tabela.h`, `src/semantica.c`, `src/semantica.h`, `tests/`, `docs/semantica.md` |
| **Ruan** | Gerador de código Python (expressões, comandos, blocos, funções e laços) | `src/gerador.c`, `src/gerador.h`, `docs/traducao.md` |

**Regra de integração:** um dono por arquivo. Se outro integrante precisar alterá-lo, abre uma issue/comenta no PR e combina a mudança antes. Novos nomes de funções e tipos de nós devem ser acertados entre Israel, Matheus, Jorge e Ruan antes de implementações dependentes.

**Atenção ao código real:** o cronograma antigo e os slides usam alguns nomes diferentes para funções/campos da AST (`novo_no`/`novo_ponteiro`, `add_filho`/`adicionar_filho`, `n_filhos`/`contador_filhos`). **Conferir `src/ast.h` e adotar a API que realmente existe**; não renomear só para seguir este documento.

## 3. Escopo por prioridade (para caber no prazo)

| Prioridade | O que entra | Critério |
|---|---|---|
| **P0 — obrigatório para o P2** | Declarações e atribuições simples, números/strings/booleanos, expressões aritméticas e comparações, `if/else`, `while`, blocos com indentação e `console.log` → `print`; compilador gera `.py` executável | Pelo menos **3 casos pequenos** executam no Python com a mesma saída do Node.js. |
| **P1 — objetivo se P0 estiver estável** | Funções com parâmetros/`return` e chamadas; `for` clássico traduzido para `while`; atribuições compostas usuais | Cada funcionalidade só é considerada concluída depois de passar por um teste isolado e um teste integrado. |
| **P2 — adiável, não bloquear o P2** | Ternário, acesso a membros/índices, biblioteca adicional, inferência sofisticada de tipos, recuperação avançada de erros e otimizações | Implementar somente se P0/P1 estiverem funcionando e testados. |

**Limites explícitos:** o compilador traduz um **subconjunto** de JavaScript, não JavaScript completo. Não prometer equivalência universal entre JS e Python: coerção de tipos, `===`/`==`, escopo de `var`, `this`, objetos, `break`/`continue`, `++` em expressões e diferenças de `console.log`/`print` exigem cuidados especiais. No `for` inicial, aceitar somente o padrão simples de inicialização, condição e atualização, **sem `continue`**, salvo se houver tratamento correto.

**Regra de corte:** se o P0 não estiver funcionando até **20/10**, suspender temporariamente funções, `for`, ternário, objetos e otimização. Um tradutor menor e correto vale mais do que várias funcionalidades incompletas.

---

## 4. Sprints semanais

### Sprint 6 — 07 a 13/10 | Conectar a AST à gramática

**Objetivo:** sair de “o parser aceita o JavaScript” para “o parser produz uma árvore que representa o JavaScript”. Outras frentes começam com módulos pequenos e independentes.

**Matheus — estrutura e integração**

- [ ] Conferir a compilação da `main` com `make clean && make` e registrar o estado real no `docs/diario.md` (o que já funciona e o que não funciona).
- [ ] Revisar a interface atual de `ast.h` com Israel e publicar a convenção dos tipos de nós, filhos, valores e linhas em `docs/contrato_ast.md`.
- [ ] Ajustar `main.c` para permitir visualizar a AST sem misturar mensagens de debug com o futuro código Python (por exemplo, com `--ast`, se a opção ainda não existir).
- [ ] Revisar memória/alocação no núcleo da AST e integrar os PRs sem quebrar o `make`.

**Israel — AST mínima de ponta a ponta**

- [ ] Adicionar ações semânticas no Bison para `programa`, lista de comandos, blocos, identificadores, números, strings e expressões binárias.
- [ ] Ligar essas ações às funções existentes de criação de nós/adicionar filhos; garantir que a raiz da AST fique acessível ao `main`.
- [ ] Adicionar `decl_var` e atribuição simples à AST; conferir manualmente a árvore de `let x = 2 + 3;`.
- [ ] Corrigir eventuais incompatibilidades de tokens/valores entre `lexico.l` e `grammar.y`.

**Jorge — semântica básica e casos de teste**

- [ ] Criar ou ajustar `tabela.c/.h` com `abrir_escopo`, `fechar_escopo`, `inserir` e `buscar`.
- [ ] Testar **manualmente** a tabela com casos pequenos: declaração, busca, redeclaração e variável em escopo interno.
- [ ] Organizar `tests/casos/` e cadastrar **3 exemplos JS pequenos**: variáveis/expressões, `if/else` e `while` (mesmo que os dois últimos ainda não gerem Python).
- [ ] Combinar com Israel os campos mínimos da AST necessários para a semântica (`nome`, `tipo de declaração`, `linha`).

**Ruan — preparar o gerador sem depender da AST completa**

- [ ] Criar `gerador.h/.c` com entrada `No *raiz`, função para indentação e funções separadas para expressão/comando.
- [ ] Implementar emissão dos casos simples: número, string, identificador, operações aritméticas e declaração com inicialização.
- [ ] Testar primeiro com uma **AST pequena construída manualmente em C**, caso a conexão com Bison ainda não esteja pronta.
- [ ] Registrar traduções suportadas em `docs/traducao.md`, sem marcar como implementadas as que ainda forem exemplos teóricos.

**Integração sugerida:** 07–09/10 alinhar interfaces; 10–11/10 implementar/testar; 12–13/10 unir as mudanças e corrigir falhas.

**Pronto quando:** `make clean && make` funciona e um programa curto como `let x = 2 + 3;` **imprime uma AST compreensível**. Gerador e tabela ao menos compilam/testam isoladamente. **Não é exigido gerar Python completo ainda.**

### Sprint 7 — 14 a 20/10 | Primeiro JavaScript → Python funcional

**Objetivo:** fechar um caminho simples de ponta a ponta: JS → Flex/Bison → AST → semântica básica → Python → execução.

**Matheus — conectar as fases**

- [ ] Integrar no `main.c`: análise sintática → AST → análise semântica (quando disponível) → emissão do Python.
- [ ] Padronizar **código Python em `stdout`** e mensagens de erro/debug em `stderr`; impedir geração se houver erro fatal.
- [ ] Ajustar o Makefile para compilar os novos módulos sem quebrar o build limpo.
- [ ] Fazer revisão cruzada com Israel e resolver falhas de integração, evitando pegar tarefas de implementação dos demais.

**Israel — completar AST do núcleo obrigatório**

- [ ] Gerar nós e filhos corretos para `if/else`, `while`, blocos, chamadas e `console.log`.
- [ ] Garantir que as expressões dentro de condições e chamadas apareçam corretamente na AST.
- [ ] Validar a árvore dos **3 exemplos pequenos** e corrigir divergências entre gramática e estrutura definida.

**Jorge — ligar semântica e preparar validação repetível**

- [ ] Implementar `analisar(raiz)` com **variável não declarada** e **redeclaração no mesmo escopo**; acrescentar escopos de bloco quando os nós já estiverem corretos.
- [ ] Tratar `console.log` como construção suportada, sem acusar falsamente `console` de variável não declarada.
- [ ] Criar **2 testes negativos** (variável ausente e declaração duplicada) e conferir manualmente as mensagens e o código de saída.
- [ ] Montar a primeira versão simples de `tests/rodar.sh` que execute os casos e mostre `OK/FALHA` (comparação automática de saídas pode ficar para a Sprint 8/9).

**Ruan — comandos e saída Python**

- [ ] Implementar `decl_var`, atribuição, expressão isolada e `console.log(...)` → `print(...)`.
- [ ] Implementar blocos, indentação de **4 espaços**, `if/else`, `while` e `pass` quando um bloco ficar vazio.
- [ ] Traduzir os operadores básicos suportados, incluindo `&&` → `and`, `||` → `or`, `!` → `not`, `true/false` → `True/False` e `null` → `None`, com testes pequenos.
- [ ] Corrigir os primeiros casos em que o Python gerado não executa.

**Integração sugerida:** 14–16/10 construir o fluxo mínimo; 17–18/10 executar Python; 19–20/10 corrigir até estabilizar.

**Pronto quando:** ao menos **3 programas pequenos** geram Python válido, rodam no `python3` e têm suas saídas **comparadas manualmente** com `node`. Os dois erros semânticos escolhidos são detectados.

### Sprint 8 — 21 a 27/10 | Funções, laços e testes mais fortes

**Objetivo:** ampliar somente o que o núcleo já suporta, sem sacrificar os casos que funcionavam na sprint anterior.

**Matheus — manutenção do caminho completo**

- [ ] Garantir que AST, semântica e gerador continuem integrados; corrigir erros de interface entre módulos.
- [ ] Criar com Israel **2 exemplos de demonstração**: um com condicionais/laços e outro com funções (se já suportadas).
- [ ] Atualizar `README.md` com compilação, execução, exemplo de entrada/saída e limitações reais.
- [ ] Reservar tempo para revisar PRs e documentar decisões importantes, não iniciar otimização.

**Israel — finalizar AST do escopo escolhido**

- [ ] Incluir nós completos para declaração de função, parâmetros, `return` e chamada de função.
- [ ] Se o item anterior estiver estável, fechar a AST do `for` clássico e sua atualização (`i++`, `i += 1` etc.).
- [ ] Corrigir regras com informações insuficientes para o gerador, sempre usando o contrato da AST.

**Jorge — semântica + testes herdados do Lucas**

- [ ] Registrar parâmetros no escopo da função e reconhecer nomes de funções antes de analisar suas chamadas, quando aplicável.
- [ ] Validar função não declarada e `return` fora de função **se** essas funcionalidades estiverem prontas; não bloquear casos válidos com checagens incompletas.
- [ ] Evoluir `tests/rodar.sh` para **compilar → executar o Python gerado → comparar a saída** com a do Node.js nos casos suportados.
- [ ] Organizar uma bateria inicial de **6 a 8 casos** (simples, independentes e rastreáveis), incluindo erros esperados.

**Ruan — absorver a parte funcional do Lucas**

- [ ] Implementar `function` → `def`, parâmetros, chamada e `return`; validar primeiro um caso pequeno como `soma(2, 3)`.
- [ ] **Depois das funções**, implementar `for` clássico → inicialização + `while` + atualização, somente nas formas explicitamente suportadas.
- [ ] Se houver tempo, adicionar atribuições compostas comuns (`+=`, `-=`, `*=`, `/=`) com casos individuais.
- [ ] Resolver bugs de indentação/blocos e preservar a saída correta dos casos da Sprint 7.

**Integração sugerida:** 21–23/10 funções; 24–25/10 `for` (se viável); 26–27/10 regressão e correções.

**Pronto quando:** os 3 casos essenciais continuam verdes, a suíte alcança **6 a 8 casos úteis** e existe pelo menos **uma demonstração com funções**. O `for` é desejável, mas **não entra às custas de quebrar o núcleo**.

### Sprint 9 — 28/10 a 03/11 | Estabilização e preparação do P2

**Objetivo:** parar de expandir o escopo, testar o que foi realmente implementado e apresentar um compilador demonstrável.

**Matheus — P2, build e documentação**

- [ ] Revisar `README.md`, `docs/cronograma.md` e `docs/diario.md` com a situação **real**, registrando a saída do Lucas e a redistribuição.
- [ ] Preparar uma demonstração reproduzível: compilar, mostrar entrada `.js`, gerar `.py`, executar e comparar as saídas.
- [ ] Integrar/revisar os PRs finais; verificar que um `make clean && make` funciona em ambiente limpo.
- [ ] Rascunhar as respostas do P2 até **01/11** e enviar o formulário até **03/11**, se forem mantidos os prazos do cronograma anterior.

**Israel — estabilidade da gramática e AST**

- [ ] Reexecutar os programas válidos e inválidos; corrigir apenas defeitos de tokenização, sintaxe e construção da AST.
- [ ] Documentar o subconjunto JS que realmente é aceito e suas limitações.
- [ ] Garantir que erros do Bison/Flex sejam identificáveis e não contaminem a saída Python.

**Jorge — dono da validação final**

- [ ] Finalizar `tests/rodar.sh` e a meta de **8 casos pequenos, ou menos com justificativa se o escopo tiver sido reduzido**.
- [ ] Separar testes de **sucesso** (saída JS x Python) e de **erro** (mensagem/código de saída esperados).
- [ ] Relatar número de aprovados/reprovados **sem maquiar falhas** e documentar as verificações semânticas realmente implementadas.
- [ ] Rodar a bateria após cada integração na `main`.

**Ruan — correções finais do gerador**

- [ ] Corrigir diferenças de saída, erros de indentação, ordem dos comandos e traduções ainda incorretas.
- [ ] Revisar `for`, funções e operadores **somente se tiverem entrado no escopo implementado**.
- [ ] Ajudar Jorge a identificar casos de comparação JS/Python que sejam válidos para o subconjunto escolhido.
- [ ] Não abrir novas frentes como objetos avançados ou otimizações.

**Datas de fechamento:**

- **28–31/10:** corrigir bugs prioritários e completar testes.
- **01/11:** congelar funcionalidades para o P2; preparar demonstração e respostas.
- **02/11:** ensaio com os quatro integrantes; somente correções críticas.
- **03/11:** enviar o formulário do P2 e conferir a `main`.
- **04/11:** **P2** — demonstrar apenas o que está funcionando e explicar as limitações.

**Pronto quando:** há pelo menos **3 demonstrações simples reproduzíveis** com tradução para Python e comparação com Node.js; a documentação descreve os resultados reais; os quatro integrantes conseguem explicar a arquitetura.

---

## 5. Sprints após o P2 (janela até meados de novembro)

> O cronograma anterior menciona que a **entrega final do repositório ocorre 15 dias antes da entrevista**. Portanto, **não tratar 16/11 como prazo oficial fixo** sem conferir o calendário da turma. Se a data de corte for anterior, antecipar o congelamento.

### Sprint 10 — 04 a 10/11 | Corrigir o que o P2 apontar

- **Matheus:** consolidar feedback do professor em issues, ordenar por gravidade e manter a `main` compilável; atualizar documentação.
- **Israel:** corrigir problemas de gramática, tokens e construção da AST encontrados na apresentação.
- **Jorge:** ampliar apenas testes que reproduzam bugs reais; corrigir falsos positivos de semântica e reforçar a bateria automatizada.
- **Ruan:** corrigir tradução/indentação que produza Python inválido ou saída divergente; não adicionar linguagem nova sem necessidade.

**Pronto quando:** os bugs críticos do P2 estão corrigidos, os testes anteriores continuam funcionando e as limitações restantes estão documentadas.

### Sprint 11 — 11 a 16/11 | Entrega e entrevista (datas sujeitas à regra oficial)

- **Matheus:** garantir `README.md`, documentação, exemplos e instruções de execução; preparar tag `v1.0` **somente na data de corte confirmada**.
- **Israel:** revisar explicação de Flex/Bison, conflitos de gramática e criação da AST.
- **Jorge:** revisar tabela de símbolos, escopos, análise semântica, casos de erro e resultados dos testes.
- **Ruan:** revisar tradução JS→Python, geração de blocos/funções/laços e principais limitações.
- **Todos:** fazer uma execução completa a partir de clone limpo e um simulado curto em que cada integrante explique uma parte que não implementou.

**Pronto quando:** repositório reproduzível, equipe pronta para demonstrar e responder perguntas; entrega na data oficial correta.

---

## 6. Procedimento manual de validação (primeiro) e automação (depois)

### Até a Sprint 7: teste manual, um arquivo por vez

**Compilação:**

```bash
make clean && make
```

**Quando o modo gerador estiver ligado** (exemplo; ajustar caminho do binário se necessário):

```bash
# 1) Gerar Python a partir do JavaScript
./build/compilador < tests/casos/01_variaveis.js > /tmp/saida.py

# 2) Executar o Python gerado
python3 /tmp/saida.py

# 3) Comparar com a execução do JavaScript original
node tests/casos/01_variaveis.js > /tmp/saida_js.txt
python3 /tmp/saida.py > /tmp/saida_py.txt
diff -u /tmp/saida_js.txt /tmp/saida_py.txt
```

**Observação:** os comandos de geração pressupõem que Matheus tenha ligado a saída Python no `main.c`. Antes disso, usar a opção de inspeção da AST e os testes sintáticos já existentes. `node` e `python3` precisam estar instalados para comparar execuções.

### Sprints 8 e 9: transformar o processo repetitivo em script simples

**Responsável:** Jorge. O script `tests/rodar.sh` deve repetir os comandos manuais para os casos suportados e informar `OK`/`FALHA`, sem depender de serviços externos ou ferramentas complexas. Opcionalmente, Matheus adiciona o alvo `make test` ao Makefile para invocar o script.

**Para considerar um caso aprovado:**

1. A compilação do tradutor funciona.
2. O arquivo JS é aceito; o tradutor termina sem erro.
3. O Python gerado executa sem erro.
4. A saída do Python coincide com a saída do Node.js **naquele caso de teste**.

**Não confundir:** sucesso do parser, geração de Python válido e equivalência de saída são **três verificações diferentes**.

### Rotina semanal mínima (sem burocracia)

- **Início da sprint:** 20 minutos em grupo para escolher tarefas prioritárias, checar dependências e abrir issues pequenas.
- **Durante a semana:** cada pessoa trabalha na própria área; PR pequeno ao terminar uma funcionalidade testável; revisão de outro integrante.
- **Fim da sprint:** uma reunião de 30 minutos para rodar os testes manualmente, registrar o que passou/falhou e ajustar a próxima semana.
- **Regra prática:** não começar uma funcionalidade nova com um bug crítico de integração ainda aberto; registrar bloqueios imediatamente no grupo.

## 7. Critérios de sucesso e plano B

| Data | Mínimo que precisa existir | Se não estiver pronto... |
|---|---|---|
| **13/10** | Árvore gerada pelo parser para um JS simples | Israel + Matheus priorizam conexão AST/gramática; Ruan testa gerador com AST manual. |
| **20/10** | Três casos pequenos com Python executável | Cortar recursos avançados; focar no fluxo JS → Python e em `if/while`. |
| **27/10** | Fluxo estável e 6–8 testes úteis; funções preferencialmente prontas | Congelar no subconjunto que funciona; adiar `for`, ternário e objetos se necessário. |
| **01/11** | Funcionalidades congeladas, demos e documentação preparadas | Tratar somente correções que afetam a demonstração. |
| **04/11** | P2 com demonstração honesta e reproduzível | Apresentar escopo reduzido e limitações explícitas, sem alegar funcionalidades inexistentes. |

**Critério central do projeto:** não é “aceitar o maior número de construções do JavaScript”; é **transformar um subconjunto bem definido em Python que execute corretamente**, com evidências de teste e uma divisão de trabalho sustentável para quatro integrantes.

## 8. Resumo rápido para GitHub

| Sprint | Datas | Foco | Marco de saída |
|---|---|---|---|
| **6** | **07–13/10** | Conectar Bison à AST; preparar semântica e gerador | AST impressa de um JS simples |
| **7** | **14–20/10** | Primeiro caminho JS → Python (`if`, `while`, variáveis, `print`) | 3 casos executam e são comparados manualmente |
| **8** | **21–27/10** | Funções, `return`, `for` se couber; testes | 6–8 casos, função demonstrável |
| **9** | **28/10–03/11** | Corrigir, testar, documentar, congelar e ensaiar | Pronto para **P2 em 04/11** |
| **10** | **04–10/11** | Correções pós-P2 | Falhas críticas resolvidas |
| **11** | **11–16/11** | Entrega/entrevista conforme data oficial | Repositório reproduzível e equipe preparada |

---

**Registro da mudança:** cronograma atualizado em **07/10/2026** para refletir a saída de Lucas, a priorização do caminho mínimo JS → Python, a transferência do gerador para Ruan e dos testes para Jorge, e a revisão das metas em sprints semanais. Atividades previstas são **metas**, não declarações de que as implementações já foram concluídas.
