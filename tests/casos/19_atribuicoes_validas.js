// Caso 19: atribuicoes compostas e chamadas com o numero certo de argumentos
let total = 10;
let passo = 3;

function subtrair(a, b) {
  return a - b;
}

function zero() {
  return 0;
}

total += passo;
total -= 1;
total *= 2;
total = subtrair(total, passo) + zero();

for (let i = 0; i < 2; i++) {
  total = total + i;
}

console.log(total);
