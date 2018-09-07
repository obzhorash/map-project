import "./styles/styles.scss";
import reviewTemplate from "../map-hbs.hbs";
import comentTemplate from "../coment.hbs";
const container = document.querySelector(".container");

ymaps.ready(init);

let markers = [];

function init() {
    let myMap = new ymaps.Map("map", {
        center: [55.76, 37.64],

        zoom: 11,
        controls: ["zoomControl", "fullscreenControl"]
    });

    let clusterer = new ymaps.Clusterer({ clusterDisableClickZoom: true });
    myMap.geoObjects.add(clusterer);

    myMap.events.add("click", async e => {
        const coords = e.get("coords");
        const position = e.get("position");

        const response = await ymaps.geocode(coords);
        const address = response.geoObjects.get(0).getAddressLine();

        removePlacemark();

        const placemark = new ymaps.Placemark(coords);
        let id = Date.now();
        placemark.properties.set("id", id);
        placemark.properties.set("type", "placemark");
        placemark.properties.set("address", address);
        placemark.properties.set("position", position);
        myMap.geoObjects.add(placemark);
        clusterer.add(placemark);
        markers.push(placemark);
        openPopupReview(position, address, id);
    });

    myMap.geoObjects.events.add("click", e => {
        const target = e.get("target");
        const { properties } = target;

        if (properties.get("type") !== "placemark") return;

        openPopupReview(
            properties.get("position"),
            properties.get("address"),
            properties.get("id")
        );
        showComments(properties.get("id"));
        removePlacemark();
    });

    function openPopupReview(position, address, id) {
        const popup = reviewTemplate({ address });
        const container = document.querySelector(".container");

        container.setAttribute("data-id", id);
        container.style.left = `${position[0]}px`;
        container.style.top = `${position[1]}px`;
        container.innerHTML = popup;

        const button = document.querySelector(".button-popup");
        const close = document.querySelector(".popup__close");

        button.addEventListener("click", saveReview);
        close.addEventListener("click", closePopup);
    }

    function saveReview() {
        let review = {
            username: document.querySelector(".input-username").value,
            place: document.querySelector(".input-place").value,
            text: document.querySelector(".text-coment").value,
            date: new Date().toLocaleString()
        };

        let marker;

        if (!review.username || !review.place || !review.text) {
            return;
        }

        markers.forEach(item => {
            if (
                item.properties.get("id") == container.getAttribute("data-id")
            ) {
                marker = item;
            }
        });

        let oldReviews = marker.properties.get("reviews") || [];

        oldReviews.push(review);
        marker.properties.set("reviews", oldReviews);
        showComments(marker.properties.get("id"));
        clearInput();
    }
    function closePopup() {
        container.innerHTML = "";
        removePlacemark();
    }
    function removePlacemark() {
        markers.forEach(item => {
            if (item.properties.get("reviews") === undefined) {
                myMap.geoObjects.remove(item);

                clusterer.remove(item);
            }
        });
    }
}

function clearInput() {
    document.querySelector(".input-username").value = "";
    document.querySelector(".input-place").value = "";
    document.querySelector(".text-coment").value = "";
}

function showComments(id) {
    let markerReviews;

    markers.forEach(item => {
        if (id === item.properties.get("id")) {
            markerReviews = item.properties.get("reviews");
        }
    });
    const coments = comentTemplate({ items: markerReviews });
    const popupComments = document.querySelector(".popup__comments");
    popupComments.innerHTML = coments;
}
