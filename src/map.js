import "./styles/styles.scss";
import reviewTemplate from "./hbs-template/popup.hbs";
import comentTemplate from "./hbs-template/coment.hbs";

const container = document.querySelector(".container");
let markers = [];
let currentReview = {};

ymaps.ready(init);

function init() {
    let myMap = new ymaps.Map("map", {
        center: [55.76, 37.64],

        zoom: 11,
        controls: ["zoomControl", "fullscreenControl"]
    });

    let customItemContentLayout = ymaps.templateLayoutFactory.createClass(
        `   <div class="ballon">
            <div class="ballon__info">
                <div class="ballon__place">{{ properties.place }}</div>
                <div  class="ballon__address">{{ properties.address }}</div>
                <div class="ballon__text">{{ properties.text }}</div>
            </div>
            <div class="ballon__date">{{ properties.date }}</div>
        </div>`
    );
    let clusterer = new ymaps.Clusterer({
        clusterDisableClickZoom: true,
        clusterOpenBalloonOnClick: true,
        clusterBalloonContentLayout: "cluster#balloonCarousel",
        clusterBalloonItemContentLayout: customItemContentLayout,
        clusterBalloonPanelMaxMapArea: 0,
        clusterBalloonContentLayoutWidth: 250,
        clusterBalloonContentLayoutHeight: 130,
        clusterBalloonPagerSize: 5
    });

    myMap.geoObjects.add(clusterer);

    clusterer.events.add("balloonopen", closePopup);

    myMap.events.add("click", async e => {
        currentReview.coords = e.get("coords");
        currentReview.position = e.get("position");

        const response = await ymaps.geocode(currentReview.coords);

        currentReview.address = response.geoObjects.get(0).getAddressLine();
        openPopupReview(currentReview.position, currentReview.address);
    });

    myMap.geoObjects.events.add("click", e => {
        const target = e.get("target");
        const { properties } = target;

        if (properties.get("type") !== "placemark") return;

        openPopupReview(properties.get("position"), properties.get("address"));
        showComments(properties.get("address"));
    });

    map.addEventListener("click", e => {
        let target = e.target;

        if (target.className !== "ballon__address") return;
        const coords = [e.clientX, e.clientY];
        openPopupReview(coords, target.textContent);
    });

    function openPopupReview(position, address) {
        const popup = reviewTemplate({ address });
        const container = document.querySelector(".container");

        myMap.balloon.close();

        position = checkPosition(position);
        container.style.left = `${position[0]}px`;
        container.style.top = `${position[1]}px`;
        container.innerHTML = popup;

        const button = document.querySelector(".button-popup");
        const close = document.querySelector(".popup__close");
        showComments(address);
        button.addEventListener("click", saveReview);
        close.addEventListener("click", closePopup);
    }

    function saveReview() {
        let review = {
            username: document.querySelector(".input-username").value,
            place: document.querySelector(".input-place").value,
            text: document.querySelector(".text-coment").value,
            date: new Date().toLocaleString(),
            address: currentReview.address
        };

        if (!review.username || !review.place || !review.text) return;

        const placemark = new ymaps.Placemark(currentReview.coords, review);

        placemark.properties.set("id", Date.now());
        placemark.properties.set("type", "placemark");
        placemark.properties.set("address", currentReview.address);
        placemark.properties.set("position", currentReview.position);
        placemark.properties.set("reviews", review);
        myMap.geoObjects.add(placemark);
        clusterer.add(placemark);
        markers.push(placemark);

        showComments(currentReview.address);
        clearInput();
    }
}

function clearInput() {
    document.querySelector(".input-username").value = "";
    document.querySelector(".input-place").value = "";
    document.querySelector(".text-coment").value = "";
}

function showComments(address) {
    let markerReviews = [];

    markers.forEach(item => {
        if (address === item.properties.get("address")) {
            markerReviews.push(item.properties.get("reviews"));
        }
    });
    if (markerReviews.length === 0) return;
    const coments = comentTemplate({ items: markerReviews });
    const popupComments = document.querySelector(".popup__comments");

    popupComments.innerHTML = coments;
}

function closePopup() {
    container.innerHTML = "";
}

function checkPosition(position) {
    let h = 580;
    let w = 385;

    if (w + position[0] > document.body.clientWidth) {
        position[0] = position[0] - w;
    }
    if (h + position[1] > document.body.clientHeight) {
        position[1] = document.body.clientHeight - h;
    }

    return position;
}
