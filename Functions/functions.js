var fs = require('fs');
var file = './Utils/dataMemory';
// var file = './Utils/instructions';

const MEMORY_RESULT_FILE = './data/memory-result';

module.exports = {

    readInstructions: function (file) {
        try {
            let data = fs.readFileSync(file);
            let arr = data.toString().split('\n');
            let res = [];

            // Remove as linhas em branco
            for (let i in arr) {
                let trimmed = arr[i].trim();
                if (trimmed .length !== 0) {
                    res.push(trimmed);
                }

            }
            return res;
        } catch (err) {
            if (err.code === 'ENOENT') {
                console.error('File not exists');
                return;
            }
            throw err;
        }
    },
    writeMemoryResult: function (data) {
        let write = [];
        if (typeof data === 'object') {
            Object.keys(data).forEach(function(key) {
                let d = `${key} ${data[key]}`;
                write.push(d);
            })
        } else {
            write = data;
        }

        fs.unlink(MEMORY_RESULT_FILE, function(err) {
            if (err && err.code !== 'ENOENT') {
                console.log('err', err);
            }
            fs.appendFile(MEMORY_RESULT_FILE, write.join('\r\n'), function(err) {
                if (err) {
                    console.log('err', err);
                }
                console.log('done!');
            });
        });
    },
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