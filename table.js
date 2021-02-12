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

function randColor() {
    let r = Math.floor(Math.random() * (256)),
        g = Math.floor(Math.random() * (256)),
        b = Math.floor(Math.random() * (256));
    return '#' + r.toString(16) + g.toString(16) + b.toString(16);
}

let datasets = []

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
            ]
        }
    }
});

function existsElement(date, company, cost) {
    return datasets.some(function (dataset) {
        return dataset.label === company && dataset.data.some(function (point) {
            return point.x === date && point.y == cost;
        });
    });
}

addBtn.onclick = function () {
    if (editingCell && validateCell(editingCell)) {
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
        makeValid(dateInput);
    } else {
        makeInvalid(dateInput);
        errorMsg += DATE_FORMAT_ERROR + '\n';
    }
    let isCompanyValid = validateCompany(companyInput.value);
    if (isCompanyValid) {
        makeValid(companyInput);
    } else {
        makeInvalid(companyInput);
        errorMsg += COMPANY_FORMAT_ERROR + '\n';
    }
    let isCostValid = validateCost(costInput.value);
    if (isCostValid) {
        makeValid(costInput);
    } else {
        makeInvalid(costInput);
        errorMsg += COST_FORMAT_ERROR + '\n';
    }
    if (errorMsg) {
        notify(errorMsg.substr(0, errorMsg.length - 1));
    }
    let isExists = existsElement(dateInput.value, companyInput.value, costInput.value);
    if (isExists) {
        notify(DUPLICATE_ROW_ERROR);
    }
    if (isDateValid && isCompanyValid && isCostValid && !isExists) {
        table.appendChild(createRow(dateInput.value, companyInput.value, costInput.value));
        closeModal();
    }
};

function closeModal() {
    modal.style.display = 'none';
    clearInput();
}

function clearInput() {
    dateInput.value = '';
    companyInput.value = '';
    costInput.value = '';
    makeValid(dateInput);
    makeValid(companyInput);
    makeValid(costInput);
}

function makeValid(input) {
    input.className = input.className.split(' ')[0];
}

function makeInvalid(input) {
    if (!input.className.endsWith('invalid_input')) {
        input.className += ' invalid_input';
    }
}

let editingCell;
let editingValue;

document.onclick = function (event) {
    let target = event.target;
    if (editingCell) {
        let input = editingCell.childNodes[0];
        if (target == editingCell || target == input) return;
        let classname = editingCell.className.split(' ')[0];
        if (input.value !== editingValue) {
            let message = validateCell(editingCell);
            if (message) {
                makeInvalid(editingCell);
                if (target !== addBtn && target !== addBtn.childNodes[0]) {
                    notify(message);
                }
                return;
            }
            updateDataset(editingCell, editingValue);
        }
        editingCell.innerText = input.value;
        editingCell.className = classname;
        editingCell = undefined;
        editingValue = undefined;
    }
    if (!table.contains(target) || target.nodeName != 'TD') return;
    target.className += ' valid_input';
    editingCell = target;
    editingValue = target.innerText;
    let input = document.createElement('input');
    input.className = 'table_input';
    input.value = editingCell.innerText;
    editingCell.innerText = '';
    editingCell.appendChild(input);
    input.focus();
};

function validateCell(cell) {
    let classname = cell.className.split(' ')[0];
    let input = cell.childNodes[0];
    let row = cell.parentNode;
    switch (classname) {
        case 'date':
            if (!validateDate(input.value)) {
                return DATE_FORMAT_ERROR;
            }
            if (existsElement(row.childNodes[0].innerText, input.value, row.childNodes[2].innerText)) {
                return DUPLICATE_ROW_ERROR;
            }
            break;
        case 'company':
            if (!validateCompany(input.value)) {
                return COMPANY_FORMAT_ERROR;
            }
            if (existsElement(row.childNodes[0].innerText, input.value, row.childNodes[2].innerText)) {
                return DUPLICATE_ROW_ERROR;
            }
            break;
        case 'cost':
            if (!validateCost(input.value)) {
                return COST_FORMAT_ERROR;
            }
            if (existsElement(row.childNodes[0].innerText, row.childNodes[1].innerText, input.value)) {
                return DUPLICATE_ROW_ERROR;
            }
    }
    return '';
}

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

