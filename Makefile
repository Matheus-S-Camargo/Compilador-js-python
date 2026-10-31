CC	= gcc
CFLAGS	= -Wall -g
BUILD	= build

all: compilador

$(BUILD):
	mkdir -p $(BUILD)

$(BUILD)/grammar.tab.c $(BUILD)/grammar.tab.h: src/grammar.y | $(BUILD)
	bison -d -o $(BUILD)/grammar.tab.c src/grammar.y

$(BUILD)/lex.yy.c: src/lexico.l $(BUILD)/grammar.tab.h | $(BUILD)
	flex -o $(BUILD)/lex.yy.c src/lexico.l

compilador: $(BUILD)/grammar.tab.c $(BUILD)/lex.yy.c src/ast.c src/tabela.c src/semantica.c src/gerador.c src/main.c
	$(CC) $(CFLAGS) -I$(BUILD) -Isrc -o compilador $^

teste_gerador: src/ast.c src/gerador.c tests/teste_gerador.c
	$(CC) $(CFLAGS) -Isrc -o tests/teste_gerador.exe $^

test: teste_gerador compilador
	./tests/teste_gerador.exe
	./tests/rodar.sh

clean:
	rm -rf $(BUILD) compilador compilador.exe tests/teste_gerador.exe