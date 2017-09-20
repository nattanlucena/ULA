module.exports = {
    /**
     *
     * @param x
     * @param y
     * @returns {number}
     * @constructor
     */
    '00': function(x, y) {
        _validateNumbers(x, y);

        return parseInt(x) + parseInt(y);
    },
    /**
     *
     * @param x
     * @param y
     * @returns {number}
     * @constructor
     */
    '01': function(x , y) {
        _validateNumbers(x, y);

        return parseInt(x) - parseInt(y);
    },
    /**
     *
     * @param x
     * @param y
     * @returns {number}
     * @constructor
     */
    '10': function(x, y) {
        _validateNumbers(x, y);

        let result = parseInt(x) * parseInt(y);
        return parseInt(result.toFixed(5));
    },
    /**
     *
     * @param x
     * @param y
     * @returns {number}
     * @constructor
     */
    '11': function (x, y) {
        _validateNumbers(x, y);

        if (Number(y) === 0) {
            throw new Error('Illegal arithmetical operation: division by zero');
        }

        let result = parseInt(x)/parseInt(y);
        return parseInt(result);
    },
    /**
     *
     * @param x
     * @param y
     * @returns {*}
     * @constructor
     */
    BMI: function (x) {
        if (Number.isNaN(parseInt(x))) {
            throw new Error('Invalid args');
        }
        return parseInt(x) > 0;
    }
};


function _validateNumbers (x, y) {
    if (Number.isNaN(parseInt(x)) || Number.isNaN(parseInt(y))) {
        throw new Error('Invalid args');
    }
}