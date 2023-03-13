import { useState, createRef } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";

interface Terrain {
  id: string;
  name: string;
  speedMods: number[];
  styles: string;
}

interface Region {
  id: string;
  name: string;
  encounterTable: Map<number, string>;
}

function App() {
  const [terrainMatrix, setTerrainMatrix] = useState([[""]]);
  const [regionsMatrix, setRegionsMatrix] = useState([[""]]);

  const [selected, setSelected] = useState([-1, -1]);

  let defaultTerrain: Terrain = {
    id: "-1",
    name: "N/A",
    speedMods: [1, 1, 1],
    styles: "",
  };

  let defaultRegion: Region = {
    id: "-1",
    name: "N/A",
    encounterTable: new Map([]),
  };

  let config = {
    terrainTypes: [
      {
        id: "7",
        name: "Ocean",
        speedMods: [1, 1, 1],
        styles: "bg-blue-500 hover:bg-blue-400",
      },
      {
        id: "0",
        name: "Plains",
        speedMods: [1, 1, 0.75],
        styles: "bg-green-500 hover:bg-green-400",
      },
      {
        id: "5",
        name: "Mountains",
        speedMods: [0.75, 0.75, 0.5],
        styles: "bg-slate-500 hover:bg-slate-600",
      },
    ],
    regions: [
      {
        id: "0",
        name: "Baby Woods",
        speedMods: [1, 1, 1],
        styles: "bg-blue-500 hover:bg-blue-400",
      },
      {
        id: "1",
        name: "Doom Cliffs",
        speedMods: [1, 1, 0.75],
        styles: "bg-green-500 hover:bg-green-400",
      },
    ],
  };

  const getTerrainById = (id: String) => {
    const terrains = config.terrainTypes.filter((terrain) => terrain.id === id);
    if (terrains[0]) {
      return terrains[0];
    }
    return defaultTerrain;
  };

  const getRegionById = (id: String) => {
    const regions = config.regions.filter((region) => region.id === id);
    if (regions[0]) {
      return regions[0];
    }
    return defaultRegion;
  };

  const terrainOnChange: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    event.preventDefault();
    if (event.target.files) {
      terrainCsvFileToString(event.target.files[0]);
    }
  };

  const regionsOnChange: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    event.preventDefault();
    if (event.target.files) {
      regionsCsvFileToString(event.target.files[0]);
    }
  };

  const terrainCsvFileToString = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target) {
        const text = e.target.result;
        if (typeof text === "string") {
          let arr = csvStringToMatrix(text.trim());
          invertMatrix(arr);
          setTerrainMatrix(arr);
        }
      }
    };
    reader.readAsText(file);
  };

  const regionsCsvFileToString = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target) {
        const text = e.target.result;
        if (typeof text === "string") {
          let arr = csvStringToMatrix(text.trim());
          invertMatrix(arr);
          setRegionsMatrix(arr);
        }
      }
    };
    reader.readAsText(file);
  };

  const csvStringToMatrix = (str: String) => {
    return str.split("\r\n").map((line) => {
      return line.split(",");
    });
  };

  const invertMatrix = (arr: string[][]) => {
    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < i; j++) {
        const tmp = arr[i][j];
        arr[i][j] = arr[j][i];
        arr[j][i] = tmp;
      }
    }
  };

  return (
    <div className="App">
      <div className="max-w-sm mx-auto">
        <h2 className="font-bold">Terrain Layer</h2>
        <input type="file" onChange={terrainOnChange} />
        <h2 className="font-bold">Regions Layer</h2>
        <input type="file" onChange={regionsOnChange} />
      </div>

      {terrainMatrix[0][0] !== "" && selected[0] !== -1 ? (
        <div className="mt-2 space-x-4">
          <h2>Selected Hex</h2>
          <span className="text-sm">
            <span className="font-bold">Coordinates: </span>({selected[1]},{" "}
            {selected[0]})
          </span>
          <span className="text-sm">
            <span className="font-bold">Terrain: </span>
            {terrainMatrix[selected[0]] != undefined
              ? getTerrainById(terrainMatrix[selected[0]][selected[1]]).name
              : "N/A"}
          </span>
          <span className="text-sm">
            <span className="font-bold">Region: </span>
            {regionsMatrix[selected[0]] != undefined
              ? getRegionById(regionsMatrix[selected[0]][selected[1]]).name
              : "N/A"}
          </span>
        </div>
      ) : (
        ""
      )}

      <div className="overflow-auto mx-auto w-max my-6">
        <div className="w-72 h-72 overflow-auto flex pl-[32px]">
          {terrainMatrix.map((row, i) => (
            <div
              className={`flex-col -ml-[7px] ${i % 2 === 1 ? "mt-[15px]" : ""}`}
            >
              {row.map((col, j) => (
                <div
                  onClick={() => {
                    setSelected([i, j]);
                  }}
                  className={`${
                    selected[0] === i && selected[1] === j
                      ? "bg-black text-white"
                      : terrainMatrix[0][0] !== ""
                      ? getTerrainById(col) != undefined
                        ? getTerrainById(col).styles
                        : ""
                      : ""
                  }  hexagon relative -mt-[2px] w-8 h-8 flex-none`}
                >
                  <span className="text-[.6rem]">
                    {terrainMatrix[0][0] !== "" ? `${j}, ${i}` : ""}
                  </span>
                  {regionsMatrix[i] != undefined &&
                  regionsMatrix[i][j] != "-1" ? (
                    <span className="text-[.3rem] absolute bottom-1 right-2">
                      {regionsMatrix[i][j]}
                    </span>
                  ) : (
                    ""
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
