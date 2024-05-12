const gasTable = {
    pm25: [0, 35, 75, 115, 150, 250, 350, 500],
    pm10: [0, 50, 150, 250, 350, 420, 500, 600],
    o3: [0, 160, 200, 300, 400, 800, 1000, 1200],
    so2: [0, 150, 500, 650, 800, 1600, 2100, 2620],
    no2: [0, 100, 200, 700, 1200, 2340, 3090, 3840],
    co: [0, 5, 10, 35, 60, 90, 120, 150],
};

const iaqiStepTable = [0, 50, 100, 150, 200, 300, 400, 500];

function findIndexAndPercentage(arr, value) {
    if (value <= arr[0]) {
        return {index: 0, percentage: 0};
    }
    if (value >= arr[arr.length - 1]) {
        return {index: 0, percentage: 0};
    }
    let index = 0;
    while (arr[index] < value) {
        index++;
    }
    const numerator = arr[index + 1] - arr[index];
    const denominator = value - arr[index - 1];
    const percentage = (denominator / numerator);
    return {index, percentage};
}

function iaqi(arr, value, step = iaqiStepTable) {
    const {index, percentage} = findIndexAndPercentage(arr, value);

    console.log(index, percentage)

    return step[index] + percentage * (step[index + 1] - step[index])
}

function findMaxIndex(arr) {
    let maxIndex = 0;
    let maxValue = arr[0];

    for (let i = 1; i < arr.length; i++) {
        if (arr[i] > maxValue) {
            maxValue = arr[i];
            maxIndex = i;
        }
    }

    return maxIndex;
}

export function calculateIAqi(airQuality) {
    const calculateResult = [
        iaqi(gasTable.co, airQuality.co),
        iaqi(gasTable.no2, airQuality.no2),
        iaqi(gasTable.o3, airQuality.o3),
        iaqi(gasTable.pm10, airQuality.pm10),
        iaqi(gasTable.pm25, airQuality.pm25),
        iaqi(gasTable.so2, airQuality.so2),
    ];
    const mainPollutants = ["co", "no2", "o3", "pm10", "pm25", "so2"][findMaxIndex(calculateResult)];
    return {
        co: calculateResult[0],
        no2: calculateResult[1],
        o3: calculateResult[2],
        pm10: calculateResult[3],
        pm25: calculateResult[4],
        so2: calculateResult[5],
        mainPollutants: mainPollutants,
    }
}

const levelMappingTable = [
    {
        baseLevel: 0,
        aqiLevel: "优"
    },
    {
        baseLevel: 50,
        aqiLevel: "良"
    },
    {
        baseLevel: 100,
        aqiLevel: "轻"
    },
    {
        baseLevel: 150,
        aqiLevel: "中"
    },
    {
        baseLevel: 200,
        aqiLevel: "重"
    },
    {
        baseLevel: 300,
        aqiLevel: "严"
    },
]

export function calculateAqiLevel(aqi) {
    for (const item of levelMappingTable.reverse()) {
        if (aqi >= item.baseLevel) {
            return item.aqiLevel
        }
    }
    return '未知'
}

export const aqiColorMapper = {
    "优": 'rgba(108,253,113,0.9)',
    "良": 'rgba(214,253,108,0.9)',
    "轻": 'rgba(253,160,84,0.9)',
    "中": 'rgba(253,60,60,0.9)',
    "重": 'rgba(131,36,68,0.9)',
    "严": 'rgba(76,22,0,0.9)',
    '未知': 'rgba(0,0,0,0.9)'
}