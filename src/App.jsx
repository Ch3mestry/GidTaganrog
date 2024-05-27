import "./App.css";
import axios from "axios";
import { YMaps, Map, Placemark } from "react-yandex-maps";
import React, { useEffect, useState } from "react";

function App() {
  // load data
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  //select row
  const [selectedRow, setSelectedRow] = useState(null);

  //pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 7;
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentData = data.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(data.length / rowsPerPage);

  //map
  const [map, setMap] = useState(null);
  const [openBalloon, setOpenBalloon] = useState(null);

  useEffect(() => {
    axios
      .get("https://trash.skbkit.ru/api/now")
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
      const { lat, lng } = openBalloon;
      map.geoObjects.each((geoObject) => {
        const coords = geoObject.geometry.getCoordinates();
        if (coords[0] === lat && coords[1] === lng) {
          geoObject.balloon.open();
        } else {
          geoObject.balloon.close();
        }
      });
    }
  }, [openBalloon, map]);

  const handleOpenBalloon = (marker) => {
    setOpenBalloon(marker);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleRowClick = (item) => {
    setSelectedRow(item.id);
    handleOpenBalloon(item);
  };
  const handlePlacemarkClick = (item) => {
    setSelectedRow(item.id);
    setCurrentPage(Math.ceil(data.indexOf(item) / rowsPerPage));
    setOpenBalloon(item);
  };

  const getBalloonContent = (lat, lng) => {
    const markersAtSameLocation = data.filter(
      (marker) => marker.lat === lat && marker.lng === lng
    );

    const markerDetails = markersAtSameLocation
      .map(
        (marker) => `
        ID: ${marker.id}<br>
        Название: ${marker.name}<br>
        Адрес: ${marker.address}<br>
        Заполненность: ${marker.percent}% <br>
        Уровень батареи: ${marker.batLevel}%<br>
        Время обновления: ${marker.timeAt}<br><br>
      `
      )
      .join("");

    return markerDetails;
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="trash_sensor">
      <div className="table">
        <table>
          <thead>
            <tr>
              <th>
                <input type="radio" defaultChecked />
              </th>
              <th>ID</th>
              <th>Название</th>
              <th>Адрес</th>
              <th>Широта</th>
              <th>Долгота</th>
              <th>Заполненность</th>
              <th>Уровень батареи</th>
              <th>Время обновления</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((item) => (
              <tr
                key={item.id}
                className={selectedRow === item.id ? "selected" : ""}
                onClick={() => handleRowClick(item)}
              >
                <td>
                  <input
                    type="checkbox"
                    readOnly
                    checked={selectedRow === item.id}
                    className="input_center"
                  />
                </td>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>{item.address}</td>
                <td>{item.lat}</td>
                <td>{item.lng}</td>
                <td>{item.percent} %</td>
                <td>{item.batLevel} %</td>
                <td>{item.timeAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              className="pagination_button"
              key={index + 1}
              onClick={() => handlePageChange(index + 1)}
              disabled={currentPage === index + 1}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
      <YMaps query={{ apikey: "1a180896-a66e-4e5c-92bf-03a915bee3fd" }}>
        <Map
          className="map"
          instanceRef={(ref) => setMap(ref)}
          defaultState={{ center: [47.20669, 38.929113], zoom: 15 }}
        >
          {data.map((marker) => (
            <Placemark
              key={marker.id}
              geometry={[marker.lat, marker.lng]}
              properties={{
                balloonContent: getBalloonContent(marker.lat, marker.lng),
                // `<p>id: ${marker.id}</p>
                // <p>Название: ${marker.name}</p>
                // <p>заполненность: ${marker.percent}%</p>
                // <p>Уровень батареи: ${marker.batLevel}%</p>
                // <p>Время обновления: ${marker.timeAt}</p>
                // `,
              }}
              options={{
                balloonCloseButton: true,
                hideIconOnBalloonOpen: false,
              }}
              modules={["geoObject.addon.balloon", "geoObject.addon.hint"]}
              onClick={() => handlePlacemarkClick(marker)}
            />
          ))}
        </Map>
      </YMaps>
    </div>
  );
}

export default App;
