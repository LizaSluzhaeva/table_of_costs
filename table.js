// HTML elements

let table = document.querySelector('table');
let modal = document.getElementById('modal');
let addBtn = document.getElementById('add_btn');
let closeBtn = document.getElementById('close_btn');
let saveBtn = document.getElementById('save_btn');
let dateInput = document.getElementById('input_date');
let companyInput = document.getElementById('input_company');
let costInput = document.getElementById('input_cost');
let notificationBlock = document.getElementById('notification');
let notificationLabel = document.getElementById('notification_label');

const ADD_WHEN_EDITING_ERROR = 'Сначала завершите редактирование таблицы!';
const DATE_FORMAT_ERROR = 'Дата должна соотвествовать формату дд.мм.гггг!';
const COMPANY_FORMAT_ERROR = 'Название компании должно содержать хотя бы один символ!';
const COST_FORMAT_ERROR = 'Цена должна быть положительным целым числом!';
const DUPLICATE_ROW_ERROR = 'В таблице уже существует строка с такими значениями!';

// global variables

let editingCell;
let editingValue;
let datasets = []
let timeout;

// utils

function notify(message) {
    if (timeout) {
        clearTimeout(timeout);
    }
    notificationLabel.innerText = message;
    notificationBlock.style.display = 'flex';
    timeout = setTimeout(function () {
        notificationBlock.style.display = 'none';
    }, 5000);
}

function randColor() {
    let r = Math.floor(Math.random() * (256)),
        g = Math.floor(Math.random() * (256)),
        b = Math.floor(Math.random() * (256));
    return '#' + r.toString(16) + g.toString(16) + b.toString(16);
}

// chart initialization

let ctx = document.getElementById('chart').getContext('2d');
let chart = new Chart(ctx, {
    type: 'line',
    data: {
        datasets: datasets
    },
    options: {
        responsive: false,
        scales: {
            xAxes: [
                {
                    type: 'time',
                    time: {
                        unit: 'week',
                        format: "DD-MM-YYYY",
                        displayFormats: {
                            quarter: 'MMM DD YYYY'
                        }
                    },
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 24
                    }
                }
            ],
            yAxes: [{
                gridLines: {
                    color: 'black',
                    borderDash: [2, 5],
                },
                scaleLabel: {
                    display: true,
                    labelString: 'Стоимость в рублях',
                    fontColor: "green"
            },}]
        }
    }
});

// datasets utils

function sortDataset(dataset) {
    dataset.data.sort(function (d1, d2) {
        let split1 = d1.x.split('.');
        let split2 = d2.x.split('.');
        split1[1] -= 1;
        split2[1] -= 1;
        let date1 = new Date(split1[2], split1[1], split1[0]);
        let date2 = new Date(split2[2], split2[1], split2[0]);
        if (date1 > date2) {
            return 1;
        }
        if (date2 > date1) {
            return -1;
        }
        return 0;
    })
}

function findDatasetByCompany(company) {
    return datasets.find(function (d) {
        return d.label === company;
    });
}

function findPointIndexInDataset(dataset, date, cost) {
    return dataset.data.findIndex(function (point) {
        return point.x === date && point.y == cost;
    })
}

function createPoint(date, company, cost) {
    let dataset = findDatasetByCompany(company);
    if (!dataset) {
        let color = randColor();
        dataset = {
            label: company,
            backgroundColor: color,
            borderColor: color,
            data: [],
            fill: false
        };
        datasets.push(dataset);
    }
    dataset.data.push({
        x: date,
        y: cost
    });
    sortDataset(dataset);
}

function existsPoint(date, company, cost) {
    return datasets.some(function (dataset) {
        return dataset.label === company && dataset.data.some(function (point) {
            return point.x === date && point.y == cost;
        });
    });
}

function removePoint(date, company, cost) {
    let dataset = findDatasetByCompany(company);
    if (dataset.data.length === 1) {
        datasets.splice(datasets.indexOf(dataset), 1);
    } else {
        dataset.data.splice(findPointIndexInDataset(dataset, date, cost), 1);
    }
}

