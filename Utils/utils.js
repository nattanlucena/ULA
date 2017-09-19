/**
 * Created by roque on 18/09/17.
 */
const file = './Utils/dataMemory';
const functions = require('../Functions/functions');
const ula = require('../Functions/ula');

module.exports = {
    /*
        Return all instructions from file
     */
    getInstructions: function(file){
        return functions.readInstructions(file);
    },
    getDataMemory: function(file) {
        return functions.readInstructions(file);
    },
    performOperations: function(operation, x, y){
        return ula[operation](x, y);
    }
};