#include <stdio.h>
#include <string.h>
#include "gerador.h"

static void comando(const No *no, FILE *saida, int nivel);

static int eh(const No *no, const char *tipo) {
    return no && strcmp(no->tipo, tipo) == 0;
}

static void indentar(FILE *saida, int nivel) {
    for (int i = 0; i < nivel; i++) fputs("    ", saida);
}

static void expressao(const No *no, FILE *saida) {
    if (!no) return;
    const char *valor = no->valor;
    if (eh(no, "bool")) {
        fputs(strcmp(valor, "true") == 0 ? "True" : "False", saida);
    } else if (eh(no, "null")) {
        fputs("None", saida);
    } else if (eh(no, "chamada")) {
        fprintf(saida, "%s(", strcmp(valor, "console.log") == 0 ? "__js_log" : valor);
        for (int i = 0; i < no->contador_filhos; i++) {
            if (i) fputs(", ", saida);
            expressao(no->filhos[i], saida);
        }
        fputs(")", saida);
    } else if (eh(no, "ternario")) {
        fputs("(", saida);
        expressao(no->filhos[1], saida);
        fputs(" if ", saida);
        expressao(no->filhos[0], saida);
        fputs(" else ", saida);
        expressao(no->filhos[2], saida);
        fputs(")", saida);
    } else if (eh(no, "index")) {
        expressao(no->filhos[0], saida);
        fputs("[", saida);
        expressao(no->filhos[1], saida);
        fputs("]", saida);
    } else if (eh(no, "unop")) {
        int incremento = strstr(valor, "++") != NULL;
        int decremento = strstr(valor, "--") != NULL;
        if (incremento || decremento) {
            fputs("(", saida);
            if (strncmp(valor, "post", 4) == 0) fputs("(", saida);
            expressao(no->filhos[0], saida);
            fputs(" := ", saida);
            expressao(no->filhos[0], saida);
            fprintf(saida, " %s 1)", incremento ? "+" : "-");
            if (strncmp(valor, "post", 4) == 0) fprintf(saida, " %s 1)", incremento ? "-" : "+");
        } else {
            fprintf(saida, "(%s", strcmp(valor, "!") == 0 ? "not " : valor);
            expressao(no->filhos[0], saida);
            fputs(")", saida);
        }
    } else if (eh(no, "binop")) {
        int estrita = strcmp(valor, "===") == 0 || strcmp(valor, "!==") == 0;
        if (estrita) {
            fputs(strcmp(valor, "!==") == 0 ? "(not __js_igual(" : "__js_igual(", saida);
            expressao(no->filhos[0], saida);
            fputs(", ", saida);
            expressao(no->filhos[1], saida);
            fputs(strcmp(valor, "!==") == 0 ? "))" : ")", saida);
        } else {
            const char *op = strcmp(valor, "&&") == 0 ? "and" : strcmp(valor, "||") == 0 ? "or" : valor;
            fputs("(", saida);
            expressao(no->filhos[0], saida);
            fprintf(saida, " %s ", op);
            expressao(no->filhos[1], saida);
            fputs(")", saida);
        }
    } else if (eh(no, "atribuicao")) {
        fputs("(", saida);
        expressao(no->filhos[0], saida);
        fputs(" := ", saida);
        if (strcmp(valor, "=") != 0) {
            expressao(no->filhos[0], saida);
            fprintf(saida, " %c ", valor[0]);
        }
        expressao(no->filhos[1], saida);
        fputs(")", saida);
    } else if (valor) {
        fputs(valor, saida);
    }
}

static void corpo(const No *no, FILE *saida, int nivel) {
    if (!no || (eh(no, "bloco") && no->contador_filhos == 0)) {
        indentar(saida, nivel + 1);
        fputs("pass\n", saida);
    } else {
        comando(no, saida, nivel + 1);
    }
}

static void comando(const No *no, FILE *saida, int nivel) {
    if (!no) return;
    if (eh(no, "lista_statements") || eh(no, "programa") || eh(no, "bloco")) {
        for (int i = 0; i < no->contador_filhos; i++)
            if (eh(no->filhos[i], "function")) comando(no->filhos[i], saida, nivel);
        for (int i = 0; i < no->contador_filhos; i++)
            if (!eh(no->filhos[i], "function")) comando(no->filhos[i], saida, nivel);
        return;
    }
    indentar(saida, nivel);
    if (eh(no, "function")) {
        fprintf(saida, "def %s(", no->valor);
        const No *params = no->filhos[0];
        for (int i = 0; i < params->contador_filhos; i++) {
            if (i) fputs(", ", saida);
            fputs(params->filhos[i]->valor, saida);
        }
        fputs("):\n", saida);
        corpo(no->filhos[1], saida, nivel);
    } else if (eh(no, "decl_var")) {
        fprintf(saida, "%s = ", no->valor);
        if (no->contador_filhos) expressao(no->filhos[0], saida);
        else fputs("None", saida);
        fputs("\n", saida);
    } else if (eh(no, "return")) {
        fputs("return", saida);
        if (no->contador_filhos) {
            fputs(" ", saida);
            expressao(no->filhos[0], saida);
        }
        fputs("\n", saida);
    } else if (eh(no, "if") || eh(no, "while")) {
        fprintf(saida, "%s ", no->tipo);
        expressao(no->filhos[0], saida);
        fputs(":\n", saida);
        corpo(no->filhos[1], saida, nivel);
        if (eh(no, "if") && no->contador_filhos == 3) {
            indentar(saida, nivel);
            fputs("else:\n", saida);
            corpo(no->filhos[2], saida, nivel);
        }
    } else if (eh(no, "for")) {
        fputs("\n", saida);
        if (!eh(no->filhos[0], "vazio")) comando(no->filhos[0], saida, nivel);
        indentar(saida, nivel);
        fputs("while ", saida);
        expressao(no->filhos[1], saida);
        fputs(":\n", saida);
        corpo(no->filhos[3], saida, nivel);
        comando(no->filhos[2], saida, nivel + 1);
    } else {
        expressao(no, saida);
        fputs("\n", saida);
    }
}

void gerar_codigo(const No *raiz, FILE *saida) {
    if (!saida) saida = stdout;
    fputs("def __js_log(*valores):\n"
          "    def texto(v):\n"
          "        if v is True: return 'true'\n"
          "        if v is False: return 'false'\n"
          "        if v is None: return 'null'\n"
          "        if isinstance(v, float) and v.is_integer(): return str(int(v))\n"
          "        return str(v)\n"
          "    print(*(texto(v) for v in valores))\n\n"
          "def __js_igual(a, b):\n"
          "    return type(a) is type(b) and a == b or type(a) in (int, float) and type(b) in (int, float) and a == b\n\n", saida);
    comando(raiz, saida, 0);
}