function updatePointDate(prevDate, company, cost, newDate) {
    let dataset = findDatasetByCompany(company);
    dataset.data[findPointIndexInDataset(dataset, prevDate, cost)].x = newDate;
    sortDataset(dataset);
}

function updatePointCost(date, company, prevCost, newCost) {
    let dataset = findDatasetByCompany(company);
    dataset.data[findPointIndexInDataset(dataset, date, prevCost)].y = newCost;
}

// validation utils

function validateDate(value) {
    let dateSplit = value.split('.');
    dateSplit[1] -= 1;
    let date = new Date(dateSplit[2], dateSplit[1], dateSplit[0]);
    return date.getFullYear() == dateSplit[2] && date.getMonth() == dateSplit[1] && date.getDate() == dateSplit[0];
}

function validateCompany(value) {
    return value.trim().length > 0;
}

function validateCost(value) {
    return value.search(/^\d+$/) >= 0;
}

function validateCell(cell) {
    let classname = cell.className.split(' ')[0];
    let newValue = cell.childNodes[0].value;
    let row = cell.parentNode;
    let rowDate = row.childNodes[0].innerText;
    let rowCompany = row.childNodes[1].innerText;
    let rowCost = row.childNodes[2].innerText;
    switch (classname) {
        case 'date':
            return validateDate(newValue) && !existsPoint(newValue, rowCompany, rowCost);
        case 'company':
            return validateCompany(newValue) && !existsPoint(rowDate, newValue, rowCost);
        case 'cost':
            return validateCost(newValue) && !existsPoint(rowDate, rowCompany, newValue);
    }
}

function clearValidationStyle(element) {
    element.className = element.className.split(' ')[0];
}

function makeInvalid(element) {
    if (!element.className.endsWith('invalid_input')) {
        element.className += ' invalid_input';
    }
}

function makeValid(element) {
    if (!element.className.endsWith('valid_input')) {
        element.className += ' valid_input';
    }
}

// modal window utils

function closeModal() {
    modal.style.display = 'none';
    dateInput.value = '';
    companyInput.value = '';
    costInput.value = '';
    clearValidationStyle(dateInput);
    clearValidationStyle(companyInput);
    clearValidationStyle(costInput);
}

// click event handlers

addBtn.onclick = function () {
    if (editingCell && !validateCell(editingCell)) {
        notify(ADD_WHEN_EDITING_ERROR);
    } else {
        modal.style.display = 'block';
    }
};

closeBtn.onclick = closeModal;

saveBtn.onclick = function () {
    let isDateValid = validateDate(dateInput.value);
    let errorMsg = '';
    if (isDateValid) {
        clearValidationStyle(dateInput);
    } else {
        makeInvalid(dateInput);
        errorMsg += DATE_FORMAT_ERROR + '\n';
    }
    let isCompanyValid = validateCompany(companyInput.value);
    if (isCompanyValid) {
        clearValidationStyle(companyInput);
    } else {
        makeInvalid(companyInput);
        errorMsg += COMPANY_FORMAT_ERROR + '\n';
    }
    let isCostValid = validateCost(costInput.value);
    if (isCostValid) {
        clearValidationStyle(costInput);
    } else {
        makeInvalid(costInput);
        errorMsg += COST_FORMAT_ERROR + '\n';
    }
    if (errorMsg) {
        notify(errorMsg.substr(0, errorMsg.length - 1));
    }
    let isExists = existsPoint(dateInput.value, companyInput.value, costInput.value);
    if (isExists) {
        notify(DUPLICATE_ROW_ERROR);
    }
    if (isDateValid && isCompanyValid && isCostValid && !isExists) {
        createRow(dateInput.value, companyInput.value, costInput.value);
        closeModal();
    }
};

