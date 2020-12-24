var socket = new WebSocket("ws://localhost:8080/ws");

let iam_ready = false;
let enemyis_ready = false;
let game_is_started = false;
let selected_cell = [10, 10];
let my_turn = false;
let field_size = 10;

let cells = new Map([["empty", "/client/res/res_empty.png"],
                    ["ship", "/client/res/res_ship.png"],
                    ["killed", "/client/res/res_killed.png"],
                    ["miss", "/client/res/res_miss.png"],
                    ["selected", "/client/res/res_selected.png"]]);
let my_field = [];
let their_field = [];

socket.onopen = function () {
    place_field();
    return;
}

socket.onerror = function (error) {
    alert("Ошибка: " + error.data);
    return;
}

socket.onmessage = function(message) {
    let data = JSON.parse(message.data);
    let status_field = document.getElementById('status');
    let my_field_html = document.getElementById('my_field');
    let their_field_html = document.getElementById('their_field');
    if (data.type == "found_game") {
        my_field_html.style.visibility = 'visible';
        their_field_html.style.visibility = 'visible';
        status_field.innerHTML = 'Расставьте свои корабли и нажмите "Утвердить"';
        for (i = 0; i < field_size; i++) {
            my_field[i] = new Array(field_size).fill(0);
            their_field[i] = new Array(field_size).fill(0);
        }
        my_turn = data.turn;
    } else if (data.type == "enemy") {
        their_field = data.field;
        enemyis_ready = true;
        if (iam_ready && enemyis_ready) {
            game_is_started = true;
            if (my_turn) {
                status_field.innerHTML = 'Игра началась. Ваш ход';
            } else {
                status_field.innerHTML = 'Игра началась. Ход соперника';
            }
        }
    } else if (data.type == "turn") {
        let x = data.where[0], y = data.where[1];
        if (data.val == "missed") {
            cell = document.getElementById(`${x}_${y}_1`);
            cell.src = cells.get("miss");
            their_field[x][y] = 3;
        } else if (data.val == "killed") {
            cell = document.getElementById(`${x}_${y}_1`);
            cell.src = cells.get("killed");
            their_field[x][y] = 2;
        }
        status_field.innerHTML = 'Ход соперника';
    } else if (data.type == "enemy_turn") {
        let x = data.where[0], y = data.where[1];
        if (data.val == "missed") {
            cell = document.getElementById(`${x}_${y}_0`);
            cell.src = cells.get("miss");
            my_field[x][y] = 3;
        } else if (data.val == "killed") {
            cell = document.getElementById(`${x}_${y}_0`);
            cell.src = cells.get("killed");
            my_field[x][y] = 2;
        }
        my_turn = true;
        status_field.innerHTML = 'Ваш ход';
    } else if (data.type == "end") {
        if (data.victory) {
            alert("Вы победили!");
        } else {
            alert("Вы проиграли");
        }
        document.location = "/index.html";
    }
}

function field_click(x, y, which) {
    if (!iam_ready && which == 0) {
        cell = document.getElementById(`${x}_${y}_0`);
        if (my_field[x][y] == 0) {
            my_field[x][y] = 1;
            cell.src = cells.get("ship");
        } else if (my_field[x][y] == 1){
            my_field[x][y] = 0;
            cell.src = cells.get("empty");
        }
    } else if (game_is_started && which == 1) {
        cell = document.getElementById(`${x}_${y}_1`);
        if (selected_cell[0] == 10) {
            if (their_field[x][y] == 2 || their_field[x][y] == 3) {
                return;
            }
            cell.src = cells.get("selected");
            selected_cell = [x, y];
        } else if (selected_cell[0] == x && selected_cell[1] == y){
            cell.src = cells.get("empty");
            selected_cell = [10, 10];
        }
    }
}

