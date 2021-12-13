import "./App.css";
import { GetData } from "./utils/getData.js";

function App() {
  return (
    <div className="App">
      <header className="App-header">{GetData()}</header>
    </div>
  );
}

export default App;
