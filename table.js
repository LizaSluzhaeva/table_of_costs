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

let table = document.querySelector('table');
let modal = document.getElementById('modal');
let addBtn = document.getElementById('add_btn');
let closeBtn = document.getElementById('close_btn');
let saveBtn = document.getElementById('save_btn');
let dateInput = document.getElementById('input_date');
let companyInput = document.getElementById('input_company');
let costInput = document.getElementById('input_cost');
let existsErrorMsg = document.getElementById('exists_error');

addBtn.onclick = function () {
    modal.style.display = 'block';
};

closeBtn.onclick = closeModal;

saveBtn.onclick = function () {
    let isDateValid = validateDate(dateInput.value);
    if (isDateValid) {
        makeValid(dateInput);
    } else {
        makeInvalid(dateInput);
    }
    let isCompanyValid = validateCompany(companyInput.value);
    if (isCompanyValid) {
        makeValid(companyInput);
    } else {
        makeInvalid(companyInput);
    }
    let isCostValid = validateCost(costInput.value);
    if (isCostValid) {
        makeValid(costInput);
    } else {
        makeInvalid(costInput)
    }
    let isExists = existsElement(dateInput.value, companyInput.value, costInput.value);
    if (isExists) {
        existsErrorMsg.style.display = 'block';
    } else {
        existsErrorMsg.style.display = 'none';
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
    existsErrorMsg.style.display = 'none';
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

document.onclick = function (event) {
    let target = event.target;
    if (editingCell) {
        let input = editingCell.childNodes[0];
        if (target == editingCell || target == input) return;
        let classname = editingCell.className.split(' ')[0];
        if (!validateCell(classname, input)) {
            makeInvalid(editingCell);
            return;
        }
        editingCell.innerText = input.value;
        editingCell.className = classname;
        editingCell = undefined;
    }
    if (!table.contains(target) || target.nodeName != 'TD') return;
    target.className += ' valid_input';
    editingCell = target;
    let input = document.createElement('input');
    input.className = 'table_input';
    input.value = editingCell.innerText;
    editingCell.innerText = '';
    editingCell.appendChild(input);
    input.focus();
};

function validateCell(classname, input) {
    if (classname === 'date') {
        return validateDate(input.value);
    } else if (classname === 'company') {
        return validateCompany(input.value);
    } else if (classname === 'cost') {
        return validateCost(input.value);
    }
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
    dataset.data.sort(function (d1, d2) {
        let date1 = new Date(d1.x);
        let date2 = new Date(d2.x);
        if (date1 > date2) {
            return 1;
        }
        if (date2 > date1) {
            return -1;
        }
        return 0;
    })
    chart.update();
    return row;
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
        }
        table.removeChild(row);
    });
    row.className = 'remove_row_animation';
}

table.appendChild(createRow('07.01.2019', 'Автоваз', '2100'));
table.appendChild(createRow('01.01.2019', 'Газпром', '2000'));
table.appendChild(createRow('01.01.2019', 'Автоваз', '2500'));
table.appendChild(createRow('05.01.2019', 'Сбербанк', '10000'));
table.appendChild(createRow('10.01.2019', 'Газпром', '2500'));