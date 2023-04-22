/**
 * Packet Clearing House
 * c2016
 * MIT License
 * https://github.com/Packet-Clearing-House/gists
 */

/** - thanks http://stackoverflow.com/a/1063027
 * @param a
 * @param b
 * @returns {number}
 */
function sortNumber(a,b) {
    return a - b;
}

/**
 * If we have multiple rows we need to count and then figure they're
 * rank, this function will do that for
 * @param rawValues array of json objects
 * @param key string of value to count
 * @returns {number[]} array of ranks
 */
function generateRanksFromMultipleRows(rawValues, key) {
    var rankerPre = {};
    var ranker = [0];
    $.each(rawValues, function (index, value) {
        if (rankerPre[value[key]] === undefined) {
            rankerPre[value[key]] = 1;
        } else {
            rankerPre[value[key]] = rankerPre[value[key]] + 1;
        }
    });
    $.each(rankerPre, function (index, value) {
        if (ranker.indexOf(value) === -1) {
            ranker.push(value);
            ranker.sort(sortNumber);
        }
    });
    return ranker;
}

/**
 * instead of looping over many values to count the rows like generateRanksFromMultipleRows(),
 * use one value (countKey) per row to derive ranks
 * @param rawValues array of json objects
 * @param key string of value to count
 * @param useNegatives boolean to use negative scale or not
 * @returns {number[]} array of ranks
 */
function generateRanksFromSingleValue(rawValues, countKey, negativeOnly){
    if (!negativeOnly){
        ranks = [0];
    } else {
        ranks = [-1];
    }
    $.each(rawValues, function (index, value) {
        var currentValue = parseInt(value[countKey]);
        if (ranks.indexOf(currentValue) === -1) {

            if (negativeOnly && currentValue < 0) {
                ranks.push(currentValue);
                ranks.sort(sortNumber);
            } else if (!negativeOnly && currentValue > 0){
                ranks.push(currentValue);
                ranks.sort(sortNumber);
            }
        }
    });
    if (negativeOnly){
        ranks.reverse();
    }
    return ranks;
}

/**
 * based on an array of ranks, find the relative rank of a specific value
 * @param value integer of value
 * @param ranks array of ranks (integers)
 * @param useNegatives boolean to use negative scale or not
 * @returns {number} rank
 */
function getPercentile(value, ranks, useNegatives){
    if (ranks != null && ranks.indexOf(value) !== -1) {
        if (!useNegatives){
            return Math.round(ranks.indexOf(value) / (ranks.length - 1) * 100);
        } else {
            var pre = Math.round(ranks.indexOf(value) / (ranks.length - 1) * 100)
            return pre - (pre * 2);
        }
    } else {
        return 0;
    }
}
