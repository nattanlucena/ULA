const utils = require('../Utils/utils');
const constants = require('../Constants/constants');

const INST_FILE = './data/instructions';
const MEM_FILE = './data/dataMemory';



let PC = 0;
let MAR; // Endereço na memória para uma operação de leitura ou escrita.
let IR; // Guarda a instrução recuperada no FETCH do endereço de memória
let MBR; // Buffer de memória que contém o último valor lido
let ICC; // Operação a ser realizada no ciclo de instruções

let tempRegister = {};
const instructions = utils.getInstructions(INST_FILE);
const dataMemory = utils.getDataMemory(MEM_FILE);
const dataMemoryBus = {};
dataMemory.forEach(function (item) {
    let s = item.split(' ');
    dataMemoryBus[s[0]] = s[1];
});

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

const OPCODE = {
    'ADD': '00',
    'SUB': '01',
    'MUL': '10',
    'DIV': '11',
    'BMI': 'BMI', // Verifica se o valor de um registrador, memória ou de uma constante é negativo.  Caso a condição seja satisfeita, pula para o endereço passado na instrução
    'JUMP': 'JUMP',
    'LOAD': 'LD',
};

/**
 * Main app
 */
function exec(){
    /**
     *
     */
    let performs = 0;
    let decoded = null;
    let register = {};
    let operationResult = null;
    let dataBus = {};
    let optCode;
    let valueX;
    let valueY;
    let countCycle = 0;

    console.log('\n');
    console.log(' ---- Iniciando execução de instruções ---- ');

    // Executa a primeira instrução pelo FETCH
    ICC = OPERATION.FETCH;

    while (performs < instructions.length) {
        switch (ICC) {
            case OPERATION.FETCH: {
                countCycle = countCycle + 1;
                console.log('\n');
                console.log('Ciclo:', countCycle);

                MAR = PC;
                IR = instructions[MAR].split(' ');
                ICC = OPERATION.DECODE;
                console.log(`... FETCH no endereço: FF${MAR}`);
                break
            }
            case OPERATION.DECODE: {
                // Decodifica e busca os operandos
                try {
                    console.log(`..... DECODE: ${IR.toString()}`);

                    // Decodifica
                    decoded = IR;
                    let operation = decoded[0];
                    let found = false;
                    Object.keys(OPCODE).forEach(function(key) {
                        if (key === operation) {
                            found = true;
                        }
                    });
                    if (!found) {
                        throw new Error(`Invalid operation: ${operation}`);
                    }

                    optCode = OPCODE[operation];
                    valueX = '';
                    valueY = '';
                    if (decoded.length > 2) {
                        // Busca os operandos
                        valueX = _getDataFromMemory(decoded[2]);
                        valueY = _getDataFromMemory(decoded[3]);

                        // Caso ocorra algum acesso indireto à memória
                        if (valueX && isNaN(valueX) && valueX.split('')[0] === 'A') {
                            console.log(`..... INDIRECT MEMORY ACCESS: ${decoded[2]}=${valueX}`);
                            valueX = _getDataFromMemory(valueX);
                            dataMemoryBus[decoded[2]] = valueX;
                        }

                        if (valueY && isNaN(valueY) && valueY.split('')[0] === 'A') {
                            console.log(`..... INDIRECT MEMORY ACCESS: ${decoded[3]}=${valueY}`);
                            valueY = _getDataFromMemory(valueY);
                            dataMemoryBus[decoded[3]] = valueY;
                        }

                    } else {
                        valueX = !isNaN(decoded[1]) ? parseInt(decoded[1]) : _getDataFromMemory(decoded[1]);
                    }

                    valueX = parseInt(valueX);
                    valueY = parseInt(valueY);
                    MBR = valueY ? valueY : valueX;
                    ICC = OPERATION.EXECUTE;
                    break;
                } catch(err) {
                    console.log('ERROR: ',  err.message);
                    ICC = OPERATION.EXIT;
                    break;
                }
            }
            case OPERATION.EXECUTE: {
                try {
                    switch (optCode) {
                        case OPCODE.JUMP: {
                            PC = parseInt(PC) + parseInt(decoded[1]);
                            performs = parseInt(performs) + parseInt(decoded[1]);
                            console.log(`....... EXECUTE (Salto incondicional): salto para endereço FF${PC}`);
                            ICC = OPERATION.FETCH;
                            break;
                        }
                        case OPCODE.LOAD: {
                            MBR = decoded[2];
                            ICC = OPERATION.WRITE;
                            console.log('....... EXECUTE: ', MBR);
                            break;
                        }
                        default: {
                            // Verifica se os argumentos são válidos e executa a operação decodificada
                            operationResult = utils.performOperations(optCode, valueX, valueY);

                            // Salto condicional: pula para 2 instruções a frente
                            if (typeof operationResult === 'boolean') {
                                if (operationResult) {
                                    console.log(`....... EXECUTE (Salto condicional): valor de ${decoded[1]} menor que 0`);
                                    PC = parseInt(PC) + parseInt(decoded[2]);
                                    performs = parseInt(performs) + parseInt(decoded[2]);
                                } else {
                                    // Continua na próxima instrução
                                    PC = PC + 1;
                                    performs = performs + 1;
                                }

                                MBR = 0;
                                ICC = OPERATION.FETCH;
                                break;

                            } else if (operationResult === 0) {
                                MBR = 1;
                                PC = PC + 1;
                                performs = performs + 1;
                                ICC = OPERATION.FETCH;
                                console.log(`....... EXECUTE (Salto condicional): valor de ${decoded[1]} igual que 0`);
                                break;

                            } else {
                                MBR = operationResult;
                                ICC = OPERATION.WRITE;
                                console.log('....... EXECUTE: ', MBR);
                                break;
                            }
                        }
                    }
                    break;
                } catch(err) {
                    console.log('ERROR: ',  err.message);
                    ICC = OPERATION.EXIT;
                    break;
                }
            }
            case OPERATION.WRITE: {
                // Salva o valor no registrador da instrução
                try {
                    if (decoded[1].split('')[0] !== 'R') {
                        throw new Error('Invalid reg type');
                    }
                    register[decoded[2]] = MBR;
                    // Salva os dados num array de registradores temporários
                    tempRegister[decoded[1]] = MBR;
                    console.log(`......... WRITE no registrador da cpu ${decoded[1]}: ${MBR}`);
                    ICC = OPERATION.WRITEBACK;
                    break;
                } catch(err) {
                    console.log('ERROR: ',  err.message);
                    ICC = OPERATION.EXIT;
                    break;
                }
            }
            case OPERATION.WRITEBACK: {
                // Barramento com as operações executadas e seus resultados
                dataBus[`FF${MAR}`] = register[decoded[2]];
                // Salva o valor no endereço de memória FF:
                dataMemoryBus[`FF${MAR}`] = register[decoded[2]];
                console.log(`........... WRITEBACK no endereço de memória FF${MAR}: ${register[decoded[2]]}`);
                PC = PC + 1;
                performs = performs + 1;
                ICC = OPERATION.FETCH;
                break;
            }
            case OPERATION.EXIT: {
                console.log('\n');
                console.log('...Finalizando a aplicação...');
                console.log('Bye!');
                console.log('\n');
                process.exit(1);
            }
            default:{
            }
                break;
        }
    }

    // Escreve a memória final em arquivo
    utils.writeMemory(_sortMemoryData(dataMemoryBus));

    console.log('\n');
    console.log('Resultado da execução das instruções de cada operador completamente executado: \n', dataBus);
    console.log('\n');
    console.log('Dados do registrador na memória: \n', tempRegister);
    console.log('\n');
    console.log('Ciclos de instrução: ', countCycle);
    console.log('\n');
    }