function createRow(date, company, cost) {
    let row = document.createElement('tr');
    row.appendChild(createCell(date, 'date'));
    row.appendChild(createCell(company, 'company'));
    row.appendChild(createCell(cost, 'cost'));
    createDeleteBtn(row);
    let dataset = datasets.find(function (d) {
        return d.label === company;
    });
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
    })
    dataset.data.sort(dataSortCompareFunction);
    chart.update();
    return row;
}

function dataSortCompareFunction(d1, d2) {
    let date1 = new Date(d1.x);
    let date2 = new Date(d2.x);
    if (date1 > date2) {
        return 1;
    }
    if (date2 > date1) {
        return -1;
    }
    return 0;
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
    img.style.display = 'none';
    img.style.width = '20px';
    img.style.height = '100%';
    img.addEventListener('click', function () {
        removeRow(row);
    });
    let btn = document.createElement('button');
    btn.className = 'delete_btn';
    btn.appendChild(img);
    let cell = document.createElement('td');
    cell.className = 'delete_cell';
    cell.appendChild(btn);
    row.appendChild(cell);
    row.onmouseover = function () {
        img.style.display = 'block';
    }
    row.onmouseout = function () {
        img.style.display = 'none';
    };
}

function removeRow(row) {
    row.addEventListener('animationend', function () {
        let table = document.querySelector('table');
        if (row.contains(editingCell)) {
            editingCell = undefined;
            editingValue = undefined;
        }
        removeRowFromDataset(row);
        table.removeChild(row);
    });
    row.className = 'remove_row_animation';
}

function removeRowFromDataset(row) {
    let company = row.childNodes[1].innerText;
    let date = row.childNodes[0].innerText;
    let cost = row.childNodes[2].innerText;
    let dataset = datasets.find(function (d) {
        return d.label === company;
    });
    if (dataset.data.length === 1) {
        datasets.splice(datasets.indexOf(dataset), 1);
    } else {
        dataset.data.splice(dataset.data.findIndex(function (point) {
            return point.x === date && point.y == cost;
        }), 1);
    }
    chart.update();
}

function updateDataset(cell, prevValue) {
    let classname = cell.className.split(' ')[0];
    let input = cell.childNodes[0];
    let row = cell.parentNode;
    let dataset;
    let index;
    switch (classname) {
        case 'date':
            dataset = datasets.find(function (d) {
                return d.label === row.childNodes[1].innerText;
            });
            index = dataset.data.findIndex(function (point) {
                return point.x === prevValue && point.y == row.childNodes[2].innerText;
            });
            dataset.data[index].x = input.value;
            dataset.data.sort(dataSortCompareFunction);
            break;
        case 'company':
            let prevDataset = datasets.find(function (d) {
                return d.label === prevValue;
            });
            if (prevDataset.data.length === 1) {
                datasets.splice(datasets.findIndex(function (d) {
                    return d.label === prevValue;
                }), 1);
            } else {
                prevDataset.data.splice(prevDataset.data.findIndex(function (point) {
                    return point.x === row.childNodes[0].innerText && point.y == row.childNodes[2];
                }), 1);
            }
            let newDataset = datasets.find(function (d) {
                return d.label === input.value;
            });
            if (!newDataset) {
                let color = randColor();
                newDataset = {
                    label: input.value,
                    backgroundColor: color,
                    borderColor: color,
                    data: [],
                    fill: false
                };
                datasets.push(newDataset);
            }
            newDataset.data.push({
                x: row.childNodes[0].innerText,
                y: row.childNodes[2].innerText
            });
            newDataset.data.sort(dataSortCompareFunction);
            break;
        case 'cost':
            dataset = datasets.find(function (d) {
                return d.label === row.childNodes[1].innerText;
            });
            index = dataset.data.findIndex(function (point) {
                return point.x === row.childNodes[0].innerText && point.y == prevValue;
            });
            dataset.data[index].y = input.value;
            break;
    }
    chart.update();
}

let timeout;

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

table.appendChild(createRow('07.01.2019', 'Автоваз', '2100'));
table.appendChild(createRow('01.01.2019', 'Газпром', '2000'));
table.appendChild(createRow('01.01.2019', 'Автоваз', '2500'));
table.appendChild(createRow('05.01.2019', 'Сбербанк', '10000'));
table.appendChild(createRow('10.01.2019', 'Газпром', '2500'));