#include <stdarg.h>
#include <stdio.h>
#include <string.h>
#include "semantica.h"
#include "tabela.h"

static int erros = 0;

// nomes globais do javascript que o programa pode usar sem declarar.
static const char *pre_definidos[] = { "console", NULL };

static void erro_semantico(int linha, const char *formato, ...){
    va_list args;
    va_start(args, formato);
    fprintf(stderr, "Erro semantico na linha %d: ", linha);
    vfprintf(stderr, formato, args);
    fprintf(stderr, "\n");
    va_end(args);
    erros++;
}

// tipo aproximado a partir do valor inicial. 
static const char *tipo_do_valor(No *valor){
    if (valor == NULL)                     return "desconhecido";
    if (strcmp(valor->tipo, "NUMERO") == 0) return "num";
    if (strcmp(valor->tipo, "STRING") == 0) return "str";
    if (strcmp(valor->tipo, "BOOL") == 0)   return "bool";
    if (strcmp(valor->tipo, "NULO") == 0)   return "null";
    return "desconhecido";
}

static void visitar(No *no);

static void visitar_filhos(No *no){
    for (int i = 0; i < no->contador_filhos; i++){
        visitar(no->filhos[i]);
    }
}

static void visitar_declaracao(No *no){
    No *ident = no->filhos[0];
    No *valor = no->contador_filhos > 1 ? no->filhos[1] : NULL;

    visitar(valor);

    Simbolo *anterior = buscar_escopo_atual(ident->valor);
    if (anterior != NULL){
        erro_semantico(ident->linha, "'%s' redeclarada no mesmo escopo (declarada antes na linha %d)",
                       ident->valor, anterior->linha);
        return;
    }
    inserir(ident->valor, "variavel", tipo_do_valor(valor),
            strcmp(no->valor, "const") == 0, ident->linha);
}

static void visitar(No *no){
    if (no == NULL){
        return;   // partes da gramatica que ainda nao geram AST 
    }

    if (strcmp(no->tipo, "DECL_VAR") == 0){
        visitar_declaracao(no);
    } else if (strcmp(no->tipo, "IDENT") == 0){
        if (buscar(no->valor) == NULL){
            erro_semantico(no->linha, "variavel '%s' nao declarada", no->valor);
        }
    } else if (strcmp(no->tipo, "BLOCO") == 0){
        abrir_escopo();
        visitar_filhos(no);
        fechar_escopo();
    } else {
        visitar_filhos(no);
    }
}

int analisar(No *raiz){
    erros = 0;
    abrir_escopo(); 
    for (int i = 0; pre_definidos[i] != NULL; i++){
        inserir(pre_definidos[i], "objeto", "desconhecido", 1, 0);
    }
    visitar(raiz);
    fechar_escopo();
    return erros;
}
