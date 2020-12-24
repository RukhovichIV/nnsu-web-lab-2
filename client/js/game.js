var socket = new WebSocket("ws://localhost:8080/ws");

let field_size = 10;

socket.onopen = function () {
    place_field();
    return;
}

socket.onerror = function (error) {
    alert("Ошибка: " + error.data);
    return;
}

socket.onmessage = function (message) {
    let data = JSON.parse(message.data);
    let status = document.getElementById('status');
    if (!data.game_started) {        
        let field_image = document.getElementById('battlefield');
        field_image.style.visibility = 'visible';
        if (data.turn) {
            status.innerText = `Ваш ход. Вирусов осталось: ${moves}`;
        } else {
            status.innerText = `Ход противника.`
        }        
        turn = data.turn;
        is_first = data.turn;
        if (data.turn) {
            cell_states[0] = 'red_virus.png';
            cell_states[1] = 'blue_virus.png';
            cell_states[2] = 'red_wall.png';
            cell_states[3] = 'blue_wall.png';

            cell_states[4] = 'red_wall_b.png';
            cell_states[5] = 'blue_wall_b.png';
        } else {
            cell_states[0] = 'blue_virus.png';
            cell_states[1] = 'red_virus.png';
            cell_states[2] = 'blue_wall.png';
            cell_states[3] = 'red_wall.png';

            cell_states[4] = 'blue_wall_b.png';
            cell_states[5] = 'red_wall_b.png';
        }
        field = [];
        moves = 3;
        for (i = 0; i < size; i++) {
            field[i] = new Array(size).fill(0);
        }
    } else {
        let data = JSON.parse(message.data);
        if (data.error) {
            alert("Неправильный ход");
        } else {
            for (const cell of data.points) {
                field[cell[0]][cell[1]] = cell[2];
                let cell_image = document.getElementById(`${cell[0]}_${cell[1]}`)
                cell_image.src = `/images/` + cell_states[cell[2] - 1];
            }
            moves = data.moves;
            turn = data.turn;
            if (data.turn) {
                status.innerText = `Ваш ход. Вирусов осталось: ${moves}`;
            } else {
                status.innerText = `Ход противника.`
            }
            if (data.game_ended) {
                if (data.winner) {
                    alert("Поздравляем! Вы победили");
                } else {
                    alert("К сожалению, Вы проиграли");
                }
                window.location.href = "index.html";
            }
        }

    }

}

let field;

function place_field() {
    let wrapper = document.getElementById("battlefield");
    alert(wrapper);
    wrapper.style.gridTemplateColumns = `repeat(${field_size}, 1fr)`;
    wrapper.style.gridTemplateRows = `repeat(${field_size}, 1fr)`;
    let buffer = ``;
    for (i = 0; i < field_size; i++) {
        for (j = 0; j < field_size; j++) {
            buffer += 
                `<div class='cell' onclick='click(${i}, ${j})'>
                     <img id='${i}_${j}' src='../res/res_empty.png' style='max-height:100%; draggable="false";'>  
                 </div>\n`;
        }
    }
    wrapper.innerHTML = buffer;
}