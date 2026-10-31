#include <ctype.h>
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

// tipo aproximado a partir do valor inicial 
static const char *tipo_do_valor(No *valor){
    if (valor == NULL)                   return "desconhecido";
    if (strcmp(valor->tipo, "num") == 0)  return "num";
    if (strcmp(valor->tipo, "str") == 0)  return "str";
    if (strcmp(valor->tipo, "bool") == 0) return "bool";
    if (strcmp(valor->tipo, "null") == 0) return "null";
    return "desconhecido";
}

static void verificar_uso(const char *nome, int linha){
    if (buscar(nome) == NULL){
        erro_semantico(linha, "variavel '%s' nao declarada", nome);
    }
}

// insere no escopo atual; devolve 0 se o nome ja existia nele.
static int declarar(const char *nome, const char *categoria, const char *tipo, int linha){
    Simbolo *anterior = buscar_escopo_atual(nome);
    if (anterior != NULL){
        erro_semantico(linha, "'%s' redeclarada no mesmo escopo (declarada antes na linha %d)",
                       nome, anterior->linha);
        return 0;
    }
    inserir(nome, categoria, tipo, 0, linha);
    return 1;
}

static void visitar(No *no);

static void visitar_filhos(No *no){
    for (int i = 0; i < no->contador_filhos; i++){
        visitar(no->filhos[i]);
    }
}

static void visitar_declaracao(No *no){
    No *valor = no->contador_filhos > 0 ? no->filhos[0] : NULL;

    visitar(valor);
    declarar(no->valor, "variavel", tipo_do_valor(valor), no->linha);
}

static void declarar_funcoes(No *lista){
    for (int i = 0; i < lista->contador_filhos; i++){
        No *filho = lista->filhos[i];
        if (filho == NULL || strcmp(filho->tipo, "function") != 0){
            continue;
        }
        if (declarar(filho->valor, "funcao", "desconhecido", filho->linha)){
            buscar_escopo_atual(filho->valor)->n_params = filho->filhos[0]->contador_filhos;
        }
    }
}

static void visitar_funcao(No *no){
    No *params = no->filhos[0];
    No *corpo = no->filhos[1];

    abrir_escopo();
    for (int i = 0; i < params->contador_filhos; i++){
        No *p = params->filhos[i];
        declarar(p->valor, "parametro", "desconhecido", p->linha);
    }
    declarar_funcoes(corpo);
    visitar_filhos(corpo);
    fechar_escopo();
}

static int eh_identificador(const char *s, size_t n){
    if (n == 0 || !(isalpha((unsigned char)s[0]) || s[0] == '_' || s[0] == '$')){
        return 0;
    }
    for (size_t i = 1; i < n; i++){
        if (!(isalnum((unsigned char)s[i]) || s[i] == '_' || s[i] == '$')){
            return 0;
        }
    }
    return 1;
}

static void verificar_nome_base(No *no){
    if (no->valor == NULL){
        return;
    }
    size_t n = strcspn(no->valor, ".");
    if (!eh_identificador(no->valor, n)){
        return;
    }
    char nome[256];
    snprintf(nome, sizeof(nome), "%.*s", (int)n, no->valor);
    verificar_uso(nome, no->linha);
}

static void visitar(No *no){
    if (no == NULL){
        return;   // partes da gramatica que ainda nao geram AST
    }

    if (strcmp(no->tipo, "decl_var") == 0){
        visitar_declaracao(no);
    } else if (strcmp(no->tipo, "id") == 0){
        verificar_uso(no->valor, no->linha);
    } else if (strcmp(no->tipo, "chamada") == 0){
        verificar_nome_base(no);
        visitar_filhos(no);
    } else if (strcmp(no->tipo, "membro") == 0){
        // o filho e o objeto (id, outro membro...), a propriedade nao e checada.
        visitar_filhos(no);
    } else if (strcmp(no->tipo, "function") == 0){
        visitar_funcao(no);
    } else if (strcmp(no->tipo, "bloco") == 0){
        abrir_escopo();
        declarar_funcoes(no);
        visitar_filhos(no);
        fechar_escopo();
    } else if (strcmp(no->tipo, "for") == 0){
        // o "let" do init vale so dentro do for.
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
    if (raiz != NULL){
        declarar_funcoes(raiz);
    }
    visitar(raiz);
    fechar_escopo();
    return erros;
}
