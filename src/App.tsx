import { useState, createRef } from "react";
import { Tab, RadioGroup, Disclosure } from "@headlessui/react";
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
  encounterTable: string[];
}

const defaultTerrain: Terrain = {
  id: "-1",
  name: "N/A",
  speedMods: [1, 1, 1],
  styles: "",
};

const emptyTerrain: Terrain = {
  id: "",
  name: "Terrain",
  speedMods: [1, 1, 1],
  styles: "bg-blue-500 hover:bg-blue-400",
};

const defaultRegion: Region = {
  id: "-1",
  name: "N/A",
  encounterTable: [],
};

function App() {
  const [terrainCsv, setTerrainCsv] = useState("");
  const [terrainMatrix, setTerrainMatrix] = useState([[""]]);
  const [terrainDefinitions, setTerrainDefinitions] = useState([]);
  const [regionsCsv, setRegionsCsv] = useState("");
  const [regionsMatrix, setRegionsMatrix] = useState([[""]]);
  const [regionDefinitions, setRegionDefinitions] = useState([defaultRegion]);
  const [partyAction, setPartyAction] = useState("travel");

  const [selected, setSelected] = useState([-1, -1]);
  const [destination, setDestination] = useState([-1, -1]);

  let config = {
    terrainCsv: "",
    regionCsv: "",
    terrainDefinitions: [
      {
        id: "7",
        name: "Ocean",
        speedMods: [1, 1, 1],
        styles: "bg-blue-500 hover:bg-blue-400 transition-all",
      },
      {
        id: "0",
        name: "Plains",
        speedMods: [1, 1, 0.75],
        styles: "bg-green-500 hover:bg-green-400 transition-all",
      },
      {
        id: "5",
        name: "Mountains",
        speedMods: [0.75, 0.75, 0.5],
        styles: "bg-slate-500 hover:bg-slate-600 transition-all",
      },
    ],
    regions: [
      {
        id: "0",
        name: "Baby Woods",
        encounterTable: [
          [1, "bears"],
          [2, "bees"],
          [3, "Brad Pitt"],
        ],
      },
      {
        id: "1",
        name: "Doom Cliffs",
        speedMods: [1, 1, 0.75],
        encounterTable: [
          [1, "goose"],
          [2, "golf"],
          [3, "Garfield"],
        ],
      },
    ],
  };

  const getTerrainById = (id: String) => {
    const terrains = terrainDefinitions.filter((terrain) => terrain.id === id);
    if (terrains[0]) {
      return terrains[0];
    }
    return defaultTerrain;
  };

  const getRegionById = (id: String) => {
    const regions = regionDefinitions.filter((region) => region.id === id);
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

  const terrainDefOnChange: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    event.preventDefault();
    if (event.target.files) {
      terrainDefImport(event.target.files[0]);
    }
  };

  const terrainDefImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target) {
        const text = e.target.result;
        if (typeof text === "string") {
          const json: Terrain[] = JSON.parse(text);
          setTerrainDefinitions(json);
        }
      }
    };
    reader.readAsText(file);
  };

  const regionDefOnChange: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    event.preventDefault();
    if (event.target.files) {
      regionDefImport(event.target.files[0]);
    }
  };

  const regionDefImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target) {
        const text = e.target.result;
        if (typeof text === "string") {
          const json: Region[] = JSON.parse(text);
          setRegionDefinitions(json);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="App">
      <Tab.Group>
        <Tab.List className={"w-max mx-auto -space-x-px"}>
          <Tab>
            {({ selected }) => (
              <button
                className={`border rounded-l px-3 py-1 ${
                  selected ? "bg-blue-600 text-white" : ""
                }`}
              >
                Travel
              </button>
            )}
          </Tab>
          <Tab>
            {({ selected }) => (
              <button
                className={`border rounded-r px-3 py-1 ${
                  selected ? "bg-blue-600 text-white" : ""
                }`}
              >
                Config
              </button>
            )}
          </Tab>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>
            {" "}
            {terrainMatrix[0][0] !== "" && selected[0] !== -1 ? (
              <div className="flex justify-center gap-4 mt-4">
                <div className="mt-2 flex flex-col">
                  <h2 className="bg-black text-white rounded w-max mx-auto px-2">
                    Current Hex
                  </h2>
                  <span className="text-sm">
                    <span className="font-bold">Coordinates: </span>(
                    {selected[1]}, {selected[0]})
                  </span>
                  <span className="text-sm">
                    <span className="font-bold">Terrain: </span>
                    {terrainMatrix[selected[0]] != undefined
                      ? getTerrainById(terrainMatrix[selected[0]][selected[1]])
                          .name
                      : "N/A"}
                  </span>
                  <span className="text-sm">
                    <span className="font-bold">Region: </span>
                    {regionsMatrix[selected[0]] != undefined
                      ? getRegionById(regionsMatrix[selected[0]][selected[1]])
                          .name
                      : "N/A"}
                  </span>
                </div>
                <div className="mt-2 flex flex-col">
                  <h2 className="bg-yellow-400 rounded w-max mx-auto px-2">
                    Destination
                  </h2>
                  <span className="text-sm">
                    <span className="font-bold">Coordinates: </span>(
                    {selected[1]}, {selected[0]})
                  </span>
                  <span className="text-sm">
                    <span className="font-bold">Terrain: </span>
                    {terrainMatrix[selected[0]] != undefined
                      ? getTerrainById(terrainMatrix[selected[0]][selected[1]])
                          .name
                      : "N/A"}
                  </span>
                  <span className="text-sm">
                    <span className="font-bold">Region: </span>
                    {regionsMatrix[selected[0]] != undefined
                      ? getRegionById(regionsMatrix[selected[0]][selected[1]])
                          .name
                      : "N/A"}
                  </span>
                </div>
              </div>
            ) : (
              ""
            )}
            <div className="flex justify-center">
              <div className="overflow-auto w-max my-6">
                <div className="w-72 h-72 overflow-auto flex pl-[32px]">
                  {terrainMatrix.map((row, i) => (
                    <div
                      className={`flex-col -ml-[7px] ${
                        i % 2 === 1 ? "mt-[15px]" : ""
                      }`}
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
              <div className="mt-6 px-3">
                <div>Content</div>
                <div>Content</div>
                <div>Content</div>
                <div>Content</div>
                <div>Content</div>
              </div>
            </div>
          </Tab.Panel>
          <Tab.Panel>
            <div>
              <div className="max-w-sm mx-auto mt-2">
                <h2 className="font-bold">Terrain Layer</h2>
                <input type="file" onChange={terrainOnChange} />
                <h2 className="font-bold">Regions Layer</h2>
                <input type="file" onChange={regionsOnChange} />
              </div>
              <div>
                <h2 className="font-bold mt-2">Terrain Types</h2>
                <div>
                  <input type="file" onChange={terrainDefOnChange} />
                </div>
                <div className="max-w-lg mx-auto mt-4 flex flex-wrap">
                  {terrainDefinitions.map((terrain, i) => (
                    <div className="w-64 h-32 rounded shadow">
                      <div className="space-x-3 py-2 px-3 flex items-center justify-between">
                        <span className="w-max font-bold">
                          <input
                            className="w-24"
                            value={terrain.name}
                            type="text"
                            onChange={(e) => {
                              let newDefs = [...terrainDefinitions];
                              let newObj = { ...newDefs[i] };
                              newObj.name = e.target.value;
                              newDefs[i] = newObj;
                              setTerrainDefinitions(newDefs);
                            }}
                          />
                        </span>
                        <span className="text-sm">
                          <span>
                            ID:{" "}
                            <input
                              className="w-6"
                              value={terrain.id}
                              type="text"
                              onChange={(e) => {
                                let newDefs = [...terrainDefinitions];
                                let newObj = { ...newDefs[i] };
                                newObj.id = e.target.value;
                                newDefs[i] = newObj;
                                setTerrainDefinitions(newDefs);
                              }}
                            />
                          </span>
                        </span>
                        <button
                          className="w-max bg-transparent mr-2 hover:fill-white hover:bg-red-500 transition-all p-1 rounded"
                          onClick={() => {
                            let newDefs = [...terrainDefinitions];
                            newDefs.splice(i, 1);
                            setTerrainDefinitions(newDefs);
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                          >
                            <path d="M24 20.188l-8.315-8.209 8.2-8.282-3.697-3.697-8.212 8.318-8.31-8.203-3.666 3.666 8.321 8.24-8.206 8.313 3.666 3.666 8.237-8.318 8.285 8.203z" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex justify-between px-3">
                        <div className="text-left">
                          <div>
                            <span className="text-xs">
                              Highway:{" "}
                              <span>
                                x
                                <input
                                  className="w-12"
                                  value={terrain.speedMods[0]}
                                  type="number"
                                  onChange={(e) => {
                                    let newDefs = [...terrainDefinitions];
                                    let newObj = { ...newDefs[i] };
                                    newObj.speedMods[0] = +e.target.value;
                                    newDefs[i] = newObj;
                                    setTerrainDefinitions(newDefs);
                                  }}
                                />
                              </span>
                            </span>
                          </div>
                          <div>
                            <span className="text-xs">
                              Trail:{" "}
                              <span>
                                x
                                <input
                                  className="w-12"
                                  value={terrain.speedMods[1]}
                                  type="number"
                                  onChange={(e) => {
                                    let newDefs = [...terrainDefinitions];
                                    let newObj = { ...newDefs[i] };
                                    newObj.speedMods[1] = +e.target.value;
                                    newDefs[i] = newObj;
                                    setTerrainDefinitions(newDefs);
                                  }}
                                />
                              </span>
                            </span>
                          </div>
                          <div>
                            <span className="text-xs">
                              Pathless:{" "}
                              <span>
                                x
                                <input
                                  className="w-12"
                                  value={terrain.speedMods[2]}
                                  type="number"
                                  onChange={(e) => {
                                    let newDefs = [...terrainDefinitions];
                                    let newObj = { ...newDefs[i] };
                                    newObj.speedMods[2] = +e.target.value;
                                    newDefs[i] = newObj;
                                    setTerrainDefinitions(newDefs);
                                  }}
                                />
                              </span>
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center">
                          <h3 className="text-sm font-semibold mb-2">Style</h3>
                          <div
                            className={`${terrain.styles}  hexagon relative -mt-[2px] w-8 h-8 flex-none`}
                          >
                            <span className="text-[.6rem]">0, 0</span>
                          </div>
                          <input
                            className="w-24 text-[0.5rem]"
                            value={terrain.styles}
                            type="text"
                            onChange={(e) => {
                              let newDefs = [...terrainDefinitions];
                              let newObj = { ...newDefs[i] };
                              newObj.styles = e.target.value;
                              newDefs[i] = newObj;
                              setTerrainDefinitions(newDefs);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="w-64 h-32 rounded shadow flex">
                    {" "}
                    <button
                      className="w-full bg-transparent hover:fill-white hover:bg-green-500 transition-all rounded py-2"
                      onClick={() => {
                        let newDefs = [...terrainDefinitions];
                        newDefs = newDefs.concat(emptyTerrain);
                        setTerrainDefinitions(newDefs);
                      }}
                    >
                      <svg
                        className="w-full mx-auto"
                        clip-rule="evenodd"
                        fill-rule="evenodd"
                        stroke-linejoin="round"
                        stroke-miterlimit="2"
                        height={24}
                        width={24}
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="m11 11h-7.25c-.414 0-.75.336-.75.75s.336.75.75.75h7.25v7.25c0 .414.336.75.75.75s.75-.336.75-.75v-7.25h7.25c.414 0 .75-.336.75-.75s-.336-.75-.75-.75h-7.25v-7.25c0-.414-.336-.75-.75-.75s-.75.336-.75.75z"
                          fill-rule="nonzero"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <h2 className="font-bold mt-2">Regions</h2>
                <div>
                  <input type="file" onChange={regionDefOnChange} />
                </div>
                {regionDefinitions[0].id != "-1" ? (
                  <div className="max-w-lg mx-auto mt-4 flex flex-wrap">
                    {regionDefinitions.map((region, i) => (
                      <div className="w-64 rounded shadow">
                        <div className="space-x-3 py-2 px-3 flex items-center justify-between">
                          <span className="w-max font-bold">
                            <input
                              className="w-24"
                              value={region.name}
                              type="text"
                              onChange={(e) => {
                                let newDefs = [...regionDefinitions];
                                let newObj = { ...newDefs[i] };
                                newObj.name = e.target.value;
                                newDefs[i] = newObj;
                                setRegionDefinitions(newDefs);
                              }}
                            />
                          </span>
                          <span className="text-sm">
                            ID:{" "}
                            <input
                              className="w-6"
                              value={region.id}
                              type="text"
                              onChange={(e) => {
                                let newDefs = [...regionDefinitions];
                                let newObj = { ...newDefs[i] };
                                newObj.id = e.target.value;
                                newDefs[i] = newObj;
                                setRegionDefinitions(newDefs);
                              }}
                            />
                          </span>
                          <button
                            className="w-max bg-transparent mr-2 hover:fill-white hover:bg-red-500 transition-all p-1 rounded"
                            onClick={() => {
                              let newDefs = [...regionDefinitions];
                              newDefs.splice(i, 1);
                              setRegionDefinitions(newDefs);
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                            >
                              <path d="M24 20.188l-8.315-8.209 8.2-8.282-3.697-3.697-8.212 8.318-8.31-8.203-3.666 3.666 8.321 8.24-8.206 8.313 3.666 3.666 8.237-8.318 8.285 8.203z" />
                            </svg>
                          </button>
                        </div>
                        <table className="w-full">
                          {region.encounterTable.map((encounter, j) => (
                            <tr
                              className={`${j % 2 === 0 ? "bg-gray-100" : ""}`}
                            >
                              <th className="px-1">{j + 1}</th>
                              <td>
                                <input
                                  className="w-full bg-transparent "
                                  value={encounter}
                                  type="text"
                                  onChange={(e) => {
                                    let newDefs = [...regionDefinitions];
                                    let newObj = { ...newDefs[i] };
                                    let newTab = [...newObj.encounterTable];
                                    newTab[j] = e.target.value;
                                    newObj.encounterTable = newTab;
                                    newDefs[i] = newObj;
                                    setRegionDefinitions(newDefs);
                                  }}
                                />
                              </td>
                              <td>
                                <button
                                  className="bg-transparent mr-2 hover:fill-white hover:bg-red-500 transition-all p-1 rounded"
                                  onClick={() => {
                                    let newDefs = [...regionDefinitions];
                                    let newObj = { ...newDefs[i] };
                                    let newTab = [...newObj.encounterTable];
                                    newTab.splice(j, 1);
                                    newObj.encounterTable = newTab;
                                    newDefs[i] = newObj;
                                    setRegionDefinitions(newDefs);
                                  }}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M24 20.188l-8.315-8.209 8.2-8.282-3.697-3.697-8.212 8.318-8.31-8.203-3.666 3.666 8.321 8.24-8.206 8.313 3.666 3.666 8.237-8.318 8.285 8.203z" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                          <tr
                            className={`${
                              regionDefinitions[i].encounterTable.length % 2 ===
                              0
                                ? "bg-gray-100"
                                : ""
                            }`}
                          >
                            <th className="px-1">
                              {regionDefinitions[i].encounterTable.length + 1}
                            </th>
                            <td>
                              <div className="text-left">
                                Roll 2 and combine them.
                              </div>
                            </td>
                            <td />
                          </tr>
                        </table>
                        <button
                          className="w-full bg-transparent hover:fill-white hover:bg-green-500 transition-all rounded-b py-2"
                          onClick={() => {
                            let newDefs = [...regionDefinitions];
                            let newObj = { ...newDefs[i] };
                            let newTab = [...newObj.encounterTable];
                            newTab = newTab.concat("");
                            newTab.concat("");
                            newObj.encounterTable = newTab;
                            newDefs[i] = newObj;
                            setRegionDefinitions(newDefs);
                          }}
                        >
                          <svg
                            className="w-full mx-auto"
                            clip-rule="evenodd"
                            fill-rule="evenodd"
                            stroke-linejoin="round"
                            stroke-miterlimit="2"
                            height={12}
                            width={12}
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="m11 11h-7.25c-.414 0-.75.336-.75.75s.336.75.75.75h7.25v7.25c0 .414.336.75.75.75s.75-.336.75-.75v-7.25h7.25c.414 0 .75-.336.75-.75s-.336-.75-.75-.75h-7.25v-7.25c0-.414-.336-.75-.75-.75s-.75.336-.75.75z"
                              fill-rule="nonzero"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  ""
                )}
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}

export default App;
