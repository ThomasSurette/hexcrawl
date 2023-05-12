import { useState, createRef, useEffect } from "react";
import {
  Tab,
  RadioGroup,
  Disclosure,
  Listbox,
  Dialog,
  Switch,
} from "@headlessui/react";
import { DateTimeField, LocalizationProvider, deDE } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "./App.css";

interface Terrain {
  id: string;
  name: string;
  speedMods: number[];
  navigationDC: number;
  forageDC: number;
  styles: string;
  forageTable: string[][];
}

interface Region {
  id: string;
  name: string;
  encounterRate: number;
  encounterTable: string[];
}

interface Condition {
  name: string;
  speedMod: number;
  active: boolean;
}

interface Weather {
  name: string;
  description: string;
  range: number[];
}

const defaultTerrain: Terrain = {
  id: "-1",
  name: "",
  speedMods: [1, 1],
  navigationDC: 0,
  forageDC: 0,
  styles: "",
  forageTable: [["", ""]],
};

const emptyTerrain: Terrain = {
  id: "",
  name: "Terrain",
  speedMods: [1, 1],
  navigationDC: 0,
  forageDC: 0,
  styles: "bg-blue-500 hover:bg-blue-400",
  forageTable: [["", ""]],
};

const defaultRegion: Region = {
  id: "-1",
  name: "",
  encounterTable: [],
  encounterRate: 0,
};

const emptyRegion: Region = {
  id: "",
  name: "Region",
  encounterTable: [],
  encounterRate: 16,
};

const emptyCondition: Condition = {
  name: "Condition",
  speedMod: 1,
  active: false,
};

const emptyWeather: Weather = {
  name: "Weather",
  description: "Description",
  range: [1, 1],
};

