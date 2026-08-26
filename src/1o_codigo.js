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