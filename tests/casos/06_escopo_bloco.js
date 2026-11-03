// Caso 06: escopos de bloco validos
let x = 1;
let limite = 10;

if (x < limite) {
  let x = 2;
  let dobro = x * 2;
  console.log(dobro);
}

while (x < limite) {
  x = x + 1;
}

console.log(x);
