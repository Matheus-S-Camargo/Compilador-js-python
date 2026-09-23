# Especificação da Linguagem — subconjunto de JavaScript

Este documento descreve o subconjunto de JavaScript aceito pelo compilador: os tokens reconhecidos pelo analisador léxico (`src/lexico.l`), a gramática reconhecida pelo analisador sintático (`src/grammar.y`), o escopo do projeto e exemplos de programas aceitos.

---

## 1. Tokens

Tokens na ordem em que aparecem em `src/lexico.l`. Quando duas regras reconhecem o mesmo trecho, o Flex escolhe o casamento mais longo; se houver empate, vence a regra que aparece primeiro. Por isso `let` vira `LET`, e não `IDENTIFICADOR`.

| Nome do token | Expressão regular | Exemplo |
|---|---|---|
| `LET` | `"let"` | `let` |
| `CONST` | `"const"` | `const` |
| `VAR` | `"var"` | `var` |
| `FUNCTION` | `"function"` | `function` |
| `ABRE_PARENTESES` | `"("` | `(` |
| `FECHA_PARENTESES` | `")"` | `)` |
| `ABRE_CHAVES` | `"{"` | `{` |
| `FECHA_CHAVES` | `"}"` | `}` |
| `DIFERENCA_ESTRITA` | `"!=="` | `!==` |
| `IGUALDADE_ESTRITA` | `"==="` | `===` |
| `DIFERENTE` | `"!="` | `!=` |
| `NEGACAO` | `"!"` | `!` |
| `RESTO_DIVISAO` | `"%"` | `%` |
| `ABRE_COLCHETES` | `"["` | `[` |
| `FECHA_COLCHETES` | `"]"` | `]` |
| `DOIS_PONTOS` | `":"` | `:` |
| `INTERROGACAO` | `"?"` | `?` |
| `TRUE` | `"true"` | `true` |
| `FALSE` | `"false"` | `false` |
| `IGUALDADE` | `"=="` | `==` |
| `PONTO_VIRGULA` | `";"` | `;` |
| `RETORNO` | `"return"` | `return` |
| `IF` | `"if"` | `if` |
| `ELSE` | `"else"` | `else` |
| `AND` | `"&&"` | `&&` |
| `OR` | `"\|\|"` | `\|\|` |
| `INCREMENTO` | `"++"` | `++` |
| `DECREMENTO` | `"--"` | `--` |
| `MAIS_IGUAL` | `"+="` | `+=` |
| `MENOS_IGUAL` | `"-="` | `-=` |
| `MULTIPLICACAO_IGUAL` | `"*="` | `*=` |
| `DIVISAO_IGUAL` | `"/="` | `/=` |
| `RESTO_IGUAL` | `"%="` | `%=` |
| `MENOR_IGUAL` | `"<="` | `<=` |
| `MAIOR_IGUAL` | `">="` | `>=` |
| `ADICAO` | `"+"` | `+` |
| `SUBTRACAO` | `"-"` | `-` |
| `MULTIPLICACAO` | `"*"` | `*` |
| *(comentário de linha, ignorado)* | `"//"[^\n]*` | `// comentário` |
| *(comentário de bloco, ignorado)* | `"/*"([^*]\|\*+[^*/])*\*+"/"` | `/* comentário */` |
| `DIVISAO` | `"/"` | `/` |
| `ATRIBUICAO` | `"="` | `=` |
| `MENOR` | `"<"` | `<` |
| `MAIOR` | `">"` | `>` |
| `FOR` | `"for"` | `for` |
| `PONTO` | `"."` | `.` |
| `VIRGULA` | `","` | `,` |
| `VAZIO` | `"null"` | `null` |
| `WHILE` | `"while"` | `while` |
| `IDENTIFICADOR` | `[a-zA-Z_][a-zA-Z0-9_]*` | `combustivel`, `_total`, `nave2` |
| `NUMERO` | `[0-9]+` | `100` |
| `STRING` (aspas simples) | `'[^']*'` | `'Tripulante ativo: '` |
| `STRING` (aspas duplas) | `\"[^\"]*\"` | `"Odisseia Estelar"` |
| *(espaços, ignorado)* | `[ \t\r\n]+` | espaço, tabulação, quebra de linha |
| *(erro léxico)* | `.` | `@` → `Erro léxico: caractere desconhecido: '@'` |

---

## 2. Gramática

Produções de `src/grammar.y` em BNF. Não-terminais aparecem entre `< >`, terminais são os nomes de token da Seção 1 e `ε` indica a produção vazia.