/**
 *
 * @param address
 * @returns {string|Number}
 */
function _verifyIndirectMemoryAccess(address) {
    let result = undefined;

    Object.keys(dataMemoryBus).forEach(function(key) {
        if (key === address) {
            result = dataMemoryBus[key];
        }
    });

    if (result === undefined) {
        throw new Error('Invalid memory address');
    }

    return result;
}
// Recupera o valor do endereço na memória. Caso o valor seja outro endereço, realiza uma nova busca
function _getDataFromMemory(value) {
    let result = undefined;
    if (value) {
        let val1 = value.split('')[0];

        if (val1 === 'R') {
            result = _findInTempReg(value);

            if (result === undefined) {
                throw new Error('Invalid register');
            }
        } else if (val1 === 'A') {
            // Primeiramente, procura o valor do registrador nos registradores temporários
            result = _findInMemory(value);
            if (result === undefined) {
                throw new Error('Invalid memory address');
            }
        } else {
            result = value;
        }
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
// Recupera o valor de um endereço de memória
function _findInMemory(address) {
    let result = undefined;
    let compare = `${address}`;

    Object.keys(dataMemoryBus).forEach(function(key){
        if (key.toUpperCase() === compare.toUpperCase()) {
            result = dataMemoryBus[key];
        }
    });

    return result;
}

function _sortMemoryData(memory) {
    return Object.keys(memory).sort((a, b) => {
        return memory[a] - memory[b]
    }).reduce((prev, curr) => {
        prev[curr] = memory[curr];
        return prev
    }, {});
}

exec();