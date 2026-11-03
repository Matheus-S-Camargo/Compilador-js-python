// Caso 07: funcoes, parametros e for

let resultado = somar(2, 3);

function somar(a, b) {
  let total = a + b;
  return total;
}

function fatorial(n) {
  if (n <= 1) {
    return 1;
  }
  return n * fatorial(n - 1);
}

for (let i = 0; i < 3; i++) {
  console.log(i);
}

for (let i = 0; i < 2; i++) {
  resultado = resultado + fatorial(i);
}

console.log(resultado);
