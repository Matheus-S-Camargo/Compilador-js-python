# Desenvolvimento de um Compilador JavaScript → Python

**Universidade de Brasília (FCTE)** 

**Disciplina:** Compiladores 1

---

## Sumário

1. [Introdução](#1-introdução)
2. [Fundamentação Teórica](#2-fundamentação-teórica)
   - 2.1 [Compilador vs. Interpretador](#21-compilador-vs-interpretador)
   - 2.2 [Definição das Linguagens Envolvidas](#22-definição-das-linguagens-envolvidas)
   - 2.3 [Ferramentas: Flex e Bison](#23-ferramentas-flex-e-bison)
3. [Arquitetura Geral do Compilador](#3-arquitetura-geral-do-compilador)
4. [Primeiros Passos: Implementação do Léxico com Flex](#4-primeiros-passos-implementação-do-léxico-com-flex)
5. [Escopo e Limitações](#5-escopo-e-limitações)
6. [Cronograma e Divisão de Tarefas](#6-cronograma-e-divisão-de-tarefas)
7. [Referências](#7-referências)

---

## 1. Introdução

### 1.1 Contextualização

A interoperabilidade entre linguagens de programação é um desafio recorrente na engenharia de software, especialmente quando equipes precisam migrar sistemas ou reaproveitar lógica escrita em uma linguagem para ambientes que utilizam outra. JavaScript e Python são duas das linguagens mais populares atualmente, cada uma dominante em domínios distintos — JavaScript no desenvolvimento web e Python em ciência de dados, automação e prototipagem rápida. A tradução automática entre elas ilustra, de forma prática, os principais conceitos estudados na disciplina de Compiladores.

### 1.2 Objetivo Geral

Desenvolver um compilador capaz de traduzir um subconjunto da linguagem JavaScript para código Python equivalente e sintaticamente válido.

### 1.3 Objetivos Específicos

- Implementar um analisador léxico utilizando Flex para reconhecimento dos tokens da linguagem JavaScript.
- Implementar um analisador sintático utilizando Bison para construção da árvore sintática abstrata (AST).
- Realizar análise semântica básica sobre a AST gerada.
- Gerar código Python válido e funcional a partir da estrutura processada.

### 1.4 Justificativa

O projeto permite aplicar de forma integrada os principais conceitos da disciplina — análise léxica, análise sintática, análise semântica e geração de código — em um problema real e de fácil verificação de resultados, pois a tradução pode ser testada executando o código Python gerado.

---

## 2. Fundamentação Teórica

### 2.1 Compilador vs. Interpretador

Um **compilador** é um programa que traduz um código-fonte escrito em uma linguagem de origem (*source language*) para outra linguagem de destino (*target language*), geralmente antes da execução do programa. Já um **interpretador** executa o código-fonte diretamente, traduzindo e executando as instruções em tempo real, sem gerar um artefato de saída independente.

**Principais diferenças:**

| Aspecto | Compilador | Interpretador |
|---|---|---|
| Momento da tradução | Antes da execução (*ahead-of-time*) | Durante a execução (*on-the-fly*) |
| Saída | Programa executável / código traduzido | Nenhum artefato persistente |
| Detecção de erros | Geralmente antes da execução | Durante a execução |
| Exemplos | GCC, Bison-based compilers | CPython (parcialmente), Node.js (motor V8 combina JIT) |

**Classificação do projeto:** o compilador desenvolvido neste trabalho se enquadra na categoria de **compilador fonte-a-fonte (source-to-source compiler)**, também chamado de **transpilador**, pois tanto a linguagem de origem (JavaScript) quanto a de destino (Python) são linguagens de alto nível.

### 2.2 Definição das Linguagens Envolvidas

**JavaScript**
- Linguagem interpretada (ou compilada *just-in-time*), de tipagem dinâmica e fraca.
- Sintaxe baseada em chaves `{}` para delimitação de blocos.
- Suporta paradigmas imperativo, orientado a objetos (baseado em protótipos) e funcional.

**Python**
- Linguagem interpretada, de tipagem dinâmica e forte.
- Sintaxe baseada em indentação para delimitação de blocos (sem uso de chaves).
- Suporta paradigmas imperativo, orientado a objetos (baseado em classes) e funcional.

### 2.3 Ferramentas: Flex e Bison

**Flex (Fast Lexical Analyzer Generator)**
- Ferramenta responsável pela **análise léxica**.
- A partir de um conjunto de expressões regulares definidas pelo usuário, gera automaticamente um analisador léxico (*scanner*) em C.
- Sua função no projeto é ler o código-fonte em JavaScript e convertê-lo em uma sequência de *tokens* (palavras-chave, identificadores, operadores, literais, etc.).

**Bison**
- Ferramenta responsável pela **análise sintática**.
- Recebe a gramática da linguagem (definida em notação BNF/EBNF) e gera um analisador sintático (*parser*) em C.
- Consome os tokens produzidos pelo Flex e constrói a estrutura sintática do programa, tipicamente representada por uma Árvore Sintática Abstrata (AST).

**Integração entre as ferramentas**

O fluxo de trabalho segue o padrão clássico do toolchain Flex + Bison:

```
Código-fonte (JS)
      │
      ▼
   [ Flex ]  →  gera tokens
      │
      ▼
   [ Bison ] →  consome tokens, valida a gramática, monta a AST
      │
      ▼
Próximas etapas do compilador
```

---

## 3. Arquitetura Geral do Compilador

O pipeline do compilador está estruturado nas seguintes etapas:

```
Lexer (Flex) → Parser (Bison) → AST → Análise Semântica → 
 → Geração de Código Python
```

| Etapa | Responsabilidade |
|---|---|
| **Lexer** | Converter o código-fonte JS em tokens |
| **Parser** | Validar a gramática e construir a AST |
| **Análise Semântica** | Verificar consistência (escopo, tipos quando aplicável, uso de variáveis) |
| **Geração de Código** | Produzir o código Python final a partir da AST/IR |

---

## 4. Primeiros Passos: Implementação do Léxico com Flex

A primeira etapa prática do projeto consiste na criação do **dicionário de tokens**, isto é, o mapeamento entre padrões léxicos (expressões regulares) e as categorias de tokens reconhecidos pela linguagem JavaScript.

**Categorias de tokens previstas:**

- **Palavras-chave:** `function`, `var`, `let`, `const`, `if`, `else`, `for`, `while`, `return`, etc.
- **Identificadores:** nomes de variáveis e funções.
- **Literais:** números (inteiros e ponto flutuante), strings, booleanos (`true`/`false`), `null`.
- **Operadores:** aritméticos (`+`, `-`, `*`, `/`), relacionais (`==`, `===`, `<`, `>`), lógicos (`&&`, `||`, `!`), atribuição (`=`, `+=`, etc.).
- **Delimitadores:** `{`, `}`, `(`, `)`, `;`, `,`.
- **Comentários:** de linha (`//`) e de bloco (`/* */`), a serem ignorados pelo analisador léxico.

**Exemplo ilustrativo de regra léxica (Flex):**

```c
"function"      { return FUNCTION; }
"let"|"var"|"const" { return VAR_DECL; }
[0-9]+          { return NUMBER; }
[a-zA-Z_][a-zA-Z0-9_]* { return IDENTIFIER; }
"//".*          { /* ignora comentário de linha */ }
```

**Desafios previstos nesta etapa:**

- Tokens exclusivos de JavaScript sem equivalente direto em Python (ex: `===`, `undefined`).
- Ambiguidades léxicas (ex: diferenciar `=` de `==` e `===`).
- Tratamento de strings com aspas simples, duplas e template literals (`` ` ``).

---

## 5. Escopo e Limitações

Para viabilizar a execução do projeto dentro do prazo da disciplina, o grupo delimita o seguinte escopo inicial:

**Incluído no escopo:**
- Declaração e atribuição de variáveis (`var`, `let`, `const`).
- Estruturas condicionais (`if`/`else`) e de repetição (`for`, `while`).
- Declaração e chamada de funções (sem *arrow functions* na primeira versão).
- Tipos primitivos: números, strings, booleanos.
- Operadores aritméticos, relacionais e lógicos básicos.

**Fora do escopo (versão inicial):**
- Recursos avançados de ES6+ (classes, *arrow functions*, *destructuring*, *async/await*).
- Manipulação de DOM ou APIs específicas de navegador.
- Módulos (`import`/`export`).

*(Este item pode ser ajustado conforme orientação do professor.)*

---

## 7. Referências

- AHO, A. V.; LAM, M. S.; SETHI, R.; ULLMAN, J. D. *Compiladores: Princípios, Técnicas e Ferramentas*. 2ª ed. Pearson, 2008.
- Documentação oficial do Flex: https://westes.github.io/flex/manual/
- Documentação oficial do Bison: https://www.gnu.org/software/bison/manual/
- Documentação oficial do ECMAScript (JavaScript): https://tc39.es/ecma262/
- Documentação oficial do Python: https://docs.python.org/3/
