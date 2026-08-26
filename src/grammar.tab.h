/* A Bison parser, made by GNU Bison 3.8.2.  */

/* Bison interface for Yacc-like parsers in C

   Copyright (C) 1984, 1989-1990, 2000-2015, 2018-2021 Free Software Foundation,
   Inc.

   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <https://www.gnu.org/licenses/>.  */

/* As a special exception, you may create a larger work that contains
   part or all of the Bison parser skeleton and distribute that work
   under terms of your choice, so long as that work isn't itself a
   parser generator using the skeleton or a modified version thereof
   as a parser skeleton.  Alternatively, if you modify or redistribute
   the parser skeleton itself, you may (at your option) remove this
   special exception, which will cause the skeleton and the resulting
   Bison output files to be licensed under the GNU General Public
   License without this special exception.

   This special exception was added by the Free Software Foundation in
   version 2.2 of Bison.  */

/* DO NOT RELY ON FEATURES THAT ARE NOT DOCUMENTED in the manual,
   especially those whose name start with YY_ or yy_.  They are
   private implementation details that can be changed or removed.  */

#ifndef YY_YY_GRAMMAR_TAB_H_INCLUDED
# define YY_YY_GRAMMAR_TAB_H_INCLUDED
/* Debug traces.  */
#ifndef YYDEBUG
# define YYDEBUG 0
#endif
#if YYDEBUG
extern int yydebug;
#endif

/* Token kinds.  */
#ifndef YYTOKENTYPE
# define YYTOKENTYPE
  enum yytokentype
  {
    YYEMPTY = -2,
    YYEOF = 0,                     /* "end of file"  */
    YYerror = 256,                 /* error  */
    YYUNDEF = 257,                 /* "invalid token"  */
    LET = 258,                     /* LET  */
    CONST = 259,                   /* CONST  */
    VAR = 260,                     /* VAR  */
    FUNCTION = 261,                /* FUNCTION  */
    TRUE = 262,                    /* TRUE  */
    FALSE = 263,                   /* FALSE  */
    VAZIO = 264,                   /* VAZIO  */
    IF = 265,                      /* IF  */
    ELSE = 266,                    /* ELSE  */
    WHILE = 267,                   /* WHILE  */
    FOR = 268,                     /* FOR  */
    RETORNO = 269,                 /* RETORNO  */
    ABRE_PARENTESES = 270,         /* ABRE_PARENTESES  */
    FECHA_PARENTESES = 271,        /* FECHA_PARENTESES  */
    ABRE_CHAVES = 272,             /* ABRE_CHAVES  */
    FECHA_CHAVES = 273,            /* FECHA_CHAVES  */
    ABRE_COLCHETES = 274,          /* ABRE_COLCHETES  */
    FECHA_COLCHETES = 275,         /* FECHA_COLCHETES  */
    PONTO_VIRGULA = 276,           /* PONTO_VIRGULA  */
    VIRGULA = 277,                 /* VIRGULA  */
    PONTO = 278,                   /* PONTO  */
    DOIS_PONTOS = 279,             /* DOIS_PONTOS  */
    INTERROGACAO = 280,            /* INTERROGACAO  */
    ADICAO = 281,                  /* ADICAO  */
    SUBTRACAO = 282,               /* SUBTRACAO  */
    MULTIPLICACAO = 283,           /* MULTIPLICACAO  */
    DIVISAO = 284,                 /* DIVISAO  */
    RESTO_DIVISAO = 285,           /* RESTO_DIVISAO  */
    INCREMENTO = 286,              /* INCREMENTO  */
    DECREMENTO = 287,              /* DECREMENTO  */
    ATRIBUICAO = 288,              /* ATRIBUICAO  */
    MAIS_IGUAL = 289,              /* MAIS_IGUAL  */
    MENOS_IGUAL = 290,             /* MENOS_IGUAL  */
    IGUALDADE = 291,               /* IGUALDADE  */
    DIFERENTE = 292,               /* DIFERENTE  */
    IGUALDADE_ESTRITA = 293,       /* IGUALDADE_ESTRITA  */
    DIFERENCA_ESTRITA = 294,       /* DIFERENCA_ESTRITA  */
    MENOR = 295,                   /* MENOR  */
    MAIOR = 296,                   /* MAIOR  */
    MENOR_IGUAL = 297,             /* MENOR_IGUAL  */
    MAIOR_IGUAL = 298,             /* MAIOR_IGUAL  */
    AND = 299,                     /* AND  */
    OR = 300,                      /* OR  */
    NEGACAO = 301,                 /* NEGACAO  */
    IDENTIFICADOR = 302,           /* IDENTIFICADOR  */
    NUMERO = 303,                  /* NUMERO  */
    STRING = 304                   /* STRING  */
  };
  typedef enum yytokentype yytoken_kind_t;
#endif

/* Value type.  */
#if ! defined YYSTYPE && ! defined YYSTYPE_IS_DECLARED
typedef int YYSTYPE;
# define YYSTYPE_IS_TRIVIAL 1
# define YYSTYPE_IS_DECLARED 1
#endif


extern YYSTYPE yylval;


int yyparse (void);


#endif /* !YY_YY_GRAMMAR_TAB_H_INCLUDED  */
