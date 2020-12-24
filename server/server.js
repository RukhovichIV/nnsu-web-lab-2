let exp_pack = require('express');
let sql_pack = require('mysql');
let http_pack = require('http');
let ws_pack = require('ws');
let bp_pack = require('body-parser');
let fs_pack = require('fs');

let app = exp_pack();
let server = http_pack.createServer(app);
let socket_server = new ws_pack.Server({ server });
server.listen(8080);

app.use(exp_pack.static('..'));
app.use(bp_pack.urlencoded({ extended: true }));
app.use(bp_pack.json());
app.listen(3000, function(error) {
    if (error) {
        console.log(error);
        return;
    }
    console.log("Server is listening on port 3000");
});

var sql_connection = sql_pack.createConnection({
    host: "localhost",
    user: "root",
    port: "3008",
    password: "12345678",
    database: "results"
});

sql_connection.connect(function (error) {
    if (error) {
        console.log(error);
        return;
    }
    console.log("Connection to database established succesfuly");
});

let field_size = 10;

let clients = [];
let fields = [];
let cells_left = [20, 20];

socket_server.on('connection', function connection(ws, req) {
    clients.push(ws);
    if (clients.length == 2) {
        clients[0].send(JSON.stringify({type: "found_game", turn: true}));
        clients[1].send(JSON.stringify({type: "found_game", turn: false}));
        start_date = new Date();
    }
    else if (clients.length == 1) { }
    else {
        console.log("В игре может быть не больше 2 человек");
    }

    ws.on('message', function incoming(message) {
        let player = clients.findIndex(function (item) { return item === ws });
        let data = JSON.parse(message);

        if (data.type == "start") {
            fields[player] = data.field;
            clients[1 - player].send(JSON.stringify({type: "enemy", field: fields[player]}));
        } else if (data.type == "turn") {
            let x = data.where[0], y = data.where[1];
            if (fields[1 - player][x][y] == 0) {
                fields[1 - player][x][y] == 3;
                clients[player].send(JSON.stringify({type: "turn", where: [x, y], val: "missed"}));
                clients[1 - player].send(JSON.stringify({type: "enemy_turn", where: [x, y], val: "missed"}));
            } else {
                fields[1 - player][x][y] == 2;
                clients[player].send(JSON.stringify({type: "turn", where: [x, y], val: "killed"}));
                clients[1 - player].send(JSON.stringify({type: "enemy_turn", where: [x, y], val: "killed"}));
                cells_left[1 - player]--;
                if (cells_left[1 - player] == 0) {
                    clients[player].send(JSON.stringify({type: "end", victory: "true"}));
                    clients[1 - player].send(JSON.stringify({type: "end", victory: "false"}));
                    clients[0].close();
                    clients[1].close();
                    clients = [];
                    let end_date = new Date();
                    let result = (0 == player) ? "Victory" : "Defeat";

                    sql_connection.query("INSERT INTO `results`.`game` (`date`, `dur`, `result`) VALUES (?, ?, ?);",
                                        [start_date, Math.round((end_date - start_date) / 1000), result],
                                        function (error) {
                                            if (error) {
                                                console.log(error);
                                                return;
                                            }
                                        });
                }
            }
        }
    });
})

app.get("/", function (req, res) {
    var html = fs_pack.readFileSync('../client/index.html');
    res.end(html);
});


app.get("/get_archive", function (req, res) {
    sql_connection.query("SELECT * FROM results.game;", function (error, rows) {
        if (error) {
            console.log(error);
            return;
        }
        res.end(JSON.stringify(rows));
    });
})
