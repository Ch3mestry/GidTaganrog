import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(
    <App />
  );
} else {
  console.error("Элемент не найден");
}