function submit_field() {
    ships = new Array(5).fill(0);
    for (x = 0; x < field_size; x++) {
        for (y = 0; y < field_size; y++) {
            if (my_field[x][y]) {
                let ship_size = 1;
                if (exists(x - 1, y) && my_field[x - 1][y] ||
                  exists(x + 1, y) && my_field[x + 1][y]) {
                    let le = x, ri = x;
                    while (le - 1 >= 0 && my_field[le - 1][y]) {
                        le--;
                    }
                    while (ri + 1 < field_size && my_field[ri + 1][y]) {
                        ri++;
                    }
                    let ship_size_x = ri - le + 1;
                    for (pos = le - 1; pos <= ri + 1; pos++) {
                        if (exists(pos, y - 1) && my_field[pos][y - 1] || 
                          exists(pos, y + 1) && my_field[pos][y + 1]) {
                              alert("Неправильное расположение кораблей X");
                              alert(x + " | " + y + " | " + pos);
                              return;
                          }
                    }
                    ship_size = ship_size_x;
                }
                if (exists(x, y - 1) && my_field[x][y - 1] ||
                  exists(x, y + 1) && my_field[x][y + 1]) {
                    let le = y, ri = y;
                    while (le - 1 >= 0 && my_field[x][le - 1]) {
                        le--;
                    }
                    while (ri + 1 < field_size && my_field[x][ri + 1]) {
                        ri++;
                    }
                    let ship_size_y =  ri - le + 1;
                    for (pos = le - 1; pos <= ri + 1; pos++) {
                        if (exists(x - 1, pos) && my_field[x - 1][pos] || 
                            exists(x + 1, pos) && my_field[x + 1][pos]) {
                                alert("Неправильное расположение кораблей Y");
                                alert(x + " | " + y);
                                return;
                            }
                    }
                    if (ship_size_y > ship_size) {
                        ship_size = ship_size_y;
                    }
                }
                if (ship_size == 1) {
                    if (ships[1] == 4) {
                        alert("Слишком много кораблей размера 1");
                        return;
                    }
                    ships[1]++;
                    // alert("НАШЕЛ КОРАБЛЬ РАЗМЕРА 1 В " + x + " : " + y);
                } else if (ship_size == 2) {
                    if (ships[2] == 6) {
                        alert("Слишком много кораблей размера 2");
                        return;
                    }
                    ships[2]++;
                    // alert("НАШЕЛ КОРАБЛЬ РАЗМЕРА 2 В " + x + " : " + y);
                } else if (ship_size == 3) {
                    if (ships[3] == 6) {
                        alert("Слишком много кораблей размера 3");
                        return;
                    }
                    ships[3]++;
                    // alert("НАШЕЛ КОРАБЛЬ РАЗМЕРА 3 В " + x + " : " + y);
                } else if (ship_size == 4) {
                    if (ships[4] == 4) {
                        alert("Слишком много кораблей размера 4");
                        return;
                    }
                    ships[4]++;
                    // alert("НАШЕЛ КОРАБЛЬ РАЗМЕРА 4 В " + x + " : " + y);
                } else if (ship_size > 4) {
                    alert("Слишком большой корабль");
                    return;
                }
            }
        }
    }
    if (ships[1] != 4 || ships[2] != 6 || ships[3] != 6 || ships[4] != 4) {
        alert("Не все корабли на месте");
        alert(ships[1] + " | " + ships[2] + " | " + ships[3] + " | " + ships[4]);
        return;
    }

    document.turn.submit_butt.style.visibility = "collapse";
    iam_ready = true;
    if (iam_ready && enemyis_ready) {
        game_is_started = true;
        let status_field = document.getElementById('status');
        if (my_turn) {
            status_field.innerHTML = 'Игра началась. Ваш ход';
        } else {
            status_field.innerHTML = 'Игра началась. Ход соперника';
        }
    }
    socket.send(JSON.stringify({type: "start", field: my_field}));
}

function exists(x, y) {
    return x >= 0 && y >= 0 && x < field_size && y < field_size;
}

function make_turn() {
    if (!my_turn) {
        alert("Дождитесь своего хода");
        return;
    }
    if (selected_cell[0] == 10) {
        alert("Выберите клетку");
    } else {
        my_turn = false;
        socket.send(JSON.stringify({type: "turn", where: [selected_cell[0], selected_cell[1]]}));
        selected_cell = [10, 10];
    }
}

function place_field() {
    let wrapper_my = document.getElementById("my_field");
    let wrapper_their = document.getElementById("their_field");
    wrapper_my.style.gridTemplateColumns = `repeat(${field_size}, 1fr)`;
    wrapper_my.style.gridTemplateRows = `repeat(${field_size}, 1fr)`;
    wrapper_their.style.gridTemplateColumns = `repeat(${field_size}, 1fr)`;
    wrapper_their.style.gridTemplateRows = `repeat(${field_size}, 1fr)`;
    let buffer_my = ``;
    let buffer_their = ``;
    for (i = 0; i < field_size; i++) {
        for (j = 0; j < field_size; j++) {
            buffer_my += 
                `<div class='cell' onclick='field_click(${i}, ${j}, 0);'>
                     <img id='${i}_${j}_0' src='/client/res/res_empty.png' style='width:100%; draggable="false"; display: block;'>  
                 </div>\n`;
            buffer_their += 
                 `<div class='cell' onclick='field_click(${i}, ${j}, 1);'>
                      <img id='${i}_${j}_1' src='/client/res/res_empty.png' style='width:100%; draggable="false"; display: block;'>  
                  </div>\n`;
        }
    }
    wrapper_my.innerHTML = buffer_my;
    wrapper_their.innerHTML = buffer_their;
}