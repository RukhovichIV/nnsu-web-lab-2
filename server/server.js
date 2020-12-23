var express = require("express");
var app = express();
app.use(express.static('public'));
var db = require("mysql");

var price = [100, 150, 200]; 

var connection = db.createConnection({
	host:"localhost",
	port:"3008",
	user:"root",
	password:"12345678", database:"world"
});

connection.connect(function(err) {
	if (err) {
		console.log(err);
	} else {
		console.log("connection established");
	}
});

app.get("/check/:point/:name/:tel/:bike_id", function(req, res) {

    const sql = 'SELECT * FROM bicycle_rental.rent WHERE tel=?';
    const filter = [[req.params.tel]];

    connection.query(sql, filter, function(err, rows) {
        if (err) {
            console.log(err);
            return;
        }
        if (rows.length) {
            //На данный телефон уже оформленна поездка
            res.end(`<script>
                        alert("Mistake! The phone is used.");
                        window.close();
                    </script>`);
        } else {
            //Поездка не оформленна
            var str = `window.location.href = 'http://localhost:3000/start/` + req.path.substr(7) + `';`;
            res.end(`<p><input type='button' onclick="` + str + `" value='Start' style='height:40px; width:200px; font-family: sans-serif; font-size: 20px;'></p>`);
        }
    });
});

app.get("/start/:point/:name/:tel/:bike_id", function(req, res) {

    var now = new Date();

    const sql = `INSERT INTO bicycle_rental.rent (point, name, tel, time, bike_id) VALUES (?);`;
    const filter = [[req.params.point, req.params.name, req.params.tel, now, req.params.bike_id]];

    connection.query(sql, filter, function(err, rows) {
        if (err) {
            console.log(err);
            return;
        }
        var str = `window.location.href = 'http://localhost:3000/finish/` + req.path.substr(7) + `';`;
        res.end(`<p><input type='button' onclick="` + str + `" value='Finish' style='height:40px; width:200px; font-family: sans-serif; font-size: 20px;'></p>`);
    });
});

app.get("/finish/:point/:name/:tel/:bike_id", function(req, res) {

    var now = new Date();

    var time_start;

    const sql1 = 'SELECT * FROM bicycle_rental.rent WHERE tel=?';
    const filter1 = [[req.params.tel]];

    connection.query(sql1, filter1, function(err, rows) {
        if (err) {
            console.log(err);
            return;
        }
        time_start = rows[0].time;
    });

    const sql2 = `DELETE FROM bicycle_rental.rent WHERE tel=?;`;
    const filter2 = [[req.params.tel]];

    connection.query(sql2, filter2, function(err, rows) {
        if (err) {
            console.log(err);
            return;
        }
        var cur_price = price[req.params.bike_id] * Math.ceil((now - time_start) / 1000 / 60 / 60);
        var hours = Math.floor((now - time_start) / 1000 / 60 / 60);
        var minutes = Math.ceil((now - time_start) / 1000 / 60);
        res.end(`<script>
                    alert("` + req.params.name + `, you drove for ` + hours + ` hour and ` + minutes + ` minutes. Pay ` + cur_price + ` rubles.");
                    window.close();
                </script>`);
    });
});

app.get("/123", function(req, res) {

res.end("<p>Privet</p>");


});

app.listen(3000)
