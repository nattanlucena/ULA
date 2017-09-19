const utils = require('../Utils/utils');
const constants = require('../Constants/constants');

const INST_FILE = './data/instructions';
const MEM_FILE = './data/dataMemory';

const instructions = utils.getInstructions(INST_FILE);
const dataMemory = utils.getDataMemory(MEM_FILE);

let PC = 0;
let MAR; // Endereço na memória para uma operação de leitura ou escrita.
let IR;
let MBR = {};
let ICC;

let tempRegister = {};
let tempMemory = {};

// Operações do ciclo de instrução
const OPERATION = {
    FETCH: 'FETCH', // Busca a instrução na memória
    DECODE: 'DECODE', // Decodifica a instrução
    INDIRECT: 'INDIRECT',
    EXECUTE: 'EXECUTE', // Realiza a operação decodificada
    WRITE: 'WRITE', // Salva o resultado no registrador
    WRITEBACK: 'WRITEBACK', // Acesso à memória
    EXIT: 'EXIT'
};

/**
 * Main app
 */
function exec(){
    let performs = 0;
    let decoded = null;
    let register = {};
    let operationResult = null;
    let addressWrite = [];
    let optCode;
    let valueX;
    let valueY;
    let countCycle = 0;

    // Executa a primeira instrução pelo FETCH
    ICC = OPERATION.FETCH;

    while (performs < instructions.length) {
        switch (ICC) {
            case OPERATION.FETCH: {
                MAR = PC;
                IR = instructions[MAR].split(':');
                let address = IR[0];
                console.log(`... FETCH no endereço: ${address}`);
                ICC = OPERATION.DECODE;
                break
            }
            case OPERATION.DECODE: {
                decoded = IR[1].trim().split(' ');
                console.log(`..... DECODE: ${decoded.toString()}`);
                optCode = decoded[0];
                valueX = _getDataFromMemory(decoded[2]);
                valueY = _getDataFromMemory(decoded[3]);

                MBR = {};
                if (valueY) {
                    let type = !isNaN(decoded[3])  ? 'C' : decoded[3];
                    MBR[type] = valueY;
                } else {
                    let type = !isNaN(decoded[2]) ? 'C' : decoded[2];
                    MBR[type] = valueX;
                }

                ICC = OPERATION.EXECUTE;
                break;
/*
                if (Object.keys(MBR).length) {
                    let key = Object.keys(MBR)[0];
                    if (key === decoded[2]) {
                        valueX = MBR[key];
                    } else if (key === decoded[3]) {
                        valueY = MBR[key];
                    }
                } else {
                    valueX = _getDataFromMemory(decoded[2]);
                    valueY = _getDataFromMemory(decoded[3]);
                }

                let verifyIndirectX = typeof valueX === 'number' ? valueX :_verifyIndirectMemoryAccess(valueX);
                let verifyIndirectY = typeof valueY === 'number' ? valueY : _verifyIndirectMemoryAccess(valueY);

                if (verifyIndirectX && verifyIndirectX === 'next') {
                    tempMemory[decoded[2]] = valueX;
                    MBR[decoded[2]] = valueX;
                    ICC = OPERATION.INDIRECT;
                } else if (verifyIndirectY && verifyIndirectY === 'next') {
                    tempMemory[decoded[3]] = valueY;
                    MBR[decoded[3]] = valueY;
                    ICC = OPERATION.INDIRECT;

                } else {
                    MBR = {};
                    if (verifyIndirectY) {
                        let type = !isNaN(decoded[3])  ? 'C' : decoded[3];
                        MBR[type] = parseInt(verifyIndirectY);
                    } else {
                        let type = !isNaN(decoded[2]) ? 'C' : decoded[2];
                        MBR[type] = parseInt(verifyIndirectX);
                    }
                    valueX = verifyIndirectX;
                    valueY = verifyIndirectY;
                    ICC = OPERATION.EXECUTE;
                }
                */
            }
            case OPERATION.INDIRECT: {
                console.log(`..... INDIRECT MEMORY ACCESS: ${JSON.stringify(MBR)}`);
                let key = Object.keys(MBR)[0];
                let value = Object.values(MBR)[0];
                let result = _verifyIndirectMemoryAccess(value);
                MBR[key] = parseInt(result);
                ICC = OPERATION.EXECUTE;
                break;
            }
            case OPERATION.EXECUTE: {
                try {

                    let verifyIndirectX = typeof valueX === 'number' ? valueX :_verifyIndirectMemoryAccess(valueX);
                    let verifyIndirectY = typeof valueY === 'number' ? valueY : _verifyIndirectMemoryAccess(valueY);

                    if (verifyIndirectX && verifyIndirectX === 'next') {
                        tempMemory[decoded[2]] = valueX;
                        MBR[decoded[2]] = valueX;
                        ICC = OPERATION.INDIRECT;
                    } else if (verifyIndirectY && verifyIndirectY === 'next') {
                        tempMemory[decoded[3]] = valueY;
                        MBR[decoded[3]] = valueY;
                        ICC = OPERATION.INDIRECT;

                    } else {
                        MBR = {};
                        if (verifyIndirectY) {
                            let type = !isNaN(decoded[3])  ? 'C' : decoded[3];
                            MBR[type] = parseInt(verifyIndirectY);
                        } else {
                            let type = !isNaN(decoded[2]) ? 'C' : decoded[2];
                            MBR[type] = parseInt(verifyIndirectX);
                        }
                        valueX = verifyIndirectX;
                        valueY = verifyIndirectY;
                    }

                    // Verifica se os argumentos são válidos
                    if (optCode === 'LOAD') {
                        if (!decoded[1]) {
                            throw new Error ('Invalid args');
                        }
                        operationResult = valueX;
                    } else if (optCode === 'STORE') {
                        if (!decoded[2] || Number.isNaN(parseInt(valueX))) {
                            throw new Error ('Invalid args');
                        }
                        operationResult = valueX;
                    } else {
                        operationResult = utils.performOperations(optCode, valueX, valueY);
                    }
                    ICC = OPERATION.WRITE;
                    console.log('....... EXECUTE: ', operationResult);
                } catch(err) {
                    console.log('ERROR: ', err.message || 'Invalid args');
                    console.log('INTERRUPTION: executa a próxima instrução');
                    PC = PC + 1;
                    performs = performs + 1;
                    countCycle = countCycle + 1;
                    valueX = '';
                    valueY = '';
                    console.log('\n');
                    ICC = OPERATION.FETCH;
                }
                break;
            }
            case OPERATION.WRITE: {
                // Salva o valor no registrador da instrução
                register[decoded[2]] = operationResult;
                // Salva os dados num array de registradores temporários
                tempRegister[decoded[1]] = operationResult;
                console.log(`......... WRITE no registrador da cpu ${decoded[1]}: ${operationResult}`);
                ICC = OPERATION.WRITEBACK;
                break;
            }
            case OPERATION.WRITEBACK: {
                // Salva o valor no endereço de memória FF
                let address = {};
                address[IR[0]] = register[decoded[2]];
                addressWrite.push(address);
                console.log(`........... WRITEBACK no endereço de memória ${IR[0]}: ${register[decoded[2]]}`);
                PC = PC + 1;
                performs = performs + 1;
                console.log('\n');
                ICC = OPERATION.FETCH;
                countCycle = countCycle + 1;
                break;
            }
            default:
                break;
        }
    }

    console.log('Resultado da execução das instruções de cada operador completamente executado: \n', addressWrite);
    console.log('\n');
    console.log('Dados do registrador na memória: \n', tempRegister);
    console.log('\n');
    console.log('Registrador ordenado em ordem crescente', _sort(tempRegister));
    console.log('\n');
    console.log('Memória temporária', tempMemory);
    console.log('\n');
    console.log('Ciclos de instrução: ', countCycle);
    console.log('\n');
}

