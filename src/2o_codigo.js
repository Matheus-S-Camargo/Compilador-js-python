var variavelAntiga = null;
let numeroDecimal = 12345;
const textoAspasDuplas = "compiladores 1";
const textoAspasSimples = 'javascript para python';
let booleano1 = true;
let booleano2 = false;

function funcaoMaluca(param1, _param2, arg3) {
    return param1 + _param2 * arg3;
}

let calc = 10 + 20 - 30 * 40 / 50 % 60;
calc += 100;
calc -= 50;
calc++;
calc--;
++calc;
--calc;

if (booleano1 && !booleano2 || (calc >= 10 && calc <= 20)) {
    calc = calc + 1;
} else if (numeroDecimal === 12345 && variavelAntiga !== null) {
    calc = calc - 1;
} else {
    let comparacao = (10 < 20) || (30 > 40) || (50 == 50) || (60 != 70);
}

let resultadoTernario = (calc > 0) ? "positivo" : "negativo";

while (calc > 0) {
    calc--;
}

for (let i = 0; i < 10; i++) {
    let arrayTeste = [1, 2, 3, null, true, 'item'];
    objeto.propriedade.metodo(i, arrayTeste[0], "teste");
}

return null;
