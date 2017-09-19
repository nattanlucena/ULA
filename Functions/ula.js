var fs = require('fs');
var file = './Utils/dataMemory';

module.exports = {
    /**
     *
     * @param x
     * @param y
     * @returns {number}
     * @constructor
     */
    ADD: function(x, y) {
        _validateNumbers(x, y);

        return parseFloat(x) + parseFloat(y);
    },
    /**
     *
     * @param x
     * @param y
     * @returns {number}
     * @constructor
     */
    SUB: function(x , y) {
        _validateNumbers(x, y);

        return parseFloat(x) - parseFloat(y);
    },
    /**
     *
     * @param x
     * @param y
     * @returns {number}
     * @constructor
     */
    MUL: function(x, y) {
        _validateNumbers(x, y);

        let result = parseFloat(x) * parseFloat(y);
        return parseFloat(result.toFixed(5));
    },
    /**
     *
     * @param x
     * @param y
     * @returns {number}
     * @constructor
     */
    DIV: function (x, y) {
        _validateNumbers(x, y);

        if (Number(y) === 0) {
            throw new Error('Illegal arithmetical operation: division by zero');
        }

        let result = parseFloat(x)/parseFloat(y);
        return parseFloat(result.toFixed(5));
    },
    /**
     *
     * @param x
     * @param y
     * @returns {*}
     * @constructor
     */
    MOV: function (x, y) {
        let tmp;
        tmp = parseFloat(y);
        return tmp;
    }
};


function _validateNumbers (x, y) {
    if (Number.isNaN(parseInt(x)) || Number.isNaN(parseInt(y))) {
        throw new Error('Invalid args');
    }
}