```bnf
<programa>            ::= <lista_statements>

<lista_statements>    ::= ε
                        | <lista_statements> <statement>

<statement>           ::= <declaracao_var>
                        | <expressao_statement>
                        | <statement_if>
                        | <statement_while>
                        | <statement_for>
                        | <statement_return>
                        | <declaracao_function>
                        | <bloco>

<bloco>               ::= ABRE_CHAVES <lista_statements> FECHA_CHAVES

<declaracao_var>      ::= <tipo_var> IDENTIFICADOR PONTO_VIRGULA
                        | <tipo_var> IDENTIFICADOR ATRIBUICAO <expressao> PONTO_VIRGULA

<tipo_var>            ::= LET
                        | CONST
                        | VAR

<expressao_statement> ::= <expressao> PONTO_VIRGULA

<statement_if>        ::= IF ABRE_PARENTESES <expressao> FECHA_PARENTESES <statement>
                        | IF ABRE_PARENTESES <expressao> FECHA_PARENTESES <statement> ELSE <statement>

<statement_while>     ::= WHILE ABRE_PARENTESES <expressao> FECHA_PARENTESES <statement>

<statement_for>       ::= FOR ABRE_PARENTESES <for_init> PONTO_VIRGULA <expressao> PONTO_VIRGULA <expressao> FECHA_PARENTESES <statement>

<for_init>            ::= ε
                        | <tipo_var> IDENTIFICADOR ATRIBUICAO <expressao>
                        | <expressao>

<statement_return>    ::= RETORNO PONTO_VIRGULA
                        | RETORNO <expressao> PONTO_VIRGULA

<declaracao_function> ::= FUNCTION IDENTIFICADOR ABRE_PARENTESES <lista_parametros> FECHA_PARENTESES <bloco>

<lista_parametros>    ::= ε
                        | IDENTIFICADOR
                        | <lista_parametros> VIRGULA IDENTIFICADOR

<expressao>           ::= <expressao> ATRIBUICAO <expressao>
                        | <expressao> MAIS_IGUAL <expressao>
                        | <expressao> MENOS_IGUAL <expressao>
                        | <expressao> MULTIPLICACAO_IGUAL <expressao>
                        | <expressao> DIVISAO_IGUAL <expressao>
                        | <expressao> RESTO_IGUAL <expressao>
                        | <expressao> OR <expressao>
                        | <expressao> AND <expressao>
                        | <expressao> IGUALDADE <expressao>
                        | <expressao> DIFERENTE <expressao>
                        | <expressao> IGUALDADE_ESTRITA <expressao>
                        | <expressao> DIFERENCA_ESTRITA <expressao>
                        | <expressao> MENOR <expressao>
                        | <expressao> MAIOR <expressao>
                        | <expressao> MENOR_IGUAL <expressao>
                        | <expressao> MAIOR_IGUAL <expressao>
                        | <expressao> ADICAO <expressao>
                        | <expressao> SUBTRACAO <expressao>
                        | <expressao> MULTIPLICACAO <expressao>
                        | <expressao> DIVISAO <expressao>
                        | <expressao> RESTO_DIVISAO <expressao>
                        | <expressao> INTERROGACAO <expressao> DOIS_PONTOS <expressao>
                        | NEGACAO <expressao>
                        | SUBTRACAO <expressao>
                        | INCREMENTO <expressao>
                        | DECREMENTO <expressao>
                        | <expressao> INCREMENTO
                        | <expressao> DECREMENTO
                        | <expressao> PONTO IDENTIFICADOR
                        | <expressao> PONTO IDENTIFICADOR ABRE_PARENTESES <lista_argumentos> FECHA_PARENTESES
                        | IDENTIFICADOR ABRE_PARENTESES <lista_argumentos> FECHA_PARENTESES
                        | <expressao> ABRE_COLCHETES <expressao> FECHA_COLCHETES
                        | ABRE_PARENTESES <expressao> FECHA_PARENTESES
                        | IDENTIFICADOR
                        | NUMERO
                        | STRING
                        | TRUE
                        | FALSE
                        | VAZIO

<lista_argumentos>    ::= ε
                        | <expressao>
                        | <lista_argumentos> VIRGULA <expressao>
```

### Precedência e associatividade

A regra `<expressao>` é ambígua. As declarações `%left`/`%right` do `grammar.y` resolvem essa ambiguidade. Na tabela, a precedência cresce de cima para baixo:

| Nível | Operadores | Associatividade |
|---|---|---|
| 1 | `=` `+=` `-=` `*=` `/=` `%=` | direita |
| 2 | `? :` | direita |
| 3 | `\|\|` | esquerda |
| 4 | `&&` | esquerda |
| 5 | `==` `!=` `===` `!==` | esquerda |
| 6 | `<` `>` `<=` `>=` | esquerda |
| 7 | `+` `-` | esquerda |
| 8 | `*` `/` `%` | esquerda |
| 9 | `!` e `-` unário | direita |
| 10 | `++` `--` | direita |
| 11 | `(` `[` `.` (chamada, índice, membro) | esquerda |

A gramática tem **1 conflito shift/reduce**, o do *dangling else* em `if (a) if (b) x; else y;`. O Bison resolve esse conflito com *shift*, e assim o `else` fica com o `if` mais próximo, como no JavaScript.

---

## 3. Escopo

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

---

## 4. Exemplos

Os três programas abaixo são aceitos pelo analisador sintático sem erros.

### Exemplo 1 — funções, `if`/`else` e `for` (`src/1o_codigo.js`)

```javascript
function calcularArea(largura, altura) {
  let area = largura * altura;
  return area;
}

let ativo = true;
let nome = "retângulo";
let contador = 0;

if (ativo == true && contador <= 10) {
  contador++;
} else {
  contador--;
}

let total = 100;
total += 50;
total -= 20;

for (let i = 0; i < 5; i++) {
  console.log(i);
}
```

### Exemplo 2 — atribuições compostas (`src/teste_compostos.js`)

```javascript
let a = 10;
a *= 2;
a /= 3;
a %= 4;
a += 1;
a -= 1;

function ajustar(x) {
    let total = x;
    for (let i = 0; i < 5; i++) {
        total *= 2;
        if (total % 2 === 0) {
            total /= 2;
        }
        total %= 100;
    }
    return total;
}
```

### Exemplo 3 — `else if`, `while`, membros, índices e ternário (trecho de `src/3o_codigo.js`)

```javascript
function ativarPropulsores(potencia) {
  if (potencia >= 80 && potencia <= 100) {
    return true;
  } else if (potencia < 80 || potencia == 0) {
    return false;
  }
  return null;
}

while (combustivel > 0 && !emergencia) {
  combustivel--;

  if (combustivel % 10 == 0) {
    console.log(combustivel);
  }
}

let painel = nave.status;
let coordenadas = nave.getCoordenadas(0, 1, 2);
let primeiroTripulante = tripulantes[0];
let alertaCritico = combustivel < 10 ? true : false;
```
