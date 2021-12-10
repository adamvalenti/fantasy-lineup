import "./App.css";
import { GetData } from "./utils/test.js";

function App() {
  return (
    <div className="App">
      <header className="App-header">{GetData()}</header>
    </div>
  );
}

export default App;
