import pathlib
import re
import subprocess
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
COMPILADOR = RAIZ / ("compilador.exe" if sys.platform == "win32" else "compilador")


def executar(comando, entrada=None):
    return subprocess.run(comando, input=entrada, capture_output=True, text=True, encoding="utf-8", timeout=5, cwd=RAIZ)


def verificar(fonte, esperado=0, mensagens=()):
    resultado = executar([str(COMPILADOR), "--py"], fonte)
    assert resultado.returncode == esperado, f"compilador: esperado {esperado}, obtido {resultado.returncode}: {resultado.stderr}"
    if esperado:
        assert not resultado.stdout, "gerou Python para programa invalido"
        for mensagem in mensagens:
            assert mensagem in resultado.stderr, f"diagnostico ausente: {mensagem}"
        return
    assert not resultado.stderr, f"diagnostico inesperado: {resultado.stderr}"
    js = executar(["node", "-e", fonte])
    py = executar([sys.executable, "-c", resultado.stdout])
    assert js.returncode == 0, f"JavaScript: {js.stderr}"
    assert py.returncode == 0, f"Python: {py.stderr}"
    assert js.stdout == py.stdout, f"saida esperada {js.stdout!r}; obtida {py.stdout!r}"


CASOS = [
    ("precedencia e associatividade", "console.log((2 + 3) * 4, 20 - (8 - 3), 24 / (6 / 2), 3 * (7 % 4), -(2 + 3));"),
    ("atribuicoes compostas", "let x; x = 12; console.log(x); x += 6; console.log(x); x -= 2; console.log(x); x *= 3; console.log(x); x /= 4; console.log(x); x %= 5; console.log(x);"),
    ("logica e comparacoes", "console.log(!(1 < 2), !false && true, false || true, 2 <= 2, 3 >= 4, 2 != 3, 2 == 2);"),
    ("igualdade estrita", "console.log(1 === true, 1 !== true, 2 === 2, 2 === (4 / 2));"),
    ("literais e impressao", 'const nome = "texto"; console.log(true, false, null, nome, 4 / 2);'),
    ("ternario", 'console.log(true ? "sim" : "nao", false ? 1 : true ? 2 : 3);'),
    ("incrementos em expressoes", "let x = 2; console.log(x++, ++x, x--, --x, x);"),
    ("variantes do for", "let n = 0; for (let i = 0; i < 2; i++) { for (let j = 0; j < 3; j++) n++; } for (let k = 0; k < 2; k++) {} let j = 2; for (; j > 0; j--) {} console.log(n, j);"),
    ("atribuicao como expressao", "let x = 0; let y = 0; console.log(x = y = 3); console.log(x, y);"),
]


def main():
    total = 0
    falhas = 0
    casos = list(CASOS)
    for arquivo in sorted((RAIZ / "tests/casos").glob("*.js")):
        fonte = arquivo.read_text(encoding="utf-8")
        esperado = 1 if "_erro_sintatico" in arquivo.name else 2 if "_erro_" in arquivo.name else 0
        mensagens = re.findall(r'^// Esperado: "(.*)"', fonte, re.MULTILINE)
        casos.append((arquivo.name, fonte, esperado, mensagens))
    for caso in casos:
        nome, fonte, *opcoes = caso
        total += 1
        try:
            verificar(fonte, *opcoes)
            print(f"OK     {nome}")
        except (AssertionError, subprocess.TimeoutExpired, OSError) as erro:
            falhas += 1
            print(f"FALHA  {nome}: {erro}")
    print(f"{total - falhas} OK, {falhas} FALHA")
    return bool(falhas)


if __name__ == "__main__":
    sys.exit(main())