document.onclick = function (event) {
    let target = event.target;
    if (editingCell) {
        if (editingCell.contains(target)) return;
        let msg = updateCell(editingCell);
        if (msg) {
            makeInvalid(editingCell);
            if (!addBtn.contains(target)) {
                notify(msg);
            }
            return;
        } else {
            unsetCellToEdit();
        }
    }
    if (table.contains(target) && target.nodeName === 'TD') {
        setCellToEdit(target);
    }
};

// cells utils

function updateCell(cell) {
    let newValue = cell.childNodes[0].value;
    if (newValue === editingValue) return '';
    let classname = cell.className.split(' ')[0];
    let row = cell.parentNode;
    let rowDate =  row.childNodes[0].innerText;
    let rowCompany = row.childNodes[1].innerText;
    let rowCost = row.childNodes[2].innerText;
    switch (classname) {
        case 'date':
            if (!validateDate(newValue)) {
                return  DATE_FORMAT_ERROR;
            }
            if (existsPoint(rowDate, newValue, rowCost)) {
                return  DUPLICATE_ROW_ERROR;
            }
            updatePointDate(editingValue, rowCompany, rowCost, newValue);
            break;
        case 'company':
            if (!validateCompany(newValue)) {
                return COMPANY_FORMAT_ERROR;
            }
            if (existsPoint(rowDate, newValue, rowCost)) {
                return DUPLICATE_ROW_ERROR;
            }
            removePoint(rowDate, editingValue, rowCost);
            createPoint(rowDate, newValue, rowCost);
            break;
        case 'cost':
            if (!validateCost(newValue)) {
                return COST_FORMAT_ERROR;
            }
            if (existsPoint(rowDate, rowCompany, newValue)) {
                return DUPLICATE_ROW_ERROR;
            }
            updatePointCost(rowDate, rowCompany, editingValue, newValue);
    }
    chart.update();
    return '';
}

function setCellToEdit(cell) {
    makeValid(cell);
    editingCell = cell;
    editingValue = cell.innerText;
    let input = document.createElement('input');
    input.className = 'table_input';
    input.value = editingCell.innerText;
    editingCell.innerText = '';
    editingCell.appendChild(input);
    input.focus();
}

function unsetCellToEdit() {
    clearValidationStyle(editingCell);
    editingCell.innerText = editingCell.childNodes[0].value;
    editingCell = undefined;
    editingValue = undefined;
}

// table updating utils

function createRow(date, company, cost) {
    let row = document.createElement('tr');
    row.appendChild(createCell(date, 'date'));
    row.appendChild(createCell(company, 'company'));
    row.appendChild(createCell(cost, 'cost'));
    createDeleteBtn(row);
    createPoint(date, company, cost);
    chart.update();
    table.appendChild(row);
}

function createCell(content, classname) {
    let cell = document.createElement('td');
    cell.innerText = content;
    cell.className = classname;
    return cell;
}

function createDeleteBtn(row) {
    let img = document.createElement('img');
    img.setAttribute('src', 'pictures/delete_icon.png');
    img.className = 'delete_btn_img';
    img.addEventListener('click', function () { removeRow(row); });
    let btn = document.createElement('button');
    btn.className = 'delete_btn';
    btn.appendChild(img);
    let cell = document.createElement('td');
    cell.className = 'delete_cell';
    cell.appendChild(btn);
    row.appendChild(cell);
    row.onmouseover = function () { img.style.display = 'block'; }
    row.onmouseout = function () { img.style.display = 'none'; };
}

function removeRow(row) {
    row.addEventListener('animationend', function () {
        let table = document.querySelector('table');
        if (row.contains(editingCell)) {
            editingCell = undefined;
            editingValue = undefined;
        }
        removePoint(row.childNodes[0].innerText, row.childNodes[1].innerText, row.childNodes[2].innerText);
        chart.update();
        table.removeChild(row);
    });
    row.className = 'remove_row_animation';
}

// table initialization

createRow('07.01.2019', 'Автоваз', '2100');
createRow('01.01.2019', 'Газпром', '2000');
createRow('01.01.2019', 'Автоваз', '2500');
createRow('05.01.2019', 'Сбербанк', '10000');
createRow('10.01.2019', 'Газпром', '2500');