/**
 *
 * @param value
 * @returns {string|Number}
 */
function _verifyIndirectMemoryAccess(value) {
    let result = '';
    if (value) {
        if (value.split('')[0] === 'A') {
            if (Object.keys(tempMemory).length !== 0) {
                result = 'next';
                Object.keys(tempMemory).forEach(function(item) {
                    if (tempMemory[item] === value) {
                        result = _indirectMemoryAccess(tempMemory[item]);
                        tempMemory[item] = parseInt(result);
                    }
                });
            } else {
                result = 'next';
            }
        } else {
            result = value;
        }
    }

    return result;
}
// Recupera o valor do endereço na memória. Caso o valor seja outro endereço, realiza uma nova busca
function _getDataFromMemory(value) {
    let result = '';
    if (value) {
        let val1 = value.split('')[0];

        if (val1 === 'R') {
            result = _findInTempReg(value);
        } else if (val1 === 'A') {
            // Primeiramente, procura o valor do registrador nos registradores temporários
            result = _findInMemory(value);
        } else {
            result = value;
        }
    }

    return result;
}
function _indirectMemoryAccess(value) {
    return  _findInMemory(value);
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
// Recupera o valor de um endereço de memória
function _findInMemory(address) {
    let result = '';
    let compare = `${address}`;
    dataMemory.forEach(function(item) {
        if (item.split(' ')[0].toUpperCase() === compare.toUpperCase()){
            result = item.split(' ')[1];
        }
    });

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