function App() {
  const [terrainMatrix, setTerrainMatrix] = useState<string[][]>([[""]]);
  const [terrainDefinitions, setTerrainDefinitions] = useState<Terrain[]>([]);
  const [regionsMatrix, setRegionsMatrix] = useState<string[][]>([[""]]);
  const [regionDefinitions, setRegionDefinitions] = useState<Region[]>([]);
  const [conditionDefinitions, setConditionDefinitions] = useState<Condition[]>(
    []
  );

  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const [dateTime, setDateTime] = useState<dayjs.Dayjs>(dayjs(Date.now()));
  const [selected, setSelected] = useState<number[]>([-1, -1]);
  const [adjacentHexes, setAdjacentHexes] = useState<number[][]>();
  const [hexPosition, setHexPosition] = useState<string>("far");
  const [adjacentRegions, setAdjacentRegions] = useState<Region[]>([]);

  const [destination, setDestination] = useState<number[]>();
  const [partyAction, setPartyAction] = useState<string>("travel");
  const [travelSpeed, setTravelSpeed] = useState<string>("normal");
  const [roadType, setRoadType] = useState<string>("pathless");
  const [forceLocation, setForceLocation] = useState<boolean>(false);
  const [searchForceLocation, setSearchForceLocation] =
    useState<boolean>(false);
  const [searchForceEncounter, setSearchForceEncounter] =
    useState<boolean>(false);

  const [tempDistance, setTempDistance] = useState<number>(0);
  const [travelDistance, setTravelDistance] = useState<number>(0);
  const [travelTime, setTravelTime] = useState<number>(0);
  const [hexProgress, setHexProgress] = useState<number>(0);
  const [dailyTravelHours, setDailyTravelHours] = useState<number>(0);

  const [restTime, setRestTime] = useState<number>(0);
  const [searchTime, setSearchTime] = useState<number>(0);

  const [modalTitle, setModalTitle] = useState<string>("Modal Title");
  const [modalDescription, setModalDescription] =
    useState<string>("Modal Description");

  const [winterTable, setWinterTable] = useState<Weather[]>([]);
  const [springTable, setSpringTable] = useState<Weather[]>([]);
  const [summerTable, setSummerTable] = useState<Weather[]>([]);
  const [autumnTable, setAutumnTable] = useState<Weather[]>([]);

  const [weather, setWeather] = useState<Weather>(emptyWeather);

  const exportConfigJson = () => {
    let obj = {
      terrainMatrix: terrainMatrix,
      terrainDefinitions: terrainDefinitions,
      regionsMatrix: regionsMatrix,
      regionDefinitions: regionDefinitions,
      conditionDefinitions: conditionDefinitions,
      winterTable: winterTable,
      springTable: springTable,
      summerTable: summerTable,
      autumnTable: autumnTable,
    };
    let str = JSON.stringify(obj);
    let blob = new Blob([str], { type: "text/json;charset=utf-8" });
    let url = window.URL || window.webkitURL;
    let link = url.createObjectURL(blob);
    let a = document.createElement("a");
    a.download = "config.json";
    a.href = link;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const importConfigJson: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    event.preventDefault();
    if (event.target.files) {
      let file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target) {
          const text = e.target.result;
          if (typeof text === "string") {
            let obj = JSON.parse(text);
            setTerrainMatrix(obj.terrainMatrix);
            setTerrainDefinitions(obj.terrainDefinitions);
            setRegionsMatrix(obj.regionsMatrix);
            setRegionDefinitions(obj.regionDefinitions);
            setConditionDefinitions(obj.conditionDefinitions);
            setWinterTable(obj.winterTable);
            setSpringTable(obj.springTable);
            setSummerTable(obj.summerTable);
            setAutumnTable(obj.autumnTable);
            localStorage.setItem(
              "terrainMatrix",
              JSON.stringify(obj.terrainMatrix)
            );
            localStorage.setItem(
              "terrainDefinitions",
              JSON.stringify(obj.terrainDefinitions)
            );
            localStorage.setItem(
              "regionMatrix",
              JSON.stringify(obj.regionsMatrix)
            );
            localStorage.setItem(
              "regionDefinitions",
              JSON.stringify(obj.regionDefinitions)
            );
            localStorage.setItem(
              "conditionDefinitions",
              JSON.stringify(obj.conditionDefinitions)
            );
            localStorage.setItem(
              "winterTable",
              JSON.stringify(obj.winterTable)
            );
            localStorage.setItem(
              "springTable",
              JSON.stringify(obj.springTable)
            );
            localStorage.setItem(
              "summerTable",
              JSON.stringify(obj.summerTable)
            );
            localStorage.setItem(
              "autumnTable",
              JSON.stringify(obj.autumnTable)
            );
          }
        }
      };
      reader.readAsText(file);
    }
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
          localStorage.setItem("terrainMatrix", JSON.stringify(arr));
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
          localStorage.setItem("regionsMatrix", JSON.stringify(arr));
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
          localStorage.setItem("terrainDefinitions", JSON.stringify(json));
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
          localStorage.setItem("regionDefinitions", JSON.stringify(json));
        }
      }
    };
    reader.readAsText(file);
  };

  const updateAdjacent = (selected: number[]) => {
    setDestination(undefined);
    const col = selected[0];
    const row = selected[1];
    let arr = [];
    let destCol = -1;
    let destRow = -1;

    if (col % 2 === 0) {
      destCol = col - 1;
      destRow = row - 1;
      if (
        destCol >= 0 &&
        destCol < terrainMatrix.length &&
        destRow >= 0 &&
        destRow < terrainMatrix[0].length
      ) {
        arr.push([destCol, destRow]);
      }

      destCol = col;
      destRow = row - 1;
      if (
        destCol >= 0 &&
        destCol < terrainMatrix.length &&
        destRow >= 0 &&
        destRow < terrainMatrix[0].length
      ) {
        arr.push([destCol, destRow]);
      }

      destCol = col + 1;
      destRow = row - 1;
      if (
        destCol >= 0 &&
        destCol < terrainMatrix.length &&
        destRow >= 0 &&
        destRow < terrainMatrix[0].length
      ) {
        arr.push([destCol, destRow]);
      }

      destCol = col - 1;
      destRow = row;
      if (
        destCol >= 0 &&
        destCol < terrainMatrix.length &&
        destRow >= 0 &&
        destRow < terrainMatrix[0].length
      ) {
        arr.push([destCol, destRow]);
      }

      destCol = col;
      destRow = row + 1;
      if (
        destCol >= 0 &&
        destCol < terrainMatrix.length &&
        destRow >= 0 &&
        destRow < terrainMatrix[0].length
      ) {
        arr.push([destCol, destRow]);
      }

      destCol = col + 1;
      destRow = row;
      if (
        destCol >= 0 &&
        destCol < terrainMatrix.length &&
        destRow >= 0 &&
        destRow < terrainMatrix[0].length
      ) {
        arr.push([destCol, destRow]);
      }
    }

    if (col % 2 === 1) {
      destCol = col - 1;
      destRow = row;
      if (
        destCol >= 0 &&
        destCol < terrainMatrix.length &&
        destRow >= 0 &&
        destRow < terrainMatrix[0].length
      ) {
        arr.push([destCol, destRow]);
      }

      destCol = col;
      destRow = row - 1;
      if (
        destCol >= 0 &&
        destCol < terrainMatrix.length &&
        destRow >= 0 &&
        destRow < terrainMatrix[0].length
      ) {
        arr.push([destCol, destRow]);
      }

      destCol = col + 1;
      destRow = row;
      if (
        destCol >= 0 &&
        destCol < terrainMatrix.length &&
        destRow >= 0 &&
        destRow < terrainMatrix[0].length
      ) {
        arr.push([destCol, destRow]);
      }

      destCol = col - 1;
      destRow = row + 1;
      if (
        destCol >= 0 &&
        destCol < terrainMatrix.length &&
        destRow >= 0 &&
        destRow < terrainMatrix[0].length
      ) {
        arr.push([destCol, destRow]);
      }

      destCol = col;
      destRow = row + 1;
      if (
        destCol >= 0 &&
        destCol < terrainMatrix.length &&
        destRow >= 0 &&
        destRow < terrainMatrix[0].length
      ) {
        arr.push([destCol, destRow]);
      }

      destCol = col + 1;
      destRow = row + 1;
      if (
        destCol >= 0 &&
        destCol < terrainMatrix.length &&
        destRow >= 0 &&
        destRow < terrainMatrix[0].length
      ) {
        arr.push([destCol, destRow]);
      }
    }
    setAdjacentHexes(arr);
    updateAdjacentRegions(arr, selected);
  };

  const updateAdjacentRegions = (adjacent: number[][], select: number[]) => {
    if (adjacent === undefined) return;
    let regions: Region[] = [];
    adjacent.forEach((hex) => {
      let region = getRegionById(regionsMatrix[hex[0]][hex[1]]);
      if (
        !regions.includes(region) &&
        region.id !== regionsMatrix[select[0]][select[1]] &&
        region.id !== "-1"
      ) {
        regions.push(region);
      }
    });
    setAdjacentRegions(regions);
  };

  const getWatch = () => {
    return Math.floor(dateTime.hour() / 4) + 1;
  };

  const timeToNextWatch = () => {
    const watch = getWatch();
    const nextWatch = watch + 1;
    let nextWatchTime = dayjs(dateTime);
    nextWatchTime = nextWatchTime
      .set("hour", (nextWatch - 1) * 4)
      .set("minute", 0)
      .set("second", 0);
    return minToHrMin(nextWatchTime.diff(dateTime, "minute") + 1);
  };

  const minToHrMin = (min: number) => {
    const hours = Math.floor(min / 60);
    const minutes = min % 60;
    return [hours, minutes];
  };

  const handleGo = () => {
    let newTime = dateTime.add(travelTime, "hour");
    let newProgress = hexProgress + travelDistance;
    let hexLength = hexPosition === "near" ? 6 : 12;

    setDateTime(newTime);
    setDailyTravelHours(dailyTravelHours + travelTime);
    let modalText = "";
    if (travelTime * 60 >= timeToNextWatch()[1] + timeToNextWatch()[0] * 60) {
      let nextWatch = getWatch() === 6 ? 1 : getWatch() + 1;
      modalText += `New Watch: ${nextWatch} \r\n`;
      const encounterChance =
        getRegionById(regionsMatrix[selected[0]][selected[1]]).encounterRate /
        100;
      if (Math.random() < encounterChance) {
        modalText += `Encounter: ${handleEncounter()} \r\n`;
      }
      if (nextWatch % 2 === 0) {
        modalText += `Weather: ${handleWeather()} \r\n`;
      }
      setModalTitle("Update");
      setModalOpen(true);
    }

    if (newProgress < hexLength) {
      setHexProgress(newProgress);
    }
    if (newProgress >= hexLength) {
      setModalTitle("Update");
      if (destination != undefined) {
        modalText += `New Hex: (${destination[1]}, ${destination[0]}) \r\n`;
      }
      setHexProgress(newProgress - hexLength);
      setSelected([-1, -1]);
      setDestination(undefined);
      setModalOpen(true);
    }
    setModalDescription(modalText);
  };

  const handleRest = () => {
    let newTime = dateTime.add(restTime, "hour");
    setDateTime(newTime);

    let modalText = "";
    if (restTime * 60 >= timeToNextWatch()[1] + timeToNextWatch()[0] * 60) {
      let nextWatch = getWatch() === 6 ? 1 : getWatch() + 1;
      modalText += `New Watch: ${nextWatch} \r\n`;
      const encounterChance =
        getRegionById(regionsMatrix[selected[0]][selected[1]]).encounterRate /
        100;
      if (Math.random() < encounterChance) {
        modalText += `Encounter: ${rollEncounter()} \r\n`;
      }
      if (nextWatch % 2 === 0) {
        modalText += `Weather: ${handleWeather()} \r\n`;
      }
      setModalTitle("Update");
      setModalOpen(true);
    }

    setModalDescription(modalText);
  };

  const handleSearch = () => {
    let newTime = dateTime.add(searchTime, "hour");
    setDateTime(newTime);
    setDailyTravelHours(dailyTravelHours + searchTime);
    setModalTitle("Search Results");
    setModalDescription("Nothing found.");
    let modalText = "";
    if (searchForceEncounter || Math.random() < 0.666) {
      modalText += handleEncounter();
    }
    if (searchTime * 60 >= timeToNextWatch()[1] + timeToNextWatch()[0] * 60) {
      let nextWatch = getWatch() === 6 ? 1 : getWatch() + 1;
      modalText += `New Watch: ${nextWatch} \r\n`;
      if (nextWatch % 2 === 0) {
        modalText += `Weather: ${handleWeather()} \r\n`;
      }
    }
    setModalDescription(modalText);
    setModalOpen(true);
  };

  const handleEncounter = () => {
    if (partyAction === "rest") {
      return rollEncounter();
    }
    if (partyAction === "search") {
      if (searchForceLocation) {
        return "Hex location discovered!";
      }
      if (Math.random() < 0.5) {
        return "Hex location discovered!";
      }
      return rollEncounter();
    }
    if (partyAction === "travel") {
      if (forceLocation) {
        return "Hex location discovered!";
      }
      if (Math.random() < 0.5) {
        return "Hex location discovered!";
      }
      return rollEncounter();
    }
  };

  const rollEncounter = (): string => {
    let table = [];
    if (Math.random() < 0.5 || adjacentRegions.length === 0) {
      table = getRegionById(
        regionsMatrix[selected[0]][selected[1]]
      ).encounterTable;
    } else {
      let region =
        adjacentRegions[Math.floor(Math.random() * adjacentRegions.length)];
      table = region.encounterTable;
    }
    let num = Math.floor(Math.random() * table.length + 1);
    if (num >= table.length) {
      return `${rollEncounter()} and ${rollEncounter()}`;
    }
    return table[num];
  };

  const handleForage = () => {
    let forageTable = getTerrainById(
      terrainMatrix[selected[0]][selected[1]]
    ).forageTable;
    let num = Math.floor(Math.random() * forageTable.length);
    let result = forageTable[num];
    return `${result[0]}: ${result[1]}`;
  };

  const getSeason = () => {
    let month = dateTime.month() + 1;
    let day = dateTime.date();
    if (
      (month === 12 && day >= 21) ||
      month === 1 ||
      month === 2 ||
      (month === 3 && day < 20)
    ) {
      return "Winter";
    }
    if (
      (month === 3 && day >= 20) ||
      month === 4 ||
      month === 5 ||
      (month === 6 && day < 21)
    ) {
      return "Spring";
    }
    if (
      (month === 6 && day >= 21) ||
      month === 7 ||
      month === 8 ||
      (month === 9 && day < 22)
    ) {
      return "Summer";
    }
    if (
      (month === 9 && day >= 22) ||
      month === 10 ||
      month === 11 ||
      (month === 12 && day < 21)
    ) {
      return "Autumn";
    }
  };

  const getWeatherTable = () => {
    let season = getSeason();
    if (season === "Winter") {
      return winterTable;
    }
    if (season === "Spring") {
      return springTable;
    }
    if (season === "Summer") {
      return summerTable;
    }
    if (season === "Autumn") {
      return autumnTable;
    }
  };

  const rollRandomWeather = () => {
    let weatherTable = getWeatherTable();
    if (weatherTable === undefined) {
      return null;
    }
    let maxNum = weatherTable[weatherTable.length - 1].range[0];
    let randNum = Math.floor(Math.random() * maxNum + 1);
    for (let i = 0; i < weatherTable.length; i++) {
      if (
        randNum >= weatherTable[i].range[0] &&
        randNum <= weatherTable[i].range[1]
      ) {
        return weatherTable[i];
      }
    }
  };

  const upWeather = (
    weatherTable: Weather[],
    weatherArg: Weather,
    distance: number
  ) => {
    if (weatherArg === emptyWeather) {
      return null;
    }
    let weatherIndex = weatherTable.findIndex(
      (w) => w.name === weatherArg.name
    );
    if (weatherTable[weatherIndex - distance] === undefined) {
      return null;
    }
    return weatherTable[weatherIndex - distance];
  };

  const downWeather = (
    weatherTable: Weather[],
    weatherArg: Weather,
    distance: number
  ) => {
    if (weatherArg == emptyWeather) {
      return null;
    }
    let weatherIndex = weatherTable.findIndex(
      (w) => w.name === weatherArg.name
    );
    if (weatherTable[weatherIndex + distance] === undefined) {
      return null;
    }
    return weatherTable[weatherIndex + distance];
  };

  const weatherTableDistance = (
    weatherTable: Weather[],
    weatherArg1: Weather,
    weatherArg2: Weather
  ) => {
    if (weatherArg1 === emptyWeather || weatherArg2 === emptyWeather) {
      return null;
    }
    let weatherIndex1 = weatherTable.findIndex(
      (w) => w.name === weatherArg1.name
    );
    let weatherIndex2 = weatherTable.findIndex(
      (w) => w.name === weatherArg2.name
    );
    return weatherIndex2 - weatherIndex1;
  };

  const handleWeather = () => {
    let weatherTable = getWeatherTable();
    if (weatherTable === undefined || weather === null) {
      return null;
    }
    if (
      weather === emptyWeather ||
      weather === weatherTable[weatherTable.length - 1]
    ) {
      let newWeather = rollRandomWeather();
      if (newWeather == undefined) {
        return "Weather Error";
      }
      setWeather(newWeather);
      return `${newWeather.name}: ${newWeather.description}`;
    }
    let newWeather = rollRandomWeather();
    if (newWeather == undefined) {
      return "Weather Error";
    }
    if (newWeather === weatherTable[weatherTable.length - 1]) {
      setWeather(newWeather);
      return `${newWeather.name}: ${newWeather.description}`;
    } else {
      let distance = weatherTableDistance(weatherTable, weather, newWeather);
      if (distance == undefined) {
        return "Weather Error";
      }
      if (distance === 0) {
        return `${weather.name} continues`;
      }
      if (distance < 0) {
        if (distance < -2) {
          newWeather = upWeather(weatherTable, weather, 2);
        } else {
          newWeather = upWeather(weatherTable, weather, 1);
        }
      }
      if (distance > 0) {
        if (distance > 2) {
          newWeather = downWeather(weatherTable, weather, 2);
        } else {
          newWeather = downWeather(weatherTable, weather, 1);
        }
      }
    }
    if (newWeather != undefined) {
      setWeather(newWeather);
      return `${newWeather.name}: ${newWeather.description}`;
    } else {
      return "Weather Error";
    }
  };

  useEffect(() => {
    if (terrainMatrix[0][0] === "") {
      let item = localStorage.getItem("terrainMatrix");
      if (item != null) {
        setTerrainMatrix(JSON.parse(item));
      }
    }
    if (terrainDefinitions.length === 0) {
      let item = localStorage.getItem("terrainDefinitions");
      if (item != null) {
        setTerrainDefinitions(JSON.parse(item));
      }
    }
    if (regionsMatrix[0][0] === "") {
      let item = localStorage.getItem("regionsMatrix");
      if (item != null) {
        setRegionsMatrix(JSON.parse(item));
      }
    }
    if (regionDefinitions.length === 0) {
      let item = localStorage.getItem("regionDefinitions");
      if (item != null) {
        setRegionDefinitions(JSON.parse(item));
      }
    }
    if (conditionDefinitions.length === 0) {
      let item = localStorage.getItem("conditionDefinitions");
      if (item != null) {
        setConditionDefinitions(JSON.parse(item));
      }
    }
    if (winterTable.length === 0) {
      let item = localStorage.getItem("winterTable");
      if (item != null) {
        setWinterTable(JSON.parse(item));
      }
    }
    if (springTable.length === 0) {
      let item = localStorage.getItem("springTable");
      if (item != null) {
        setSpringTable(JSON.parse(item));
      }
    }
    if (summerTable.length === 0) {
      let item = localStorage.getItem("summerTable");
      if (item != null) {
        setSummerTable(JSON.parse(item));
      }
    }
    if (autumnTable.length === 0) {
      let item = localStorage.getItem("autumnTable");
      if (item != null) {
        setAutumnTable(JSON.parse(item));
      }
    }

    if (selected[0] !== -1 && selected[1] !== -1) {
      setTravelDistance(
        travelTime *
          (travelSpeed === "slow" ? 2 : travelSpeed === "normal" ? 3 : 4) *
          getTerrainById(terrainMatrix[selected[0]][selected[1]]).speedMods[
            roadType === "roadTrail" ? 0 : 1
          ] *
          conditionDefinitions
            .filter((condition) => condition.active)
            .map((con) => con.speedMod)
            .reduce((a, b) => a * b, 1)
      );
    }
  });

  return (
    <div className="App">
      <Dialog
        className={
          "bg-black bg-opacity-10 absolute top-0 h-screen w-full flex justify-center"
        }
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <Dialog.Panel
          className={
            "bg-white rounded shadow max-w-sm z-10 text-black absolute top-20 p-2 flex flex-col items-center gap-1"
          }
        >
          <Dialog.Title className={"font-bold text-center"}>
            {modalTitle}
          </Dialog.Title>
          <Dialog.Description>{modalDescription}</Dialog.Description>

          <button
            className="px-2 rounded bg-blue-400 hover:bg-blue-500 text-white mx-auto"
            onClick={() => setModalOpen(false)}
          >
            Ok
          </button>
        </Dialog.Panel>
      </Dialog>
      <Tab.Group>
        <Tab.List className={"w-max mx-auto -space-x-px"}>
          <Tab>
            {({ selected }) => (
              <button
                className={`border rounded-l px-3 py-1 transition-all ${
                  selected ? "bg-blue-600 text-white" : "hover:bg-gray-100"
                }`}
              >
                Explore!
              </button>
            )}
          </Tab>
          <Tab>
            {({ selected }) => (
              <button
                className={`border rounded-r px-3 py-1 transition-all ${
                  selected ? "bg-blue-600 text-white" : "hover:bg-gray-100"
                }`}
              >
                Config
              </button>
            )}
          </Tab>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>
            <div className="flex items-center gap-3 justify-center">
              <div className="mt-2 flex justify-center">
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DateTimeField
                    label="Date and Time"
                    value={dateTime}
                    onChange={(newValue) => {
                      if (newValue != null) {
                        setDateTime(newValue);
                      }
                    }}
                    size="small"
                  />
                </LocalizationProvider>
              </div>
              <div>Watch {getWatch()}/6</div>
              <div>
                Next Watch in: {timeToNextWatch()[0]} hours{" "}
                {timeToNextWatch()[1]} minutes
              </div>
              <div className="flex items-center gap-1">
                <span>Weather:</span>
                {weather.name !== "Weather" ? <span>{weather.name}</span> : ""}
              </div>
            </div>
            {terrainMatrix[0][0] !== "" && selected[0] !== -1 ? (
              <div>
                <div className="flex items-center justify-center gap-8">
                  <div className="flex items-center justify-center gap-2">
                    <span>Hex Progress:</span>{" "}
                    <div className="flex items-center">
                      <input
                        className="w-10"
                        value={hexProgress}
                        type="number"
                        onChange={(e) => {
                          setHexProgress(+e.target.value);
                        }}
                      />
                      <span>/{hexPosition === "near" ? 6 : 12}mi</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span>Daily Travel Hours:</span>{" "}
                    <div className="flex items-center">
                      <input
                        className="w-10"
                        value={dailyTravelHours}
                        type="number"
                        onChange={(e) => {
                          setDailyTravelHours(+e.target.value);
                        }}
                      />
                      <span>/8hrs</span>
                    </div>
                    <button
                      onClick={() => {
                        setDailyTravelHours(0);
                      }}
                      className="rounded bg-blue-400 px-2 hover:bg-blue-500 text-white"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    className="mt-2 px-2 rounded bg-blue-400 hover:bg-blue-500 text-white transition-all"
                    onClick={() => {
                      setModalTitle("Encounter");
                      let encounter = handleEncounter();
                      if (encounter != undefined) {
                        setModalDescription(encounter);
                      }
                      setModalOpen(true);
                    }}
                  >
                    Encounter
                  </button>
                  <button
                    className="mt-2 px-2 rounded bg-blue-400 hover:bg-blue-500 text-white transition-all"
                    onClick={() => {
                      setModalTitle("Forage");
                      let forage = handleForage();
                      if (forage != undefined) {
                        setModalDescription(forage);
                      }
                      setModalOpen(true);
                    }}
                  >
                    Forage
                  </button>
                  <button
                    className="mt-2 px-2 rounded bg-blue-400 hover:bg-blue-500 text-white transition-all"
                    onClick={() => {
                      let newWeather = rollRandomWeather();
                      if (newWeather != undefined) {
                        setModalTitle("Weather");
                        setModalDescription(
                          `${newWeather.name}: ${newWeather.description}`
                        );
                        setModalOpen(true);
                        setWeather(newWeather);
                      }
                    }}
                  >
                    Weather
                  </button>
                </div>
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
                        ? getTerrainById(
                            terrainMatrix[selected[0]][selected[1]]
                          ).name
                        : ""}
                    </span>
                    <span className="text-sm">
                      <span className="font-bold">Region: </span>
                      {regionsMatrix[selected[0]] != undefined
                        ? getRegionById(regionsMatrix[selected[0]][selected[1]])
                            .name
                        : ""}
                    </span>
                    <div className="text-sm flex gap-3">
                      <div className="flex gap-1">
                        <span className="font-bold">Nav DC:</span>
                        <span>
                          {terrainMatrix[selected[0]] != undefined
                            ? getTerrainById(
                                terrainMatrix[selected[0]][selected[1]]
                              ).navigationDC
                            : ""}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <span className="font-bold">Forage DC:</span>
                        <span>
                          {terrainMatrix[selected[0]] != undefined
                            ? getTerrainById(
                                terrainMatrix[selected[0]][selected[1]]
                              ).forageDC
                            : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  {partyAction === "travel" ? (
                    <div className="mt-2 flex flex-col">
                      <h2 className="bg-yellow-400 rounded w-max mx-auto px-2">
                        Destination
                      </h2>
                      <span className="text-sm">
                        <span className="font-bold">Coordinates: </span>
                        {destination != undefined
                          ? `(${destination[1]}, ${destination[0]})`
                          : ""}
                      </span>
                      <span className="text-sm">
                        <span className="font-bold">Terrain: </span>
                        {destination != undefined &&
                        terrainMatrix[destination[0]] != undefined
                          ? getTerrainById(
                              terrainMatrix[destination[0]][destination[1]]
                            ).name
                          : ""}
                      </span>
                      <span className="text-sm">
                        <span className="font-bold">Region: </span>
                        {destination != undefined &&
                        regionsMatrix[destination[0]] != undefined
                          ? getRegionById(
                              regionsMatrix[destination[0]][destination[1]]
                            ).name
                          : ""}
                      </span>
                    </div>
                  ) : (
                    ""
                  )}
                </div>
              </div>
            ) : (
              ""
            )}
            <div className="flex justify-center">
              <div className="overflow-auto w-max my-6">
                <div className="w-96 h-96 overflow-auto flex pl-[32px]">
                  {terrainMatrix.map((row, i) => (
                    <div
                      className={`flex-col -ml-[7px] ${
                        i % 2 === 1 ? "mt-[15px]" : ""
                      }`}
                    >
                      {row.map((col, j) => (
                        <div
                          onClick={() => {
                            if (selected[0] != i || selected[1] != j) {
                              setSelected([i, j]);
                              updateAdjacent([i, j]);

                              setHexProgress(0);
                            }
                          }}
                          className={`${
                            selected[0] === i && selected[1] === j
                              ? "bg-black text-white"
                              : destination != undefined &&
                                destination[0] == i &&
                                destination[1] == j &&
                                partyAction === "travel"
                              ? "bg-yellow-400"
                              : terrainMatrix[0][0] !== ""
                              ? getTerrainById(col) != undefined
                                ? getTerrainById(col).styles
                                : ""
                              : ""
                          } hexagon relative -mt-[2px] w-8 h-8 flex-none`}
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
              {selected[0] != -1 ? (
                <div className="mt-6 px-3 w-48 flex flex-col items-center">
                  <div>
                    <RadioGroup value={partyAction} onChange={setPartyAction}>
                      <RadioGroup.Label>The party is going to</RadioGroup.Label>

                      <div
                        className={`flex items-center -space-x-px cursor-pointer`}
                      >
                        <RadioGroup.Option value="travel">
                          {({ checked }) => (
                            <div
                              className={`rounded-l border transition-all p-1 ${
                                checked
                                  ? "bg-blue-600 text-white"
                                  : "hover:bg-gray-100"
                              }`}
                            >
                              <span>Travel</span>
                            </div>
                          )}
                        </RadioGroup.Option>
                        <RadioGroup.Option value="search">
                          {({ checked }) => (
                            <div
                              className={`border transition-all p-1 ${
                                checked
                                  ? "bg-blue-600 text-white"
                                  : "hover:bg-gray-100"
                              }`}
                            >
                              <span>Search</span>
                            </div>
                          )}
                        </RadioGroup.Option>
                        <RadioGroup.Option value="rest">
                          {({ checked }) => (
                            <div
                              className={`rounded-r transition-all border p-1 ${
                                checked
                                  ? "bg-blue-600 text-white"
                                  : "hover:bg-gray-100"
                              }`}
                            >
                              <span>Rest</span>
                            </div>
                          )}
                        </RadioGroup.Option>
                      </div>
                    </RadioGroup>
                  </div>
                  {partyAction === "travel" && adjacentHexes != null ? (
                    <div className="flex w-full items-center mt-2">
                      <span>To: </span>
                      <div className="mx-auto w-24 relative">
                        <Listbox
                          value={destination}
                          onChange={(e) => {
                            setDestination([e[2], e[0]]);
                          }}
                        >
                          <Listbox.Button
                            className={
                              "border rounded hover:bg-gray-100 transition-all px-2 w-full"
                            }
                          >
                            {destination != null && partyAction === "travel"
                              ? `${destination[1]}, ${destination[0]}`
                              : "Destination"}
                          </Listbox.Button>
                          <Listbox.Options>
                            <div className="shadow rounded absolute w-24 bg-white">
                              {adjacentHexes.map((hex) => (
                                <Listbox.Option
                                  className={"hover:bg-gray-100 transition-all"}
                                  key={`${hex[1]},${hex[0]}`}
                                  value={`${hex[1]},${hex[0]}`}
                                >
                                  {`${hex[1]},${hex[0]}`}
                                </Listbox.Option>
                              ))}
                            </div>
                          </Listbox.Options>
                        </Listbox>
                      </div>
                    </div>
                  ) : (
                    ""
                  )}
                  {destination != null && partyAction === "travel" ? (
                    <div>
                      <RadioGroup value={hexPosition} onChange={setHexPosition}>
                        <RadioGroup.Label>From</RadioGroup.Label>

                        <div
                          className={`flex items-center -space-x-px cursor-pointer`}
                        >
                          <RadioGroup.Option value="near">
                            {({ checked }) => (
                              <div
                                className={`rounded-l border transition-all p-1 ${
                                  checked
                                    ? "bg-blue-600 text-white"
                                    : "hover:bg-gray-100"
                                }`}
                              >
                                <span>Near Side</span>
                              </div>
                            )}
                          </RadioGroup.Option>
                          <RadioGroup.Option value="far">
                            {({ checked }) => (
                              <div
                                className={`rounded-r border transition-all p-1 ${
                                  checked
                                    ? "bg-blue-600 text-white"
                                    : "hover:bg-gray-100"
                                }`}
                              >
                                <span>Far Side</span>
                              </div>
                            )}
                          </RadioGroup.Option>
                        </div>
                      </RadioGroup>
                      <div className="text-[0.6rem] font-bold">
                        {hexPosition === "near"
                          ? "6 miles away"
                          : "12 miles away"}
                      </div>
                    </div>
                  ) : (
                    ""
                  )}
                  {destination != null && partyAction === "travel" ? (
                    <div className="mt-3">
                      <RadioGroup value={travelSpeed} onChange={setTravelSpeed}>
                        <RadioGroup.Label>Speed</RadioGroup.Label>

                        <div
                          className={`flex items-center -space-x-px cursor-pointer`}
                        >
                          <RadioGroup.Option value="slow">
                            {({ checked }) => (
                              <div
                                className={`rounded-l border transition-all p-1 ${
                                  checked
                                    ? "bg-blue-600 text-white"
                                    : "hover:bg-gray-100"
                                }`}
                              >
                                <span>Slow</span>
                              </div>
                            )}
                          </RadioGroup.Option>
                          <RadioGroup.Option value="normal">
                            {({ checked }) => (
                              <div
                                className={`border transition-all p-1 ${
                                  checked
                                    ? "bg-blue-600 text-white"
                                    : "hover:bg-gray-100"
                                }`}
                              >
                                <span>Normal</span>
                              </div>
                            )}
                          </RadioGroup.Option>
                          <RadioGroup.Option value="fast">
                            {({ checked }) => (
                              <div
                                className={`rounded-r transition-all border p-1 ${
                                  checked
                                    ? "bg-blue-600 text-white"
                                    : "hover:bg-gray-100"
                                }`}
                              >
                                <span>Fast</span>
                              </div>
                            )}
                          </RadioGroup.Option>
                        </div>
                      </RadioGroup>
                      <div className="w-max mx-auto font-bold text-[0.6rem]">
                        {travelSpeed === "slow" ? (
                          <div className="flex flex-col items-center w-36">
                            <span>2mph</span>
                            <span>Can sneak while traveling</span>
                          </div>
                        ) : travelSpeed === "normal" ? (
                          <span>3mph</span>
                        ) : (
                          <div className="flex flex-col items-center w-36">
                            <span>4mph</span>
                            <span>
                              -5 passive perception for spotting danger
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    ""
                  )}
                  {destination != null && partyAction === "travel" ? (
                    <div>
                      <RadioGroup value={roadType} onChange={setRoadType}>
                        <RadioGroup.Label>Road?</RadioGroup.Label>

                        <div
                          className={`flex items-center -space-x-px cursor-pointer`}
                        >
                          <RadioGroup.Option value="pathless">
                            {({ checked }) => (
                              <div
                                className={`rounded-l border transition-all p-1 ${
                                  checked
                                    ? "bg-blue-600 text-white"
                                    : "hover:bg-gray-100"
                                }`}
                              >
                                <span>Pathless</span>
                              </div>
                            )}
                          </RadioGroup.Option>
                          <RadioGroup.Option value="roadTrail">
                            {({ checked }) => (
                              <div
                                className={`rounded-r border transition-all p-1 ${
                                  checked
                                    ? "bg-blue-600 text-white"
                                    : "hover:bg-gray-100"
                                }`}
                              >
                                <span>Road/Trail</span>
                              </div>
                            )}
                          </RadioGroup.Option>
                        </div>
                      </RadioGroup>
                      <div className="text-[0.6rem] font-bold">
                        x
                        {
                          getTerrainById(
                            terrainMatrix[selected[0]][selected[1]]
                          ).speedMods[roadType === "roadTrail" ? 0 : 1]
                        }
                      </div>
                    </div>
                  ) : (
                    ""
                  )}
                  {destination != null && partyAction === "travel" ? (
                    <div>
                      <Disclosure>
                        <Disclosure.Button className="px-2 border rounded my-1 transition-all hover:bg-gray-100">
                          <div>
                            <span>Conditions</span>{" "}
                            <span>
                              (
                              {
                                conditionDefinitions.filter(
                                  (condition) => condition.active
                                ).length
                              }
                              )
                            </span>
                          </div>
                        </Disclosure.Button>
                        <Disclosure.Panel className="text-gray-500">
                          <div className="flex flex-col text-sm border rounded">
                            {conditionDefinitions.map((condition, i) => (
                              <button
                                onClick={() => {
                                  let newDefs = [...conditionDefinitions];
                                  let newObj = { ...condition };
                                  newObj.active = !newObj.active;
                                  newDefs[i] = newObj;
                                  setConditionDefinitions(newDefs);
                                }}
                              >
                                <div
                                  className={`${
                                    condition.active
                                      ? "bg-blue-500 text-white"
                                      : "hover:bg-gray-100"
                                  } transition-all justify-between flex items-center w-full mx-auto p-1`}
                                >
                                  <span>{condition.name}</span>
                                  <span className="font-bold text-xs">
                                    x{condition.speedMod}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </Disclosure.Panel>
                      </Disclosure>
                      <div className="text-[0.6rem] font-bold">
                        x
                        {conditionDefinitions
                          .filter((condition) => condition.active)
                          .map((con) => con.speedMod)
                          .reduce((a, b) => a * b, 1)
                          .toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    ""
                  )}
                  {destination != null && partyAction === "travel" ? (
                    <div>
                      <Switch
                        checked={forceLocation}
                        onChange={setForceLocation}
                        className={`${
                          forceLocation
                            ? "bg-blue-500 text-white hover:bg-blue-600"
                            : "hover:bg-gray-100"
                        } transition-all my-2 px-2 rounded border`}
                      >
                        <span>Force Location on Encounter</span>
                      </Switch>
                    </div>
                  ) : (
                    ""
                  )}
                  {partyAction === "search" ? (
                    <div>
                      <div className="flex items-center gap-3">
                        <span>For</span>
                        <div>
                          <input
                            className="w-12"
                            value={searchTime}
                            type="number"
                            onChange={(e) => {
                              let num = +e.target.value;
                              setSearchTime(num);
                            }}
                          />
                          <span>hours</span>
                        </div>
                      </div>
                      <div>
                        <Switch
                          checked={searchForceLocation}
                          onChange={setSearchForceLocation}
                          className={`${
                            searchForceLocation
                              ? "bg-blue-500 text-white hover:bg-blue-600"
                              : "hover:bg-gray-100"
                          } transition-all my-2 px-2 rounded border`}
                        >
                          <span>Force Location on Encounter</span>
                        </Switch>
                      </div>
                      <div>
                        <Switch
                          checked={searchForceEncounter}
                          onChange={setSearchForceEncounter}
                          className={`${
                            searchForceEncounter
                              ? "bg-blue-500 text-white hover:bg-blue-600"
                              : "hover:bg-gray-100"
                          } transition-all my-2 px-2 rounded border`}
                        >
                          <span>Force Encounter</span>
                        </Switch>
                      </div>

                      {searchTime > 8 - dailyTravelHours ? (
                        <div className="flex items-center gap-2 mb-2 text-xs justify-center">
                          <span className="text-red-500">
                            Warning: Forced March!
                          </span>{" "}
                          <button
                            onClick={() => {
                              setSearchTime(8 - dailyTravelHours);
                            }}
                            className="bg-blue-400 hover:bg-blue-500 rounded text-white px-2"
                          >
                            Reduce
                          </button>
                        </div>
                      ) : (
                        ""
                      )}
                      <button
                        onClick={() => {
                          handleSearch();
                        }}
                        className="px-2 mt-2 rounded bg-blue-400 text-white transition-all hover:bg-blue-500"
                      >
                        GO!
                      </button>
                    </div>
                  ) : (
                    ""
                  )}
                  {partyAction === "rest" ? (
                    <div>
                      <div className="flex items-center gap-3">
                        <span>For</span>
                        <div>
                          <input
                            className="w-12"
                            value={restTime}
                            type="number"
                            onChange={(e) => {
                              let num = +e.target.value;
                              if (
                                num >
                                timeToNextWatch()[0] + timeToNextWatch()[1] / 60
                              ) {
                                num =
                                  timeToNextWatch()[0] +
                                  timeToNextWatch()[1] / 60;
                              }
                              setRestTime(num);
                            }}
                          />
                          <span>hours</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          handleRest();
                        }}
                        className="px-2 mt-2 rounded bg-blue-400 text-white transition-all hover:bg-blue-500"
                      >
                        GO!
                      </button>
                    </div>
                  ) : (
                    ""
                  )}
                </div>
              ) : (
                <div className="flex items-center">
                  <span>Select the current hex</span>
                </div>
              )}
            </div>
            {destination != null && partyAction === "travel" ? (
              <div className="w-72 mx-auto my-4">
                <div className="justify-end flex">
                  <div className="flex">
                    <input
                      className="w-12"
                      value={tempDistance}
                      type="number"
                      onChange={(e) => {
                        setTempDistance(+e.target.value);
                      }}
                    />
                    <button
                      onClick={() => {
                        let num =
                          tempDistance /
                          (travelSpeed === "slow"
                            ? 2
                            : travelSpeed === "normal"
                            ? 3
                            : 4) /
                          getTerrainById(
                            terrainMatrix[selected[0]][selected[1]]
                          ).speedMods[roadType === "roadTrail" ? 0 : 1] /
                          conditionDefinitions
                            .filter((condition) => condition.active)
                            .map((con) => con.speedMod)
                            .reduce((a, b) => a * b, 1);
                        let hexDist = hexPosition === "near" ? 6 : 12;
                        if (tempDistance > hexDist - hexProgress) {
                          num =
                            (hexDist - hexProgress) /
                            (travelSpeed === "slow"
                              ? 2
                              : travelSpeed === "normal"
                              ? 3
                              : 4) /
                            getTerrainById(
                              terrainMatrix[selected[0]][selected[1]]
                            ).speedMods[roadType === "roadTrail" ? 0 : 1] /
                            conditionDefinitions
                              .filter((condition) => condition.active)
                              .map((con) => con.speedMod)
                              .reduce((a, b) => a * b, 1);
                        }

                        if (
                          num >
                          timeToNextWatch()[0] + timeToNextWatch()[1] / 60
                        ) {
                          num =
                            timeToNextWatch()[0] + timeToNextWatch()[1] / 60;
                        }

                        setTravelTime(num);
                      }}
                      className="text-sm rounded bg-blue-400 px-1 text-white hover:bg-blue-500"
                    >
                      Set Distance
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 my-4">
                  <div className="flex items-center">
                    <input
                      className="w-12"
                      value={travelTime}
                      type="number"
                      onChange={(e) => {
                        let num = +e.target.value;
                        if (
                          num >
                          timeToNextWatch()[0] + timeToNextWatch()[1] / 60
                        ) {
                          num =
                            timeToNextWatch()[0] + timeToNextWatch()[1] / 60;
                        }

                        let numDist =
                          num *
                          (travelSpeed === "slow"
                            ? 2
                            : travelSpeed === "normal"
                            ? 3
                            : 4) *
                          getTerrainById(
                            terrainMatrix[selected[0]][selected[1]]
                          ).speedMods[roadType === "roadTrail" ? 0 : 1] *
                          conditionDefinitions
                            .filter((condition) => condition.active)
                            .map((con) => con.speedMod)
                            .reduce((a, b) => a * b, 1);
                        let hexDist = hexPosition === "near" ? 6 : 12;
                        if (numDist > hexDist - hexProgress) {
                          num =
                            (hexDist - hexProgress) /
                            (travelSpeed === "slow"
                              ? 2
                              : travelSpeed === "normal"
                              ? 3
                              : 4) /
                            getTerrainById(
                              terrainMatrix[selected[0]][selected[1]]
                            ).speedMods[roadType === "roadTrail" ? 0 : 1] /
                            conditionDefinitions
                              .filter((condition) => condition.active)
                              .map((con) => con.speedMod)
                              .reduce((a, b) => a * b, 1);
                        }
                        setTravelTime(num);
                      }}
                    />
                    <span>hours</span>
                  </div>

                  <div>x</div>
                  <div className="font-bold">
                    {travelSpeed === "slow" ? (
                      <span>2mph</span>
                    ) : travelSpeed === "normal" ? (
                      <span>3mph</span>
                    ) : (
                      <span>4mph</span>
                    )}
                  </div>
                  <div>x</div>
                  <div className="font-bold">
                    {
                      getTerrainById(terrainMatrix[selected[0]][selected[1]])
                        .speedMods[roadType === "roadTrail" ? 0 : 1]
                    }
                  </div>
                  <div>x</div>
                  <div className="font-bold">
                    {" "}
                    {conditionDefinitions
                      .filter((condition) => condition.active)
                      .map((con) => con.speedMod)
                      .reduce((a, b) => a * b, 1)
                      .toFixed(2)}
                  </div>
                  <div>=</div>
                  <div className="font-bold">{travelDistance.toFixed(2)}</div>
                  <div>miles</div>
                </div>
                {travelTime > 8 - dailyTravelHours ? (
                  <div className="flex items-center gap-2 mb-2 text-xs justify-center">
                    <span className="text-red-500">Warning: Forced March!</span>{" "}
                    <button
                      onClick={() => {
                        setTravelTime(8 - dailyTravelHours);
                      }}
                      className="bg-blue-400 hover:bg-blue-500 rounded text-white px-2"
                    >
                      Reduce
                    </button>
                  </div>
                ) : (
                  ""
                )}
                <button
                  onClick={() => {
                    handleGo();
                  }}
                  className="px-2 rounded bg-blue-400 text-white transition-all hover:bg-blue-500"
                >
                  GO!
                </button>
              </div>
            ) : (
              ""
            )}
          </Tab.Panel>
          <Tab.Panel>
            <div>
              <div className="mt-2 flex items-center justify-center gap-4">
                <button
                  onClick={exportConfigJson}
                  className="px-2 border rounded hover:bg-gray-100 transition-all"
                >
                  Export
                </button>
                <input type="file" onChange={importConfigJson} />
              </div>
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
                    <div className="w-64 rounded shadow">
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
                              localStorage.setItem(
                                "terrainDefinitions",
                                JSON.stringify(newDefs)
                              );
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
                                localStorage.setItem(
                                  "terrainDefinitions",
                                  JSON.stringify(newDefs)
                                );
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
                            localStorage.setItem(
                              "terrainDefinitions",
                              JSON.stringify(newDefs)
                            );
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
                              Road/Trail:{" "}
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
                                    localStorage.setItem(
                                      "terrainDefinitions",
                                      JSON.stringify(newDefs)
                                    );
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
                                  value={terrain.speedMods[1]}
                                  type="number"
                                  onChange={(e) => {
                                    let newDefs = [...terrainDefinitions];
                                    let newObj = { ...newDefs[i] };
                                    newObj.speedMods[1] = +e.target.value;
                                    newDefs[i] = newObj;
                                    setTerrainDefinitions(newDefs);
                                    localStorage.setItem(
                                      "terrainDefinitions",
                                      JSON.stringify(newDefs)
                                    );
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
                              localStorage.setItem(
                                "terrainDefinitions",
                                JSON.stringify(newDefs)
                              );
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex text-xs py-2 justify-around">
                        <div>
                          <span>Navigation DC</span>{" "}
                          <input
                            className="w-12"
                            value={terrain.navigationDC}
                            type="number"
                            onChange={(e) => {
                              let newDefs = [...terrainDefinitions];
                              let newObj = { ...newDefs[i] };
                              newObj.navigationDC = +e.target.value;
                              newDefs[i] = newObj;
                              setTerrainDefinitions(newDefs);
                              localStorage.setItem(
                                "terrainDefinitions",
                                JSON.stringify(newDefs)
                              );
                            }}
                          />
                        </div>
                        <div>
                          <span>Forage DC</span>{" "}
                          <input
                            className="w-12"
                            value={terrain.forageDC}
                            type="number"
                            onChange={(e) => {
                              let newDefs = [...terrainDefinitions];
                              let newObj = { ...newDefs[i] };
                              newObj.forageDC = +e.target.value;
                              newDefs[i] = newObj;
                              setTerrainDefinitions(newDefs);
                              localStorage.setItem(
                                "terrainDefinitions",
                                JSON.stringify(newDefs)
                              );
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <span>Foraging</span>
                        {terrain.forageTable != undefined ? (
                          <div>
                            <table className="w-full">
                              <tbody>
                                {terrain.forageTable.map((item, j) => (
                                  <tr
                                    className={`${
                                      j % 2 === 0 ? "bg-gray-100" : ""
                                    }`}
                                  >
                                    <th className="px-1">
                                      <input
                                        className="w-full bg-transparent "
                                        value={item[0]}
                                        type="text"
                                        onChange={(e) => {
                                          let newDefs = [...terrainDefinitions];
                                          let newObj = { ...newDefs[i] };
                                          let newTab = [...newObj.forageTable];
                                          newTab[j][0] = e.target.value;
                                          newObj.forageTable = newTab;
                                          newDefs[i] = newObj;
                                          setTerrainDefinitions(newDefs);
                                          localStorage.setItem(
                                            "terrainDefinitions",
                                            JSON.stringify(newDefs)
                                          );
                                        }}
                                      />
                                    </th>
                                    <td>
                                      <input
                                        className="w-full bg-transparent "
                                        value={item[1]}
                                        type="text"
                                        onChange={(e) => {
                                          let newDefs = [...terrainDefinitions];
                                          let newObj = { ...newDefs[i] };
                                          let newTab = [...newObj.forageTable];
                                          newTab[j][1] = e.target.value;
                                          newObj.forageTable = newTab;
                                          newDefs[i] = newObj;
                                          setTerrainDefinitions(newDefs);
                                          localStorage.setItem(
                                            "terrainDefinitions",
                                            JSON.stringify(newDefs)
                                          );
                                        }}
                                      />
                                    </td>
                                    <td>
                                      <button
                                        className="bg-transparent mr-2 hover:fill-white hover:bg-red-500 transition-all p-1 rounded"
                                        onClick={() => {
                                          let newDefs = [...terrainDefinitions];
                                          let newObj = { ...newDefs[i] };
                                          let newTab = [...newObj.forageTable];
                                          newTab.splice(j, 1);
                                          newObj.forageTable = newTab;
                                          newDefs[i] = newObj;
                                          setTerrainDefinitions(newDefs);
                                          localStorage.setItem(
                                            "terrainDefinitions",
                                            JSON.stringify(newDefs)
                                          );
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
                              </tbody>
                            </table>
                            <button
                              className="w-full bg-transparent hover:fill-white hover:bg-green-500 transition-all rounded-b py-2"
                              onClick={() => {
                                let newDefs = [...terrainDefinitions];
                                let newObj = { ...newDefs[i] };
                                let newTab = [...newObj.forageTable];
                                newTab.push(["", ""]);
                                newObj.forageTable = newTab;
                                newDefs[i] = newObj;
                                setTerrainDefinitions(newDefs);
                                localStorage.setItem(
                                  "terrainDefinitions",
                                  JSON.stringify(newDefs)
                                );
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
                        ) : (
                          ""
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="w-64 h-32 rounded shadow flex">
                    {" "}
                    <button
                      className="w-full bg-transparent hover:fill-white hover:bg-green-500 transition-all rounded py-2"
                      onClick={() => {
                        let newDefs = [...terrainDefinitions];
                        newDefs.push(emptyTerrain);
                        setTerrainDefinitions(newDefs);
                        localStorage.setItem(
                          "terrainDefinitions",
                          JSON.stringify(newDefs)
                        );
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
                              localStorage.setItem(
                                "regionDefinitions",
                                JSON.stringify(newDefs)
                              );
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
                              localStorage.setItem(
                                "regionDefinitions",
                                JSON.stringify(newDefs)
                              );
                            }}
                          />
                        </span>
                        <button
                          className="w-max bg-transparent mr-2 hover:fill-white hover:bg-red-500 transition-all p-1 rounded"
                          onClick={() => {
                            let newDefs = [...regionDefinitions];
                            newDefs.splice(i, 1);
                            setRegionDefinitions(newDefs);
                            localStorage.setItem(
                              "regionDefinitions",
                              JSON.stringify(newDefs)
                            );
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
                      <div className="flex px-4">
                        <input
                          className="w-10"
                          value={region.encounterRate}
                          type="number"
                          onChange={(e) => {
                            let newDefs = [...regionDefinitions];
                            let newObj = { ...newDefs[i] };
                            newObj.encounterRate = +e.target.value;
                            newDefs[i] = newObj;
                            setRegionDefinitions(newDefs);
                            localStorage.setItem(
                              "regionDefinitions",
                              JSON.stringify(newDefs)
                            );
                          }}
                        />
                        <span>% chance per watch</span>
                      </div>
                      <table className="w-full">
                        <tbody>
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
                                    localStorage.setItem(
                                      "regionDefinitions",
                                      JSON.stringify(newDefs)
                                    );
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
                                    localStorage.setItem(
                                      "regionDefinitions",
                                      JSON.stringify(newDefs)
                                    );
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
                        </tbody>
                      </table>
                      <button
                        className="w-full bg-transparent hover:fill-white hover:bg-green-500 transition-all rounded-b py-2"
                        onClick={() => {
                          let newDefs = [...regionDefinitions];
                          let newObj = { ...newDefs[i] };
                          let newTab = [...newObj.encounterTable];
                          newTab.push("");
                          newObj.encounterTable = newTab;
                          newDefs[i] = newObj;
                          setRegionDefinitions(newDefs);
                          localStorage.setItem(
                            "regionDefinitions",
                            JSON.stringify(newDefs)
                          );
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
                  <div className="w-64 h-32 rounded shadow flex items-center flex-col">
                    <button
                      className="w-full bg-transparent hover:fill-white hover:bg-green-500 transition-all rounded py-2 flex-grow"
                      onClick={() => {
                        let newDefs = [...regionDefinitions];
                        newDefs.push(emptyRegion);
                        setRegionDefinitions(newDefs);
                        localStorage.setItem(
                          "regionDefinitions",
                          JSON.stringify(newDefs)
                        );
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
              <div className="w-72 rounded shadow mx-auto mt-4">
                <div className="space-x-3 py-2 px-3 flex items-center justify-between">
                  <span className="w-max font-bold">Conditions</span>
                </div>
                <table className="w-full">
                  <tbody>
                    {conditionDefinitions.map((condition, i) => (
                      <tr className={`${i % 2 === 0 ? "bg-gray-100" : ""}`}>
                        <th className="px-1 font-normal">
                          <input
                            className="w-full bg-transparent "
                            value={condition.name}
                            type="text"
                            onChange={(e) => {
                              let newDefs = [...conditionDefinitions];
                              let newObj = { ...newDefs[i] };
                              newObj.name = e.target.value;
                              newDefs[i] = newObj;
                              setConditionDefinitions(newDefs);
                              localStorage.setItem(
                                "conditionDefinitions",
                                JSON.stringify(newDefs)
                              );
                            }}
                          />
                        </th>
                        <td>
                          <span className="flex">
                            x
                            <input
                              className="w-full bg-transparent "
                              value={condition.speedMod}
                              type="number"
                              onChange={(e) => {
                                let newDefs = [...conditionDefinitions];
                                let newObj = { ...newDefs[i] };
                                newObj.speedMod = +e.target.value;
                                newDefs[i] = newObj;
                                setConditionDefinitions(newDefs);
                                localStorage.setItem(
                                  "conditionDefinitions",
                                  JSON.stringify(newDefs)
                                );
                              }}
                            />
                          </span>
                        </td>
                        <td>
                          <button
                            className="bg-transparent mr-2 hover:fill-white hover:bg-red-500 transition-all p-1 rounded"
                            onClick={() => {
                              let newDefs = [...conditionDefinitions];
                              newDefs.splice(i, 1);
                              setConditionDefinitions(newDefs);
                              localStorage.setItem(
                                "conditionDefinitions",
                                JSON.stringify(newDefs)
                              );
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
                  </tbody>
                </table>
                <button
                  className="w-full bg-transparent hover:fill-white hover:bg-green-500 transition-all rounded-b py-2"
                  onClick={() => {
                    let newDefs = [...conditionDefinitions];
                    newDefs.push(emptyCondition);
                    setConditionDefinitions(newDefs);
                    localStorage.setItem(
                      "conditionDefinitions",
                      JSON.stringify(newDefs)
                    );
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
              <h1 className="text-center font-bold mt-4 text-lg">Weather</h1>
              <div className="flex flex-wrap max-w-2xl mx-auto">
                <div className="w-72 rounded shadow mx-auto mt-4">
                  <div className="space-x-3 py-2 px-3 flex items-center justify-between">
                    <span className="w-max font-bold">Winter</span>
                  </div>
                  <table className="w-full">
                    <tbody>
                      {winterTable.map((winterWeather, i) => (
                        <tr className={`${i % 2 === 0 ? "bg-gray-100" : ""}`}>
                          <th className="px-1 font-normal">
                            <div className="flex items-center">
                              <input
                                className="w-12 bg-transparent "
                                value={winterWeather.range[0]}
                                type="number"
                                onChange={(e) => {
                                  let newTab = [...winterTable];
                                  let newObj = { ...newTab[i] };
                                  let prevObj = { ...newTab[i - 1] };
                                  newObj.range[0] =
                                    i == 0
                                      ? 1
                                      : +e.target.value >
                                        winterTable[i - 1].range[0]
                                      ? i == winterTable.length - 1 ||
                                        +e.target.value <
                                          winterTable[i + 1].range[0]
                                        ? +e.target.value
                                        : winterTable[i + 1].range[0] - 1
                                      : winterTable[i - 1].range[0] + 1;
                                  newObj.range[1] =
                                    winterTable[i + 1] != undefined
                                      ? winterTable[i + 1].range[0] - 1
                                      : newObj.range[0];
                                  newTab[i] = newObj;
                                  if (prevObj != undefined) {
                                    prevObj.range[1] = newObj.range[0] - 1;
                                    newTab[i - 1] = prevObj;
                                  }
                                  setWinterTable(newTab);
                                  localStorage.setItem(
                                    "winterTable",
                                    JSON.stringify(newTab)
                                  );
                                }}
                              />
                              {i < winterTable.length - 1 &&
                              winterTable[i + 1].range[0] - 1 !==
                                winterTable[i].range[0] ? (
                                <span>-{winterTable[i].range[1]}</span>
                              ) : (
                                ""
                              )}
                            </div>
                          </th>
                          <td>
                            <input
                              className="w-full bg-transparent "
                              value={winterWeather.name}
                              type="text"
                              onChange={(e) => {
                                let newTab = [...winterTable];
                                let newObj = { ...newTab[i] };
                                newObj.name = e.target.value;
                                newTab[i] = newObj;
                                setWinterTable(newTab);
                                localStorage.setItem(
                                  "winterTable",
                                  JSON.stringify(newTab)
                                );
                              }}
                            />
                          </td>
                          <td>
                            <input
                              className="w-full bg-transparent "
                              value={winterWeather.description}
                              type="text"
                              onChange={(e) => {
                                let newTab = [...winterTable];
                                let newObj = { ...newTab[i] };
                                newObj.description = e.target.value;
                                newTab[i] = newObj;
                                setWinterTable(newTab);
                                localStorage.setItem(
                                  "winterTable",
                                  JSON.stringify(newTab)
                                );
                              }}
                            />
                          </td>
                          <td>
                            <button
                              className="bg-transparent mr-2 hover:fill-white hover:bg-red-500 transition-all p-1 rounded"
                              onClick={() => {
                                let newDefs = [...winterTable];
                                newDefs.splice(i, 1);
                                setWinterTable(newDefs);
                                localStorage.setItem(
                                  "winterTable",
                                  JSON.stringify(newDefs)
                                );
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
                    </tbody>
                  </table>
                  <button
                    className="w-full bg-transparent hover:fill-white hover:bg-green-500 transition-all rounded-b py-2"
                    onClick={() => {
                      let newWinter = [...winterTable];
                      let newWeather = { ...emptyWeather };
                      if (winterTable.length > 0) {
                        newWeather.range[0] =
                          newWinter[newWinter.length - 1].range[1] + 1;
                      }
                      newWinter.push(newWeather);
                      setWinterTable(newWinter);
                      localStorage.setItem(
                        "winterTable",
                        JSON.stringify(newWinter)
                      );
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

                <div className="w-72 rounded shadow mx-auto mt-4">
                  <div className="space-x-3 py-2 px-3 flex items-center justify-between">
                    <span className="w-max font-bold">Spring</span>
                  </div>
                  <table className="w-full">
                    <tbody>
                      {springTable.map((springWeather, i) => (
                        <tr className={`${i % 2 === 0 ? "bg-gray-100" : ""}`}>
                          <th className="px-1 font-normal">
                            <div className="flex items-center">
                              <input
                                className="w-12 bg-transparent "
                                value={springWeather.range[0]}
                                type="number"
                                onChange={(e) => {
                                  let newTab = [...springTable];
                                  let newObj = { ...newTab[i] };
                                  let prevObj = { ...newTab[i - 1] };
                                  newObj.range[0] =
                                    i == 0
                                      ? 1
                                      : +e.target.value >
                                        springTable[i - 1].range[0]
                                      ? i == springTable.length - 1 ||
                                        +e.target.value <
                                          springTable[i + 1].range[0]
                                        ? +e.target.value
                                        : springTable[i + 1].range[0] - 1
                                      : springTable[i - 1].range[0] + 1;
                                  newObj.range[1] =
                                    springTable[i + 1] != undefined
                                      ? springTable[i + 1].range[0] - 1
                                      : newObj.range[0];
                                  newTab[i] = newObj;
                                  if (prevObj != undefined) {
                                    prevObj.range[1] = newObj.range[0] - 1;
                                    newTab[i - 1] = prevObj;
                                  }
                                  setSpringTable(newTab);
                                  localStorage.setItem(
                                    "springTable",
                                    JSON.stringify(newTab)
                                  );
                                }}
                              />
                              {i < springTable.length - 1 &&
                              springTable[i + 1].range[0] - 1 !==
                                springTable[i].range[0] ? (
                                <span>-{springTable[i].range[1]}</span>
                              ) : (
                                ""
                              )}
                            </div>
                          </th>
                          <td>
                            <input
                              className="w-full bg-transparent "
                              value={springWeather.name}
                              type="text"
                              onChange={(e) => {
                                let newTab = [...springTable];
                                let newObj = { ...newTab[i] };
                                newObj.name = e.target.value;
                                newTab[i] = newObj;
                                setSpringTable(newTab);
                                localStorage.setItem(
                                  "springTable",
                                  JSON.stringify(newTab)
                                );
                              }}
                            />
                          </td>
                          <td>
                            <input
                              className="w-full bg-transparent "
                              value={springWeather.description}
                              type="text"
                              onChange={(e) => {
                                let newTab = [...springTable];
                                let newObj = { ...newTab[i] };
                                newObj.description = e.target.value;
                                newTab[i] = newObj;
                                setSpringTable(newTab);
                                localStorage.setItem(
                                  "springTable",
                                  JSON.stringify(newTab)
                                );
                              }}
                            />
                          </td>
                          <td>
                            <button
                              className="bg-transparent mr-2 hover:fill-white hover:bg-red-500 transition-all p-1 rounded"
                              onClick={() => {
                                let newDefs = [...springTable];
                                newDefs.splice(i, 1);
                                setSpringTable(newDefs);
                                localStorage.setItem(
                                  "springTable",
                                  JSON.stringify(newDefs)
                                );
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
                    </tbody>
                  </table>
                  <button
                    className="w-full bg-transparent hover:fill-white hover:bg-green-500 transition-all rounded-b py-2"
                    onClick={() => {
                      let newSpring = [...springTable];
                      let newWeather = { ...emptyWeather };
                      if (springTable.length > 0) {
                        newWeather.range[0] =
                          newSpring[newSpring.length - 1].range[1] + 1;
                      }
                      newSpring.push(newWeather);
                      setSpringTable(newSpring);
                      localStorage.setItem(
                        "springTable",
                        JSON.stringify(newSpring)
                      );
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
                <div className="w-72 rounded shadow mx-auto mt-4">
                  <div className="space-x-3 py-2 px-3 flex items-center justify-between">
                    <span className="w-max font-bold">Summer</span>
                  </div>
                  <table className="w-full">
                    <tbody>
                      {summerTable.map((summerWeather, i) => (
                        <tr className={`${i % 2 === 0 ? "bg-gray-100" : ""}`}>
                          <th className="px-1 font-normal">
                            <div className="flex items-center">
                              <input
                                className="w-12 bg-transparent "
                                value={summerWeather.range[0]}
                                type="number"
                                onChange={(e) => {
                                  let newTab = [...summerTable];
                                  let newObj = { ...newTab[i] };
                                  let prevObj = { ...newTab[i - 1] };
                                  newObj.range[0] =
                                    i == 0
                                      ? 1
                                      : +e.target.value >
                                        summerTable[i - 1].range[0]
                                      ? i == summerTable.length - 1 ||
                                        +e.target.value <
                                          summerTable[i + 1].range[0]
                                        ? +e.target.value
                                        : summerTable[i + 1].range[0] - 1
                                      : summerTable[i - 1].range[0] + 1;
                                  newObj.range[1] =
                                    summerTable[i + 1] != undefined
                                      ? summerTable[i + 1].range[0] - 1
                                      : newObj.range[0];
                                  newTab[i] = newObj;
                                  if (prevObj != undefined) {
                                    prevObj.range[1] = newObj.range[0] - 1;
                                    newTab[i - 1] = prevObj;
                                  }
                                  setSummerTable(newTab);
                                  localStorage.setItem(
                                    "summerTable",
                                    JSON.stringify(newTab)
                                  );
                                }}
                              />
                              {i < summerTable.length - 1 &&
                              summerTable[i + 1].range[0] - 1 !==
                                summerTable[i].range[0] ? (
                                <span>-{summerTable[i].range[1]}</span>
                              ) : (
                                ""
                              )}
                            </div>
                          </th>
                          <td>
                            <input
                              className="w-full bg-transparent "
                              value={summerWeather.name}
                              type="text"
                              onChange={(e) => {
                                let newTab = [...summerTable];
                                let newObj = { ...newTab[i] };
                                newObj.name = e.target.value;
                                newTab[i] = newObj;
                                setSummerTable(newTab);
                                localStorage.setItem(
                                  "summerTable",
                                  JSON.stringify(newTab)
                                );
                              }}
                            />
                          </td>
                          <td>
                            <input
                              className="w-full bg-transparent "
                              value={summerWeather.description}
                              type="text"
                              onChange={(e) => {
                                let newTab = [...summerTable];
                                let newObj = { ...newTab[i] };
                                newObj.description = e.target.value;
                                newTab[i] = newObj;
                                setSummerTable(newTab);
                                localStorage.setItem(
                                  "summerTable",
                                  JSON.stringify(newTab)
                                );
                              }}
                            />
                          </td>
                          <td>
                            <button
                              className="bg-transparent mr-2 hover:fill-white hover:bg-red-500 transition-all p-1 rounded"
                              onClick={() => {
                                let newDefs = [...summerTable];
                                newDefs.splice(i, 1);
                                setSummerTable(newDefs);
                                localStorage.setItem(
                                  "summerTable",
                                  JSON.stringify(newDefs)
                                );
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
                    </tbody>
                  </table>
                  <button
                    className="w-full bg-transparent hover:fill-white hover:bg-green-500 transition-all rounded-b py-2"
                    onClick={() => {
                      let newSummer = [...summerTable];
                      let newWeather = { ...emptyWeather };
                      if (summerTable.length > 0) {
                        newWeather.range[0] =
                          newSummer[newSummer.length - 1].range[1] + 1;
                      }
                      newSummer.push(newWeather);
                      setSummerTable(newSummer);
                      localStorage.setItem(
                        "summerTable",
                        JSON.stringify(newSummer)
                      );
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
                <div className="w-72 rounded shadow mx-auto mt-4">
                  <div className="space-x-3 py-2 px-3 flex items-center justify-between">
                    <span className="w-max font-bold">Autumn</span>
                  </div>
                  <table className="w-full">
                    <tbody>
                      {autumnTable.map((autumnWeather, i) => (
                        <tr className={`${i % 2 === 0 ? "bg-gray-100" : ""}`}>
                          <th className="px-1 font-normal">
                            <div className="flex items-center">
                              <input
                                className="w-12 bg-transparent "
                                value={autumnWeather.range[0]}
                                type="number"
                                onChange={(e) => {
                                  let newTab = [...autumnTable];
                                  let newObj = { ...newTab[i] };
                                  let prevObj = { ...newTab[i - 1] };
                                  newObj.range[0] =
                                    i == 0
                                      ? 1
                                      : +e.target.value >
                                        autumnTable[i - 1].range[0]
                                      ? i == autumnTable.length - 1 ||
                                        +e.target.value <
                                          autumnTable[i + 1].range[0]
                                        ? +e.target.value
                                        : autumnTable[i + 1].range[0] - 1
                                      : autumnTable[i - 1].range[0] + 1;
                                  newObj.range[1] =
                                    autumnTable[i + 1] != undefined
                                      ? autumnTable[i + 1].range[0] - 1
                                      : newObj.range[0];
                                  newTab[i] = newObj;
                                  if (prevObj != undefined) {
                                    prevObj.range[1] = newObj.range[0] - 1;
                                    newTab[i - 1] = prevObj;
                                  }
                                  setAutumnTable(newTab);
                                  localStorage.setItem(
                                    "autumnTable",
                                    JSON.stringify(newTab)
                                  );
                                }}
                              />
                              {i < autumnTable.length - 1 &&
                              autumnTable[i + 1].range[0] - 1 !==
                                autumnTable[i].range[0] ? (
                                <span>-{autumnTable[i].range[1]}</span>
                              ) : (
                                ""
                              )}
                            </div>
                          </th>
                          <td>
                            <input
                              className="w-full bg-transparent "
                              value={autumnWeather.name}
                              type="text"
                              onChange={(e) => {
                                let newTab = [...autumnTable];
                                let newObj = { ...newTab[i] };
                                newObj.name = e.target.value;
                                newTab[i] = newObj;
                                setAutumnTable(newTab);
                                localStorage.setItem(
                                  "autumnTable",
                                  JSON.stringify(newTab)
                                );
                              }}
                            />
                          </td>
                          <td>
                            <input
                              className="w-full bg-transparent "
                              value={autumnWeather.description}
                              type="text"
                              onChange={(e) => {
                                let newTab = [...autumnTable];
                                let newObj = { ...newTab[i] };
                                newObj.description = e.target.value;
                                newTab[i] = newObj;
                                setAutumnTable(newTab);
                                localStorage.setItem(
                                  "autumnTable",
                                  JSON.stringify(newTab)
                                );
                              }}
                            />
                          </td>
                          <td>
                            <button
                              className="bg-transparent mr-2 hover:fill-white hover:bg-red-500 transition-all p-1 rounded"
                              onClick={() => {
                                let newDefs = [...autumnTable];
                                newDefs.splice(i, 1);
                                setAutumnTable(newDefs);
                                localStorage.setItem(
                                  "autumnTable",
                                  JSON.stringify(newDefs)
                                );
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
                    </tbody>
                  </table>
                  <button
                    className="w-full bg-transparent hover:fill-white hover:bg-green-500 transition-all rounded-b py-2"
                    onClick={() => {
                      let newAutumn = [...autumnTable];
                      let newWeather = { ...emptyWeather };
                      if (autumnTable.length > 0) {
                        newWeather.range[0] =
                          newAutumn[newAutumn.length - 1].range[1] + 1;
                      }
                      newAutumn.push(newWeather);
                      setAutumnTable(newAutumn);
                      localStorage.setItem(
                        "autumnTable",
                        JSON.stringify(newAutumn)
                      );
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
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}

export default App;
