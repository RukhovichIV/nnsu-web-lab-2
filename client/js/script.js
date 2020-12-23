function getLink(bike_id) {
    var point = -1;

    if (document.form.point[0].checked) {
        point = 0;
    } else if (document.form.point[1].checked) {
        point = 1;
    } else if (document.form.point[2].checked) {
        point = 2;
    } else {
        alert("Пункт проката не выбран")
        return;
    }

    if (document.form.name.value == "") {
        alert("Введите имя")
        return;
    }

    if (document.form.tel.value.length != 10) {
        alert("Неверный формат номера")
        return;
    }

    var link = "http://localhost:3000/check/" + point + "/" + document.form.name.value + "/" + 
        document.form.tel.value + "/" + bike_id;
    document.getElementById('link').innerHTML = link;
}