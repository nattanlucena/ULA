const utils = require('../Utils/utils');
const constants = require('../Constants/constants');

const INST_FILE = './data/instructions';
const MEM_FILE = './data/dataMemory';

const instructions = utils.getInstructions(INST_FILE);
const dataMemory = utils.getDataMemory(MEM_FILE);

let PC = 0;
let MAR; // Endereço na memória para uma operação de leitura ou escrita.
let tempRegister = {};

// Operações do ciclo de instrução
const OPERATION = {
    FETCH: 'FETCH', // Busca a instrução na memória
    DECODE: 'DECODE', // Decodifica a instrução
    EXECUTE: 'EXECUTE', // Realiza a operação decodificada
    WRITE: 'WRITE', // Acesso à memória
    WRITEBACK: 'WRITEBACK' // Salva o resultado no registrador
};

/**
 * Main app
 */
function exec(){
    let performs = 0;
    let operation = OPERATION.FETCH;
    let decoded = null;
    let instruction = null;
    let register = {};
    let operationResult = null;
    let addressWrite = [];
    let optCode;
    let valueX;
    let valueY;

    while (performs < instructions.length) {
        switch (operation) {
            case OPERATION.FETCH: {
                MAR = PC;
                instruction = instructions[MAR].split(':');
                let address = instruction[0];
                console.log(`... FETCH no endereço: ${address}`);
                operation = OPERATION.DECODE;
                break
            }
            case OPERATION.DECODE: {
                decoded = instruction[1].trim().split(' ');
                optCode = decoded[0];
                console.log(`..... DECODE: ${decoded.toString()}`);
                operation = OPERATION.EXECUTE;
                break;
            }
            case OPERATION.EXECUTE: {
                try {
                    // Verifica se os argumentos são válidos
                    if (optCode === 'LOAD') {
                        if (!decoded[1] || Number.isNaN(parseInt(decoded[1]))) {
                            throw new Error ('Invalid args');
                        }
                        operationResult = parseFloat(_getDataFromMemory(decoded[1]));
                    } else if (optCode === 'STORE') {
                        if (!decoded[2] || Number.isNaN(parseInt(decoded[2]))) {
                            throw new Error ('Invalid args');
                        }
                        operationResult = parseFloat(_getDataFromMemory(decoded[2]));
                    } else {
                        // Caso seja uma operação aritmética
                        valueX = _getDataFromMemory(decoded[2]);
                        valueY = _getDataFromMemory(decoded[3]);

                        operationResult = utils.performOperations(optCode, valueX, valueY);
                    }
                    console.log('....... EXECUTE: ', operationResult);
                    operation = OPERATION.WRITEBACK;
                } catch(err) {
                    console.log('ERROR: ', err.message || 'Invalid args');
                    console.log('INTERRUPTION: executa a próxima instrução');
                    PC = PC + 1;
                    performs = performs + 1;
                    console.log('\n');
                    operation = OPERATION.FETCH;
                }
                break;
            }
            case OPERATION.WRITEBACK: {
                // Salva o valor no registrador da instrução
                register[decoded[2]] = operationResult;
                // Salva os dados num array de registradores temporários
                tempRegister[decoded[1]] = operationResult;
                console.log(`......... WRITE no registrador da cpu ${decoded[1]}: ${operationResult}`);
                operation = OPERATION.WRITE;
                break;
            }
            case OPERATION.WRITE: {
                // Salva o valor no endereço de memória FF
                let address = {};
                address[instruction[0]] = register[decoded[2]];
                addressWrite.push(address);
                console.log(`........... WRITEBACK no endereço de memória ${instruction[0]}: ${register[decoded[2]]}`);
                PC = PC + 1;
                performs = performs + 1;
                console.log('\n');
                operation = OPERATION.FETCH;
                break;
            }
            default:
                break;
        }
    }

    console.log('Resultado da execução das instruções de cada operador completamente executado: \n', addressWrite);
    console.log('Dados do registrador na memória: \n', tempRegister);
     console.log('Registrador ordenado em ordem crescente', _sort(tempRegister));
}

// Pega o valor do endereço na memória. Caso o valor seja outro endereço, realiza uma nova busca
function _getDataFromMemory(value) {
    let result = '';
    let val1 = value.split('')[0];
    let val2 = value.split('')[1];

    if (val1 === 'R') {
        // Primeiramente, procura o valor do registrador nos registradores temporários
        result = _findInTempReg(value);

        //Caso não encontre, procura na memória
        if (!result) {
            result = _findInMemory(val2);
            if (result.split('')[0] === 'A') {
                // Acesso indireto, caso o valor de X seja um outro endereço
                result = _findInMemory(result[1]);
            }
        }
    } else {
        result = value;
    }

    return result;
}

function _findInTempReg(value){
    let result = undefined;

    Object.keys(tempRegister).forEach(function(item) {
        if (item.toUpperCase() === value.toUpperCase()) {
            result = tempRegister[item];
        }
    });

    return result;
}
function _findInMemory(value) {
    let result;
    let found = false;

    if (!found) {
        let compare = `A${value}`;

        dataMemory.forEach(function(item) {
            if (item.split(' ')[0].toUpperCase() === compare.toUpperCase()){
                result = item.split(' ')[1];
            }
        });
    }

    return result;
}

// TODO: finalizar script de sort
function _sort(yourObject) {
    //console.log(typeof reg);
    return Object.keys(yourObject).sort((a, b) => {
        return yourObject[a] - yourObject[b]
    }).reduce((prev, curr, i) => {
        prev[i] = yourObject[curr];
        return prev
    }, {});
}
exec();