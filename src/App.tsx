import "./App.css";
import axios from "axios";
import { YMaps, Map, Placemark } from "@pbe/react-yandex-maps";
import { useEffect, useState } from "react";

interface Sight {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  description: string | null;
  type: string;
}

declare module "@pbe/react-yandex-maps" {
  interface PlacemarkProps {
    onMouseEnter?: (e: any) => void;
    onMouseLeave?: (e: any) => void;
  }
}

function App() {
  const [data, setData] = useState<Sight[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [map, setMap] = useState<any>(null);
  const [openBalloon, setOpenBalloon] = useState<Sight | null>(null);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showTypeSelection, setShowTypeSelection] = useState<boolean>(true);

  const placeTypes = [
    { id: 1, title: "Библиотеки", color: "red" },
    { id: 2, title: "Исторические и архитектурные объекты", color: "blue" },
    { id: 3, title: "Музеи", color: "green" },
    { id: 4, title: "Памятники и скульптуры", color: "yellow" },
    { id: 5, title: "Парки и природные объекты", color: "orange" },
    { id: 6, title: "Развлечения", color: "violet" },
    { id: 7, title: "Религиозные объекты", color: "black" },
    { id: 8, title: "Театры", color: "purple" },
    { id: 9, title: "Спортивные арены", color: "white" },
    { id: 10, title: "Кафе, рестораны и бары", color: "lightgray" },
  ];

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeolocationError("Геолокация не поддерживается вашим браузером");
      return;
    }

    const successHandler = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      console.log("Получены координаты:", latitude, longitude);
      setUserCoords([latitude, longitude]);
      setGeolocationError(null);
    };

    const errorHandler = (error: GeolocationPositionError) => {
      let errorMessage = "Не удалось определить местоположение";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Доступ к геолокации запрещен";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Информация о местоположении недоступна";
          break;
        case error.TIMEOUT:
          errorMessage = "Время ожидания геолокации истекло";
          break;
      }
      console.error("Ошибка геолокации:", errorMessage);
      setGeolocationError(errorMessage);
    };

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    const handleFirstInteraction = () => {
      navigator.geolocation.getCurrentPosition(
        successHandler,
        errorHandler,
        options
      );
      window.removeEventListener("click", handleFirstInteraction);
    };

    window.addEventListener("click", handleFirstInteraction);

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
    };
  }, []);

  useEffect(() => {
    axios
      .get<Sight[]>("http://127.0.0.1:5000/sights")
      .then((response) => {
        setData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        setError(error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (map && openBalloon) {
      const { latitude, longitude } = openBalloon;
      map.geoObjects.each((geoObject: any) => {
        const coords = geoObject.geometry.getCoordinates();
        if (coords[0] === latitude && coords[1] === longitude) {
          geoObject.balloon.open();
        }
      });
    }
  }, [openBalloon, map]);

  const handleOpenBalloon = (marker: Sight) => {
    setOpenBalloon(marker);
  };

  const handleRowClick = (item: Sight) => {
    handleOpenBalloon(item);
  };

  const handlePlacemarkClick = (item: Sight) => {
    setOpenBalloon(item);
  };

  const getBalloonContent = (latitude: number, longitude: number) => {
    const markersAtSameLocation = data.filter(
      (marker) => marker.latitude === latitude && marker.longitude === longitude
    );

    const markerDetails = markersAtSameLocation
      .map(
        (marker) => `
        ${marker.description ?? "Нет данных"}
      `
      )
      .join("");

    const locationName = markersAtSameLocation.length
      ? `<strong>${markersAtSameLocation[0].name}</strong><br>`
      : "";

    return `${locationName}${markerDetails}`;
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const filteredData = selectedType
    ? data.filter((sight) => sight.type === selectedType)
    : data;

  const moveToSight = (sight: Sight) => {
    if (map) {
      map.setCenter([sight.latitude, sight.longitude], 15, {
        checkZoomRange: true,
        duration: 500,
      });
    }
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    setShowTypeSelection(false);
  };

  const resetTypeSelection = () => {
    setSelectedType(null);
    setShowTypeSelection(true);
  };

  return (
    <div className="mapGID">
      <div className="sidebar">
        <div className="sidebar__content">
          <h1 className="sidebar__title">Гид-Таганрог</h1>
          {showTypeSelection && (
            <div className="list">
              {placeTypes.map((place) => (
                <button
                  key={place.id}
                  className="place-type"
                  onClick={() => handleTypeSelect(place.title)}
                >
                  <div
                    className="place-type__icon"
                    style={{ backgroundColor: place.color }}
                  >
                    <img
                      className="place-type__img"
                      src={`src/public/${place.title}.svg`}
                      alt=" "
                    />
                  </div>
                  <span className="place-type__span">{place.title}</span>
                </button>
              ))}
            </div>
          )}
          {!showTypeSelection && (
            <div className="filtered-list">
              <button
                className="filtered-list__exit"
                onClick={resetTypeSelection}
              >
                <img src="src/public/exit.svg" alt="" />
              </button>
              {filteredData.map((sight) => (
                <div
                  key={sight.id}
                  className="place-item"
                  onClick={() => {
                    handleRowClick(sight);
                    moveToSight(sight);
                  }}
                >
                  <span className="place-item__name">{sight.name}</span>
                  <span className="place-item__address">{sight.address}</span>
                </div>
              ))}
            </div>
          )}
          <div className="sidebar__ad">
            <span className="sidebar__ad-span">ВАША РЕКЛАМА</span>
            <img className="sidebar__ad-img" src="src/public/rek.svg" alt="" />
          </div>
        </div>
      </div>
      <YMaps query={{ apikey: "1a180896-a66e-4e5c-92bf-03a915bee3fd" }}>
        <Map
          options={{ yandexMapType: "map", suppressMapOpenBlock: true }}
          className="map"
          instanceRef={(ref) => setMap(ref)}
          defaultState={{ center: [47.20669, 38.929113], zoom: 15 }}
        >
          {filteredData.map((marker) => (
            <Placemark
              key={marker.id}
              geometry={[marker.latitude, marker.longitude]}
              properties={{
                balloonContent: getBalloonContent(
                  marker.latitude,
                  marker.longitude
                ),
                hintContent: marker.name,
              }}
              modules={["geoObject.addon.balloon", "geoObject.addon.hint"]}
              onClick={() => handlePlacemarkClick(marker)}
            />
          ))}

          {userCoords && (
            <Placemark
              geometry={userCoords}
              properties={{
                hintContent: "Вы здесь",
              }}
              options={{
                iconColor: "",
                zIndex: 1000,
              }}
              modules={["geoObject.addon.balloon", "geoObject.addon.hint"]}
            />
          )}
        </Map>
      </YMaps>
    </div>
  );
}

export default App;
