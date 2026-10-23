/**
 * Compilador JS -> Python: Banco de Dados de Conhecimento e Código do Projeto
 * Integração completa de:
 * - explicacao_AST.md (detalhamento linha a linha e teoria de ponteiros/memória)
 * - linguagem.md (tabela completa de tokens, regexes e precedência)
 * - estudo_bison.md e estudo_bison2.md (comunicação Flex/Bison, %union, conflitos)
 * - cronograma.md (atribuição de papéis e responsabilidade dos arquivos)
 * - Código-fonte real e verificado de todos os arquivos do repositório
 */

const PROJECT_DATA = {
  info: {
    name: "Compilador JS → Python",
    version: "1.0.0 (FCTE - UnB)",
    discipline: "Compiladores 1",
    summary: "Um compilador fonte-a-fonte (transpilador) em C que traduz um subconjunto estruturado da linguagem JavaScript em código Python sintaticamente válido e executável.",
    team: [
      { name: "Matheus", role: "Líder Técnico & Núcleo da AST", files: ["src/ast.c", "src/ast.h", "src/main.c", "Makefile"] },
      { name: "Israel", role: "Analisador Sintático & Gramática", files: ["src/grammar.y", "src/lexico.l"] },
      { name: "Jorge", role: "Análise Semântica & Tabela de Símbolos", files: ["src/tabela.c", "src/tabela.h"] },
      { name: "Ruan", role: "Gerador de Código Python (Comandos & Expressões)", files: ["src/gerador.c", "src/gerador.h"] },
      { name: "Lucas", role: "Gerador de Código & Suíte de Testes", files: ["src/gerador.c", "tests/"] }
    ]
  },

  pipeline: [
    {
      id: "entrada",
      name: "Entrada",
      tag: "1. Entrada",
      desc: "Código-fonte em JavaScript (variáveis, laços, condicionais e chamadas de função).",
      icon: "file-code",
      color: "blue"
    },
    {
      id: "lexico",
      name: "Léxico (Flex)",
      tag: "2. Processamento",
      desc: "src/lexico.l converte o texto em tokens tipados e preenche yylval com literais.",
      icon: "cpu",
      color: "purple"
    },
    {
      id: "sintatico",
      name: "Sintático & AST",
      tag: "3. AST",
      desc: "src/grammar.y valida a gramática LALR(1) e monta dinamicamente a árvore em C.",
      icon: "git-commit",
      color: "green"
    },
    {
      id: "gerador",
      name: "Geração",
      tag: "4. Geração",
      desc: "src/gerador.c percorre a AST e converte chaves em indentação e operadores para Python.",
      icon: "layers",
      color: "amber"
    },
    {
      id: "saida",
      name: "Saída",
      tag: "5. Saída",
      desc: "Script Python 3 válido impresso em stdout ou salvo em arquivo pronto para rodar.",
      icon: "check-circle",
      color: "indigo"
    }
  ],

  modules: [
    {
      id: "gerador",
      name: "gerador",
      path: "src/gerador.c",
      desc: "Responsável por transformar a árvore sintática abstrata em código Python final indentado.",
      category: "gerador",
      color: "gerador"
    },
    {
      id: "ast",
      name: "ast",
      path: "src/ast.c",
      desc: "Constrói, manipula e desaloca os nós homogêneos da Árvore Sintática Abstrata (No*).",
      category: "ast",
      color: "ast"
    },
    {
      id: "parser",
      name: "parser",
      path: "src/grammar.y",
      desc: "Gramática Bison LALR(1) e analisador léxico Flex que regem as regras da linguagem.",
      category: "core",
      color: "core"
    },
    {
      id: "tabela",
      name: "tabela",
      path: "src/tabela.c",
      desc: "Pilha de tabelas de símbolos para controle de escopo e checagem de variáveis.",
      category: "outros",
      color: "outros"
    }
  ],

  technologies: [
    { name: "C (C99)", class: "c", desc: "Linguagem de implementação dos núcleos de AST, gerador, tabela e CLI" },
    { name: "GNU Bison", class: "bison", desc: "Gerador de analisadores sintáticos LALR(1) para construção da AST" },
    { name: "Flex", class: "flex", desc: "Gerador de analisador léxico baseado em Expressões Regulares" },
    { name: "GNU Make", class: "make", desc: "Automação de compilação e orquestração do pipeline" },
    { name: "JavaScript", class: "js", desc: "Linguagem de origem (subconjunto com variáveis, laços e funções)" },
    { name: "Python", class: "py", desc: "Linguagem de destino (saída formatada com indentação de 4 espaços)" }
  ],

  files: {
    "src/ast.c": {
      name: "ast.c",
      path: "src/ast.c",
      language: "c",
      module: "ast",
      author: "Matheus",
      summary: "Implementação das funções de ciclo de vida da AST: alocação dinâmica com malloc/realloc, impressão recursiva identada e desalocação pós-ordem com free.",
      linesCount: 56,
      dependencies: ["src/ast.h", "<stdlib.h>", "<string.h>", "<stdio.h>"],
      dependents: ["src/grammar.y", "src/gerador.c", "src/main.c", "tests/teste_gerador.c"],
      code: [
        '#include <stdlib.h>',
        '#include <string.h>',
        '#include <stdio.h>',
        '#include "ast.h"',
        '',
        'No *novo_ponteiro(const char *tipo, const char *valor, int linha){',
        '    No *tamanho = malloc(sizeof(No));',
        '    tamanho -> tipo = strdup(tipo);',
        '    if (valor != NULL){',
        '        tamanho -> valor = strdup(valor);',
        '    } else {',
        '        tamanho -> valor = NULL;',
        '    }',
        '    tamanho -> filhos = NULL;',
        '    tamanho -> contador_filhos = 0;',
        '    tamanho -> linha = linha; ',
        '    return tamanho;',
        '}',
        '',
        'void adicionar_filho(No *pai, No *filho){',
        '    pai -> contador_filhos++;',
        '    pai->filhos = realloc(pai->filhos, pai->contador_filhos * sizeof(No *));    ',
        '    pai->filhos[pai->contador_filhos - 1] = filho;',
        '}',
        '',
        'void imprimir_ast(No *raiz, int nivel){',
        '    if (raiz == NULL){',
        '        return;',
        '    }',
        '',
        '    for (int i = 0; i < nivel; i++){',
        '        printf("  ");',
        '    }',
        '',
        '    printf("%s: %s (linha %d)\\n", raiz->tipo, raiz->valor ? raiz->valor : "", raiz->linha);',
        '',
        '    for (int i = 0; i < raiz->contador_filhos;i++){',
        '        imprimir_ast(raiz->filhos[i], nivel + 1);',
        '    }',
        '}',
        '',
        'void liberar_ast(No *raiz) {',
        '    if (raiz == NULL){',
        '        return;',
        '    }',
        '    for (int i = 0; i < raiz->contador_filhos; i++) {',
        '        liberar_ast(raiz->filhos[i]);',
        '    }',
        '    free(raiz->filhos);',
        '    free(raiz->tipo);',
        '    free(raiz->valor);        ',
        '    free(raiz);',
        '}',
        ''
      ],
      annotations: {
        6: {
          title: "novo_ponteiro(): Construtor de Nós da AST",
          text: "Devolve um ponteiro No*, preparando o endereço de memória de um novo nó genérico. É chamado a cada regra do Bison.",
          theory: "Ponteiros e Alocação em Heap: O compilador trabalha em C puro. A cada token ou redução gramatical, um nó precisa persistir além do escopo da função que o gerou."
        },
        7: {
          title: "Alocação do Bloco Base com malloc",
          text: "Calcula sizeof(No) bytes (tamanho fixo de metadados) e aloca o espaço na heap. Os filhos dinâmicos ainda não são alocados aqui.",
          theory: "sizeof(No) aloca apenas o descritor (ponteiros e contadores inteiros), mantendo a alocação inicial mínima."
        },
        8: {
          title: "strdup(tipo) — Imutabilidade de Strings",
          text: "Cria uma cópia física da string do tipo ('binop', 'num', 'if') em novo endereço. Evita ponteiros para buffers temporários do analisador.",
          theory: "strdup é essencial porque literais de tipo ou strings de tokens do Flex podem ser sobrescritos pelo buffer léxico nos próximos passos."
        },
        9: {
          title: "Tratamento de Valor Opcional",
          text: "Se o nó possuir valor (ex: o número '10' ou operador '+'), duplica com strdup. Se for nó estrutural (como 'bloco' ou 'programa'), define como NULL.",
          theory: "Evita segmentation fault ao tentar executar strdup em ponteiro NULL."
        },
        14: {
          title: "Inicialização de Filhos",
          text: "Define filhos = NULL e contador_filhos = 0. A lista crescerá sob demanda via realloc.",
          theory: "Padrão de inicialização segura em C para vetores dinâmicos."
        },
        20: {
          title: "adicionar_filho(): Acoplamento Pai-Filho",
          text: "Incrementa o contador de filhos e expande o array dinâmico de ponteiros (pai->filhos) via realloc.",
          theory: "realloc(pai->filhos, n * sizeof(No*)): redimensiona o vetor de ponteiros mantendo os filhos anteriores e abrindo vaga para o novo ponteiro no índice n-1."
        },
        26: {
          title: "imprimir_ast(): Visualização Hierárquica em Árvore",
          text: "Percorre recursivamente a árvore exibindo cada nó com indentação de 2 espaços por nível de profundidade.",
          theory: "Recursão em Pré-ordem: primeiro imprime o nó atual (tipo, valor e linha) e em seguida dispara a chamada recursiva para cada filho (nivel + 1)."
        },
        42: {
          title: "liberar_ast(): Coleta Manual de Memória",
          text: "Libera recursivamente todos os nós e seus dados alocados. Evita vazamentos de memória (memory leaks) em C.",
          theory: "Desalocação em Pós-ordem: é OBRIGATÓRIO desalocar os filhos antes de liberar o nó pai. Se liberasse o pai primeiro, os ponteiros para os filhos seriam perdidos, causando leak perpétuo."
        }
      }
    },

    "src/ast.h": {
      name: "ast.h",
      path: "src/ast.h",
      language: "c",
      module: "ast",
      author: "Matheus",
      summary: "Definição do contrato da struct No (árvore homogênea) e protótipos de manipulação.",
      linesCount: 17,
      dependencies: [],
      dependents: ["src/ast.c", "src/grammar.y", "src/gerador.h", "src/main.c"],
      code: [
        '#ifndef AST_H',
        '#define AST_H',
        '',
        'typedef struct No {',
        '    char *tipo;',
        '    char *valor;',
        '    struct No **filhos;',
        '    int contador_filhos;',
        '    int linha;',
        '} No;',
        '',
        'No  *novo_ponteiro(const char *tipo, const char *valor, int linha);',
        'void adicionar_filho(No *pai, No *filho);',
        'void imprimir_ast(No *raiz, int nivel);',
        'void liberar_ast(No *raiz);',
        '',
        '#endif'
      ],
      annotations: {
        4: {
          title: "Struct No: O Bloco Central da AST",
          text: "Estrutura homogênea genérica com: tipo ('binop', 'if', 'num'), valor opcional, vetor dinâmico de ponteiros para filhos (struct No **filhos), contador de filhos e linha de origem no JS.",
          theory: "Por que uma struct homogênea? Em equipes com 5 pessoas, criar uma struct específica para cada nó gera acoplamento alto. Uma estrutura genérica permite que qualquer membro crie novas reduções sem mexer na struct base."
        }
      }
    },

    "src/main.c": {
      name: "main.c",
      path: "src/main.c",
      language: "c",
      module: "core",
      author: "Matheus",
      summary: "Ponto de entrada (CLI) do compilador. Aciona yyparse(), controla flags de linha de comando (--py e --ast) e dispara o gerador de código.",
      linesCount: 27,
      dependencies: ["src/ast.h", "src/gerador.h", "<stdio.h>", "<string.h>"],
      dependents: ["compilador (executável)"],
      code: [
        '#include <stdio.h>',
        '#include <string.h>',
        '#include "ast.h"',
        '#include "gerador.h"',
        '',
        'extern int yyparse(void);',
        'extern No *raiz;',
        '',
        'int main(int argc, char *argv[]) {',
        '    int resultado = yyparse();',
        '',
        '    if (resultado == 0 && raiz != NULL) {',
        '        int apenas_py = (argc > 1 && strcmp(argv[1], "--py") == 0);',
        '        int apenas_ast = (argc > 1 && strcmp(argv[1], "--ast") == 0);',
        '',
        '        if (apenas_py) {',
        '            gerar_codigo(raiz, stdout);',
        '        } else if (apenas_ast) {',
        '            imprimir_ast(raiz, 0);',
        '        } else {',
        '            printf("Analise sintatica concluida sem erros.\\n");',
        '            imprimir_ast(raiz, 0);',
        '        }',
        '    }',
        '',
        '    return resultado;',
        '}'
      ],
      annotations: {
        6: {
          title: "Símbolos Externos gerados pelo Bison",
          text: "yyparse() é a função gerada pelo Bison que inicia o parsing LALR(1). A variável global No *raiz recebe a raiz da árvore construída.",
          theory: "extern em C indica que o símbolo está definido em outra unidade de compilação (neste caso, em grammar.y / grammar.tab.c)."
        },
        10: {
          title: "Execução do Parser e Verificação de Erro",
          text: "yyparse() retorna 0 em caso de sucesso e 1 se houver erro sintático. Se for 0 e raiz != NULL, o programa está validado.",
          theory: "Controle de Fluxo CLI: As flags --py geram diretamente o código Python e --ast exibem a representação em árvore textual."
        }
      }
    },

    "src/gerador.c": {
      name: "gerador.c",
      path: "src/gerador.c",
      language: "c",
      module: "gerador",
      author: "Ruan & Lucas",
      summary: "Motor de tradução da AST para código Python. Converte escopos de chaves para 4 espaços de indentação, traduz operadores e desdobra laços for em while.",
      linesCount: 185,
      dependencies: ["src/gerador.h", "src/ast.h", "<stdio.h>", "<string.h>"],
      dependents: ["src/main.c", "tests/teste_gerador.c"],
      code: [
        '#include <stdio.h>',
        '#include <string.h>',
        '#include "gerador.h"',
        '',
        'static void gerar_codigo_nivel(const No *raiz, FILE *saida, int nivel);',
        '',
        'static void emitir_indentacao(FILE *saida, int nivel) {',
        '    for (int i = 0; i < nivel; i++) {',
        '        fputs("    ", saida);',
        '    }',
        '}',
        '',
        'static const char *converter_operador(const char *op) {',
        '    if (!op) return "";',
        '    if (strcmp(op, "&&") == 0) return "and";',
        '    if (strcmp(op, "||") == 0) return "or";',
        '    if (strcmp(op, "===") == 0) return "==";',
        '    if (strcmp(op, "!==") == 0) return "!=";',
        '    if (strcmp(op, "!") == 0) return "not ";',
        '    return op;',
        '}',
        '',
        'static void emitir_corpo(const No *corpo, FILE *saida, int nivel) {',
        '    if (corpo && (corpo->contador_filhos > 0 || strcmp(corpo->tipo, "bloco") != 0)) {',
        '        gerar_codigo_nivel(corpo, saida, nivel + 1);',
        '    } else {',
        '        emitir_indentacao(saida, nivel + 1);',
        '        fputs("pass\\n", saida);',
        '    }',
        '}',
        '',
        'static void gerar_expressao(const No *raiz, FILE *saida) {',
        '    if (!raiz || !raiz->tipo) return;',
        '',
        '    /* Booleanos e Nulo */',
        '    if (strcmp(raiz->tipo, "bool") == 0 || strcmp(raiz->tipo, "TRUE") == 0 || strcmp(raiz->tipo, "FALSE") == 0) {',
        '        if ((raiz->valor && (strcmp(raiz->valor, "false") == 0 || strcmp(raiz->valor, "FALSE") == 0)) ||',
        '            strcmp(raiz->tipo, "FALSE") == 0) {',
        '            fputs("False", saida);',
        '        } else {',
        '            fputs("True", saida);',
        '        }',
        '        return;',
        '    }',
        '    if (strcmp(raiz->tipo, "null") == 0 || strcmp(raiz->tipo, "VAZIO") == 0) {',
        '        fputs("None", saida);',
        '        return;',
        '    }',
        '',
        '    /* Chamadas: console.log vira print */',
        '    if (strcmp(raiz->tipo, "chamada") == 0) {',
        '        int eh_log = raiz->valor && (strcmp(raiz->valor, "console.log") == 0 || strcmp(raiz->valor, "log") == 0);',
        '        fputs(eh_log ? "print(" : (raiz->valor ? raiz->valor : "func"), saida);',
        '        if (!eh_log) fputs("(", saida);',
        '        for (int i = 0; i < raiz->contador_filhos; i++) {',
        '            if (i > 0) fputs(", ", saida);',
        '            gerar_expressao(raiz->filhos[i], saida);',
        '        }',
        '        fputs(")", saida);',
        '        return;',
        '    }',
        '',
        '    /* Operacoes unarias (!, -, ++) */',
        '    if (strcmp(raiz->tipo, "unop") == 0) {',
        '        if (raiz->valor && strcmp(raiz->valor, "++") != 0 && strcmp(raiz->valor, "--") != 0) {',
        '            fputs(converter_operador(raiz->valor), saida);',
        '        }',
        '        if (raiz->contador_filhos > 0) {',
        '            gerar_expressao(raiz->filhos[0], saida);',
        '        }',
        '        return;',
        '    }',
        '',
        '    /* Operacao binaria */',
        '    if (raiz->contador_filhos >= 2 && strcmp(raiz->tipo, "atribuicao") != 0 && strcmp(raiz->tipo, "=") != 0) {',
        '        gerar_expressao(raiz->filhos[0], saida);',
        '        fprintf(saida, " %s ", converter_operador(raiz->valor ? raiz->valor : raiz->tipo));',
        '        gerar_expressao(raiz->filhos[1], saida);',
        '        return;',
        '    }',
        '',
        '    if (raiz->valor) {',
        '        fputs(raiz->valor, saida);',
        '    }',
        '}'
      ],
      annotations: {
        7: {
          title: "emitir_indentacao(): Gerador de Escopo Python",
          text: "Emite 4 espaços para cada nível de aninhamento. Como Python é dependente de indentação (off-side rule), este controle substitui as chaves {} do JavaScript.",
          theory: "Python não usa delimitadores de bloco explícitos. O nível de indentação é mantido pelo parâmetro inteiro 'nivel' que incrementa a cada bloco/função/condicional."
        },
        13: {
          title: "converter_operador(): Mapeamento Semântico",
          text: "Converte operadores sintáticos de JS para equivalentes em Python: '&&' vira 'and', '||' vira 'or', '===' vira '==', '!==' vira '!=' e '!' vira 'not '.",
          theory: "Python utiliza palavras-chave legíveis para operadores lógicos em vez de símbolos estilizados de C/JS."
        },
        23: {
          title: "emitir_corpo(): Tratamento de Blocos Vazios",
          text: "Se um bloco em JavaScript for vazio ({}), em Python não se pode deixar a linha sem corpo. A função emite a instrução 'pass'.",
          theory: "Garante conformidade com a sintaxe obrigatória do Python em blocos vazios."
        },
        51: {
          title: "Tradução de Chamadas e console.log",
          text: "Verifica se a chamada é 'console.log' ou 'log'. Se for, traduz para 'print(...)', mapeando os argumentos da lista.",
          theory: "Mapeamento de biblioteca padrão: JavaScript usa o objeto console com método log; Python usa a built-in function print()."
        }
      }
    },

    "src/grammar.y": {
      name: "grammar.y",
      path: "src/grammar.y",
      language: "yacc",
      module: "parser",
      author: "Israel",
      summary: "Gramática formal LALR(1) em Bison. Define precedência de operadores, tipos semânticos na %union e ações em C que instanciam os nós da AST.",
      linesCount: 353,
      dependencies: ["src/ast.h", "src/lexico.l"],
      dependents: ["src/main.c", "build/grammar.tab.c", "build/grammar.tab.h"],
      code: [
        '%{',
        '#include <stdio.h>',
        '#include <stdlib.h>',
        '#include <string.h>',
        '#include "ast.h"',
        '',
        'int yylex(void);',
        'extern int yylineno;',
        'void yyerror(const char *s);',
        '',
        'No *raiz = NULL;',
        '',
        'static No *criar_binop(const char *op, No *esq, No *dir) {',
        '    No *no = novo_ponteiro("binop", op, yylineno);',
        '    adicionar_filho(no, esq);',
        '    adicionar_filho(no, dir);',
        '    return no;',
        '}',
        '%}',
        '',
        '%union {',
        '    char *str;',
        '    No *no;',
        '}',
        '',
        '%token LET CONST VAR FUNCTION',
        '%token TRUE FALSE VAZIO',
        '%token IF ELSE WHILE FOR RETORNO',
        '%token ADICAO SUBTRACAO MULTIPLICACAO DIVISAO',
        '%token IGUALDADE DIFERENTE IGUALDADE_ESTRITA DIFERENCA_ESTRITA',
        '%token <str> IDENTIFICADOR NUMERO STRING',
        '',
        '%type <no> programa lista_statements statement bloco',
        '%type <no> declaracao_var expressao_statement statement_if statement_while',
        '%type <no> expressao',
        '',
        '/* Precedência */',
        '%right ATRIBUICAO',
        '%left OR',
        '%left AND',
        '%left IGUALDADE DIFERENTE IGUALDADE_ESTRITA DIFERENCA_ESTRITA',
        '%left ADICAO SUBTRACAO',
        '%left MULTIPLICACAO DIVISAO',
        '',
        '%%',
        'programa',
        '    : lista_statements {',
        '        raiz = $1;',
        '        $$ = $1;',
        '    }',
        '    ;',
        '%%'
      ],
      annotations: {
        20: {
          title: "%union: Tipos Semânticos de Tokens e Regras",
          text: "Define os tipos possíveis de dados retornados: char *str (para literais e identificadores) e No *no (para nós da AST).",
          theory: "Permite que $1, $2, $$ tenham tipagem forte em C dentro do parser LALR(1)."
        },
        37: {
          title: "Precedência e Associatividade de Operadores",
          text: "Resolve ambiguidades gramaticais. Linhas mais abaixo têm maior precedência (* e / antes de + e -).",
          theory: "%left indica associatividade à esquerda (ex: 10 - 5 - 2 vira ((10-5)-2)). Evita conflitos shift/reduce clássicos em expressões matemáticas."
        },
        47: {
          title: "Conexão com a Raiz Global (raiz = $1)",
          text: "A regra de entrada programa recebe lista_statements e atribui à variável global raiz, disponibilizando a AST inteira para o main.c.",
          theory: "Ação semântica executada ao concluir a derivação sintática com sucesso."
        }
      }
    },

    "src/lexico.l": {
      name: "lexico.l",
      path: "src/lexico.l",
      language: "lex",
      module: "parser",
      author: "Israel",
      summary: "Especificação léxica em Flex. Mapeia palavras reservadas, operadores, literais e identificadores em tokens com suporte a rastreio de linhas.",
      linesCount: 71,
      dependencies: ["src/grammar.tab.h", "src/ast.h"],
      dependents: ["src/grammar.y", "build/lex.yy.c"],
      code: [
        '%option yylineno',
        '%option noyywrap',
        '%{',
        '    #include <stdio.h>',
        '    #include <string.h>',
        '    #include "ast.h"',
        '    #include "grammar.tab.h"',
        '%}',
        '',
        '%%',
        '"let"           { return LET; }',
        '"const"         { return CONST; }',
        '"var"           { return VAR; }',
        '"function"      { return FUNCTION; }',
        '"==="           { return IGUALDADE_ESTRITA; }',
        '"!=="           { return DIFERENCA_ESTRITA; }',
        '"=="            { return IGUALDADE; }',
        '"return"        { return RETORNO; }',
        '"if"            { return IF; }',
        '"else"          { return ELSE; }',
        '"&&"            { return AND; }',
        '"||"            { return OR; }',
        '"++"            { return INCREMENTO; }',
        '"--"            { return DECREMENTO; }',
        '"+="            { return MAIS_IGUAL; }',
        '"-="            { return MENOS_IGUAL; }',
        '"+"             { return ADICAO; }',
        '"-"             { return SUBTRACAO; }',
        '"*"             { return MULTIPLICACAO; }',
        '"/"             { return DIVISAO; }',
        '"="             { return ATRIBUICAO; }',
        '"//"[^\\n]*     { /* ignora comentário de linha */ }',
        '"/*"([^*]|\\*+[^*/])*\\*+"/" { /* ignora comentário de bloco */ }',
        '',
        '[a-zA-Z_][a-zA-Z0-9_]* { yylval.str = strdup(yytext); return IDENTIFICADOR; }',
        '[0-9]+                  { yylval.str = strdup(yytext); return NUMERO; }',
        '\'[^\']*\'                 { yylval.str = strdup(yytext); return STRING; }',
        '\\"[^\\"]*\\"              { yylval.str = strdup(yytext); return STRING; }',
        '[ \\t\\r\\n]+              { /* ignora espaços */ }',
        '.                       { printf("Erro léxico: caractere desconhecido: \'%s\'\\n", yytext); }',
        '%%'
      ],
      annotations: {
        1: {
          title: "%option yylineno: Rastreio Automático de Linhas",
          text: "Faz com que o Flex atualize automaticamente a variável global yylineno a cada quebra de linha.",
          theory: "Fundamental para relatar mensagens de erro léxico, sintático e registrar a linha exata de cada nó na AST."
        },
        11: {
          title: "Palavras-chave antes de Identificadores (Regra do Primeiro Casamento)",
          text: "Palavras como 'let', 'const' e 'if' aparecem antes da regex de identificador. Pelo desempate do Flex, ganham prioridade.",
          theory: "Se a regex de identificador viesse antes, a palavra 'let' casaria como identificador e nunca viraria o token LET."
        },
        34: {
          title: "yylval.str = strdup(yytext): Passagem de Valor Semântico",
          text: "Para tokens que carregam valor (identificadores, números e strings), aloca uma cópia do texto com strdup e guarda em yylval.str.",
          theory: "yytext é um ponteiro temporário gerenciado pelo buffer do Flex. Se não fizesse strdup, o texto seria sobrescrito no próximo token lido."
        }
      }
    },

    "src/tabela.c": {
      name: "tabela.c",
      path: "src/tabela.c",
      language: "c",
      module: "tabela",
      author: "Jorge",
      summary: "Estrutura de dados para a Tabela de Símbolos com suporte a escopos aninhados (pilha de escopos até MAX_ESCOPOS=64), busca e inserção de variáveis/funções.",
      linesCount: 91,
      dependencies: ["src/tabela.h", "<stdlib.h>", "<string.h>", "<stdio.h>"],
      dependents: ["tests/teste_tabela.c"],
      code: [
        '#include <stdlib.h>',
        '#include <string.h>',
        '#include <stdio.h>',
        '#include "tabela.h"',
        '',
        '#define MAX_ESCOPOS 64',
        '',
        'static Simbolo *escopos[MAX_ESCOPOS];',
        'static int topo = -1;   /* -1 = nenhum escopo aberto */',
        '',
        'void abrir_escopo(void){',
        '    if (topo + 1 >= MAX_ESCOPOS){',
        '        fprintf(stderr, "Erro: limite de %d escopos atingido\\n", MAX_ESCOPOS);',
        '        exit(1);',
        '    }',
        '    topo++;',
        '    escopos[topo] = NULL;',
        '}',
        '',
        'void fechar_escopo(void){',
        '    if (topo < 0) return;',
        '    Simbolo *atual = escopos[topo];',
        '    while (atual != NULL){',
        '        Simbolo *prox = atual->prox;',
        '        free(atual->nome);',
        '        free(atual->categoria);',
        '        free(atual->tipo);',
        '        free(atual);',
        '        atual = prox;',
        '    }',
        '    escopos[topo] = NULL;',
        '    topo--;',
        '}',
        '',
        'void inserir(const char *nome, const char *categoria, const char *tipo, int constante, int linha){',
        '    Simbolo *s = malloc(sizeof(Simbolo));',
        '    s->nome = strdup(nome);',
        '    s->categoria = strdup(categoria);',
        '    s->tipo = strdup(tipo);',
        '    s->constante = constante;',
        '    s->n_params = 0;',
        '    s->linha = linha;',
        '    s->prox = escopos[topo];',
        '    escopos[topo] = s;',
        '}',
        '',
        'Simbolo *buscar(const char *nome){',
        '    for (int i = topo; i >= 0; i--){',
        '        for (Simbolo *s = escopos[i]; s != NULL; s = s->prox){',
        '            if (strcmp(s->nome, nome) == 0) return s;',
        '        }',
        '    }',
        '    return NULL;',
        '}'
      ],
      annotations: {
        8: {
          title: "Pilha Estática de Escopos Encadeados",
          text: "Array estático de até 64 escopos aninhados. Cada nível de escopo contém uma lista ligada de Simbolo*.",
          theory: "Permite sombreamento de variáveis (shadowing): uma variável com mesmo nome em escopo interno sobrepõe a variável do escopo externo enquanto o escopo estiver aberto."
        },
        11: {
          title: "abrir_escopo() e fechar_escopo()",
          text: "abrir_escopo incrementa o topo da pilha ao entrar em um bloco ou função. fechar_escopo desaloca todos os símbolos declarados naquele bloco.",
          theory: "Gerenciamento dinâmico de escopo léxico clássico em compiladores."
        },
        47: {
          title: "buscar(): Resolução de Nomes do Topo à Base",
          text: "Procura o símbolo iterando do escopo atual (topo) em direção ao escopo global (índice 0).",
          theory: "Garante que o escopo mais interno tenha precedência sobre escopos superiores na resolução de variáveis."
        }
      }
    },

    "src/1o_codigo.js": {
      name: "1o_codigo.js",
      path: "src/1o_codigo.js",
      language: "javascript",
      module: "testes",
      author: "Equipe",
      summary: "Caso de teste real demonstrando declaração de funções, cálculo aritmético, condicionais com if/else, laço for e console.log.",
      linesCount: 22,
      dependencies: [],
      dependents: ["compilador.exe"],
      code: [
        'function calcularArea(largura, altura) {',
        '  let area = largura * altura;',
        '  return area;',
        '}',
        '',
        'let ativo = true;',
        'let nome = "retângulo";',
        'let contador = 0;',
        '',
        'if (ativo == true && contador <= 10) {',
        '  contador++;',
        '} else {',
        '  contador--;',
        '}',
        '',
        'let total = 100;',
        'total += 50;',
        'total -= 20;',
        '',
        'for (let i = 0; i < 5; i++) {',
        '  console.log(i);',
        '}'
      ],
      annotations: {
        1: {
          title: "Função e Declaração de Parâmetros",
          text: "Em Python vira 'def calcularArea(largura, altura):', criando bloco indentado.",
          theory: "Mapeamento direto de assinatura de função imperativa."
        },
        10: {
          title: "Condicional com Operador Lógico '&&'",
          text: "Em Python é traduzido para 'if ativo == True and contador <= 10:'.",
          theory: "Demonstra a conversão de operador de && para and e booleano true para True."
        },
        20: {
          title: "Desdobramento do Laço for para while",
          text: "Em Python, o compilador traduz for (let i = 0; i < 5; i++) para uma inicialização 'i = 0' seguida de 'while i < 5:' e incremento 'i += 1' ao final do corpo.",
          theory: "Como JavaScript suporta for-estilo-C de 3 seções e Python possui apenas for..in iterador, a estratégia semântica do compilador é transladar para um laço while equivalente."
        }
      }
    }
  },

  learningTopics: [
    {
      id: "tokens",
      title: "1. Tabela Completa de Tokens & Léxico (Flex)",
      sourceDoc: "linguagem.md",
      desc: "Especificação rigorosa dos 40+ tokens aceitos pelo compilador, ordem das expressões regulares e regras de desambiguação.",
      content: `
### Especificação da Linguagem (Subconjunto de JavaScript)

Tokens na ordem em que aparecem em \`src/lexico.l\`. Quando duas regras reconhecem o mesmo trecho, o Flex escolhe o **casamento mais longo** (*longest match*); se houver empate de comprimento, vence a regra que aparece **primeiro** no arquivo.

| Token | Expressão Regular | Exemplo | Finalidade |
|---|---|---|---|
| \`LET\` | \`"let"\` | \`let\` | Declaração de variável mutável |
| \`CONST\` | \`"const"\` | \`const\` | Declaração de constante |
| \`VAR\` | \`"var"\` | \`var\` | Declaração legada compatível |
| \`FUNCTION\` | \`"function"\` | \`function\` | Declaração de função |
| \`IF\` / \`ELSE\` | \`"if"\` / \`"else"\` | \`if\` / \`else\` | Controle condicional |
| \`WHILE\` / \`FOR\` | \`"while"\` / \`"for"\` | \`while\` / \`for\` | Estruturas de repetição |
| \`RETORNO\` | \`"return"\` | \`return\` | Retorno de função |
| \`TRUE\` / \`FALSE\` | \`"true"\` / \`"false"\` | \`true\` / \`false\` | Literais booleanos |
| \`VAZIO\` | \`"null"\` | \`null\` | Literal nulo (None em Python) |
| \`IGUALDADE_ESTRITA\` | \`"==="\` | \`===\` | Compara valor e tipo (vira == em Py) |
| \`DIFERENCA_ESTRITA\` | \`"!=="\` | \`!==\` | Diferença estrita (vira != em Py) |
| \`AND\` / \`OR\` | \`"&&"\` / \`"\\|\\|"\` | \`&&\` / \`\\|\\|\` | Operadores lógicos (and / or) |
| \`INCREMENTO\` | \`"++"\` | \`++\` | Pós/pré incremento (vira += 1) |
| \`DECREMENTO\` | \`"--"\` | \`--\` | Pós/pré decremento (vira -= 1) |
| \`IDENTIFICADOR\` | \`[a-zA-Z_][a-zA-Z0-9_]*\` | \`calcularArea\` | Nomes de variáveis e funções |
| \`NUMERO\` | \`[0-9]+\` | \`100\` | Literais inteiros |
| \`STRING\` | \`'[^']*'\\|"([^"]*)"\` | \`"retângulo"\` | Literais de texto |
      `
    },
    {
      id: "flex-bison",
      title: "2. Como Flex e Bison se Comunicam",
      sourceDoc: "estudo_bison.md & estudo_bison2.md",
      desc: "O protocolo de integração entre analisador léxico e sintático através de tokens, union e yylval.",
      content: `
### O Ponto de Encontro: \`grammar.tab.h\` e \`yylval\`

O Flex não envia texto cru para o Bison. O Bison gera um cabeçalho chamado \`grammar.tab.h\` que atribui um número inteiro para cada token (\`LET = 258\`, \`NUMERO = 259\`, etc.).

\`\`\`
  src/lexico.l                       src/grammar.y
┌─────────────────────────┐   gera   ┌──────────────────────────┐
│ #include "grammar.tab.h"│ ◄─────── │ %token LET NUMERO ...    │
│                         │          │ %union { char *str; ... }│
│ "let"   { return LET; } │          └──────────────────────────┘
│ [0-9]+  {               │                       │ bison -d
│   yylval.str = strdup();│                       ▼
│   return NUMERO;        │             grammar.tab.h (códigos)
│ }                       │             grammar.tab.c (motor)
└─────────────────────────┘
\`\`\`

#### Por que precisamos de \`yylval\`?
Quando o Flex encontra o texto \`"100"\`, ele devolve o código do token \`NUMERO\` pelo retorno da função \`yylex()\`. Mas **qual número era esse?**
O valor semântico precisa ser transportado através da variável global **\`yylval\`**, tipada pela declaração \`%union\` do Bison.
      `
    },
    {
      id: "lalr-conflitos",
      title: "3. Gramática LALR(1), Precedência e Conflitos",
      sourceDoc: "estudo_bison.md",
      desc: "Como o algoritmo LALR(1) resolve precedência de operadores e elimina conflitos shift/reduce e dangling else.",
      content: `
### Precedência e Resolução de Conflitos

Em expressões como \`2 + 3 * 4\`, a gramática seria ambígua sem regras de precedência. O Bison resolve isso através das diretivas:

\`\`\`c
%right ATRIBUICAO MAIS_IGUAL MENOS_IGUAL
%left OR
%left AND
%left IGUALDADE DIFERENTE IGUALDADE_ESTRITA
%left ADICAO SUBTRACAO
%left MULTIPLICACAO DIVISAO
%right NEGACAO INCREMENTO DECREMENTO
\`\`\`

* **Ordem de linhas:** Linhas mais abaixo possuem **maior precedência** (\`*\` tem prioridade sobre \`+\`).
* **%left:** O operador associa à esquerda: \`10 - 5 - 2\` vira \`(10 - 5) - 2\`.
* **%right:** O operador associa à direita: \`a = b = 10\` vira \`a = (b = 10)\`.
* **Dangling Else:** Quando temos \`if (a) if (b) c(); else d();\`, o Bison resolve o conflito shift/reduce associando o \`else\` ao \`if\` mais próximo (comportamento padrão de JavaScript).
      `
    },
    {
      id: "ast-memoria",
      title: "4. Gestão de Memória em C e Árvore (AST)",
      sourceDoc: "explicacao_AST.md",
      desc: "Ponteiros duplos, malloc, realloc, strdup e a ordem de desalocação em pós-ordem com free.",
      content: `
### Arquitetura de Memória da AST (\`src/ast.c\`)

Ao contrário de linguagens com Garbage Collection (como Python e JavaScript), o compilador em C precisa gerenciar sua própria memória.

1. **Alocação Base (\`malloc\`):** \`malloc(sizeof(No))\` aloca apenas a struct descritora com seus ponteiros.
2. **Duplicação Segura (\`strdup\`):** Strings de tokens vindas do Flex são duplicadas na heap. Isso garante que o nó mantenha sua string mesmo após o buffer léxico ser reaproveitado.
3. **Array Dinâmico de Filhos (\`realloc\`):** \`No **filhos\` cresce dinamicamente conforme novos ramos são adicionados:
\`pai->filhos = realloc(pai->filhos, pai->contador_filhos * sizeof(No *));\`
4. **Desalocação em Pós-Ordem (\`free\`):**
\`\`\`c
void liberar_ast(No *raiz) {
    if (raiz == NULL) return;
    for (int i = 0; i < raiz->contador_filhos; i++) {
        liberar_ast(raiz->filhos[i]); // 1. Primeiro libera os filhos
    }
    free(raiz->filhos);              // 2. Libera o vetor de ponteiros
    free(raiz->tipo);                // 3. Libera as strings clonadas
    free(raiz->valor);
    free(raiz);                      // 4. Por fim, libera o nó pai
}
\`\`\`
      `
    },
    {
      id: "transpilacao-desafios",
      title: "5. Desafios de Tradução: JavaScript → Python",
      sourceDoc: "estrutura_documento_inicial.md & gerador.c",
      desc: "Tradução de chaves para indentação, booleanos, laço for para while e mapeamento da biblioteca padrão.",
      content: `
### Desafios Arquiteturais de Transpilação

Um compilador fonte-a-fonte de JS para Python enfrenta divergências fundamentais de paradigma sintático:

1. **Off-side Rule (Indentação Obrigatória):** JavaScript ignora quebras de linha e usa \`{}\`. O gerador em C calcula um contador \`nivel\` e emite exatamente \`nivel * 4\` espaços antes de cada instrução.
2. **Blocos Vazios em Python:** Em JS, \`if (x) {}\` é válido. Em Python, \`if x:\` sem corpo gera erro de sintaxe. O gerador detecta nós vazios e injeta automaticamente a instrução \`pass\`.
3. **Desdobramento de \`for\` Clássico:**
   * JS: \`for (let i = 0; i < 5; i++) { ... }\`
   * Python não possui laço for com cláusula de inicialização, teste e passo estilo C.
   * **Solução no Gerador:** Desdobra a inicialização antes do laço, converte para \`while i < 5:\` e injeta \`i += 1\` ao final de cada iteração.
4. **Mapeamento de Console:** \`console.log(a, b)\` é reconhecido como nó do tipo \`chamada\` e traduzido diretamente para a função embutida \`print(a, b)\`.
      `
    }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PROJECT_DATA;
}
