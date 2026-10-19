// Arquivo de teste funcional para o analisador léxico

const NOME_MISSAO = "Odisseia Estelar";
let combustivel = 100;
let tripulantes = 5;
var emergencia = false;

function calcularConsumo(distancia, eficiencia) {
  let consumo = distancia / eficiencia;
  return consumo;
}

function ativarPropulsores(potencia) {
  if (potencia >= 80 && potencia <= 100) {
    return true;
  } else if (potencia < 80 || potencia == 0) {
    return false;
  }
  return null;
}

let status = ativarPropulsores(95);

if (status === true) {
  combustivel -= 15;
} else {
  emergencia = true;
}

while (combustivel > 0 && !emergencia) {
  combustivel--;

  if (combustivel % 10 == 0) {
    console.log(combustivel);
  }

  if (combustivel <= 5) {
    emergencia = true;
  }
}

for (let i = 0; i < tripulantes; i++) {
  console.log('Tripulante ativo: ' + i);
}

let painel = nave.status;
let coordenadas = nave.getCoordenadas(0, 1, 2);
let primeiroTripulante = tripulantes[0];

let sinalPerdido = combustivel !== 100;
let contatoConfirmado = combustivel === 100;
let alertaCritico = combustivel < 10 ? true : false;

let margemSeguranca = combustivel - 5;
let volumeTanque = combustivel * 2;

combustivel += 5;
combustivel -= 2;

let mensagemFinal = "Missao " + NOME_MISSAO + " concluida com " + tripulantes + " tripulantes.";
