ymaps.ready(init);

function init() {
    var myMap = new ymaps.Map("map", {
        center: [53.907673, 30.343117], 
        zoom: 15
    });

    var myPlacemark = new ymaps.Placemark([53.907673, 30.343117], {
        hintContent: 'Our Office',
        balloonContent: 'Belarus, Mogilev, Lenin Boulevard, 5'
    });

    myMap.geoObjects.add(myPlacemark);
}