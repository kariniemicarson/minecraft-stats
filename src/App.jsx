// Frondend Controller //

import { useEffect, useState } from "react";
import Select from "react-select";
import ReactECharts from "echarts-for-react";
import "./App.css";

function App() {
  const [folder, setFolder] = useState("");
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedStat, setSelectedStat] = useState(null);
  const [chartData, setChartData] = useState(null);

  const categoryOptions = [ // category search bar
    ...new Set(stats.map(stat => stat.category))
      ].sort().map(category => ({
        value: category,
        label: category.replace("minecraft:", "").replaceAll("_", " ")
  }));

  const statOptions = [ // stat search bar
  ...new Set(
    stats
      .filter(stat =>
        !selectedCategory || stat.category === selectedCategory.value
      )
      .map(stat => stat.statistic)
  )
  ].sort().map(statistic => ({
  value: statistic,
  label: statistic.replace("minecraft:", "").replaceAll("_", " ")
  }));

  async function importFolder(selectedFolder) { // import folder function
    setChartData(null);
    setSelectedCategory(null);
    setSelectedStat(null);
    setLoading(true);
    setError("");

    try {
      await window.minecraftAPI.importStats(selectedFolder);

      const updatedStats = await window.minecraftAPI.getStats();

      setFolder(selectedFolder);
      setStats(updatedStats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  
  function handleSearch() { // Search bar functionality
    if (!selectedCategory || !selectedStat) { return; }

    const statistic = selectedStat.value;

    let divisor = 1;

    if (statistic.includes("damage")) {
      divisor = 20; // Damage to hearts
    } else if (statistic.endsWith("_one_cm")) {
      divisor = 100; // Centimeters to blocks
    }

    const results = stats
      .filter(stat =>
        stat.category === selectedCategory.value &&
        stat.statistic === statistic).map(stat => ({
          ...stat,
          value: stat.value / divisor
        })).sort((a, b) => b.value - a.value);

    setChartData({
      category: selectedCategory.label,
      statistic: selectedStat.label,
      unit: divisor === 20 ? "hearts" : divisor === 100 ? "blocks" : "",
      results: results
    });
  }

  
  const chartOptions = chartData ? {
    backgroundColor: "transparent",

    title: {
      text: `${chartData.statistic}${chartData.unit ? ` (${chartData.unit})` : ""} Leaderboard`,
      textStyle: {
        color: "#ffffff"
      }
    },

    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow"
      }
    },

    grid: {
      left: 130,
      right: 50,
      top: 65,
      bottom: 40
    },

    xAxis: {
      type: "value",
      min: 0,
      axisLabel: {
        color: "#cccccc"
      }
    },

    yAxis: {
      type: "category",
      inverse: true,
      data: chartData.results.map(stat => stat.player_name),
      axisLabel: {
        color: "#ffffff"
      }
    },

    series: [{
      name: chartData.statistic,
      type: "bar",
      data: chartData.results.map(stat => stat.value),
      itemStyle: {
        color: "#55aa55"
      },
      label: {
        show: true,
        position: "right",
        color: "#ffffff",
        formatter: (params) => `${params.value} ${chartData.unit}`
      }
    }]
  } : null;



  useEffect(() => { //listener for user selecting a folder
    const unsubscribe =
      window.minecraftAPI.onStatsFolderSelected((selectedFolder) => {
        importFolder(selectedFolder);
      });

    return unsubscribe;
  }, []);

  return ( // App Display
    <div className="app">
      <h1>Minecraft Statistics{folder && `: ${folder.split(/[\\/]/).filter(Boolean).at(-1)}`}</h1>

      <button onClick={() => window.minecraftAPI.restartApp()} disabled={loading}>
        Restart App
      </button>

      {loading && <p>Importing statistics...</p>}

      {error && <p className="error">{error}</p>}

      <p>Loaded {stats.length} statistics</p>

      <div className="category-selector">
        <label htmlFor="category-select">Category</label>

        <Select
          options={categoryOptions}
          value={selectedCategory}
          onChange={(category) => {
            setSelectedCategory(category);
            setSelectedStat(null);
          }}
          classNamePrefix="react-select"
          placeholder="Search categories:"
          isSearchable
          isClearable
        />
      </div>

      <div className="statistic-selector">
        <label htmlFor="statistic-select">Statistic</label>

        <Select
          inputId="statistic-select"
          options={statOptions}
          value={selectedStat}
          onChange={setSelectedStat}
          classNamePrefix="react-select"
          placeholder="Search statistics:"
          isSearchable
          isClearable
          isDisabled={!selectedCategory}
        />
      </div>

      <button onClick={handleSearch} disabled={loading || !selectedCategory || !selectedStat} >Search</button>
      
      
      <div className="chart-container">
        {chartData ? (
          chartData.results.length > 0 ? (
            <ReactECharts
              option={chartOptions}
              style={{
                height: `${Math.max(350, chartData.results.length * 55)}px`,
                width: "100%"
              }}
              notMerge={true}
            />
          ) : (
            <p>No statistics found for this selection.</p>
          )
        ) : (
          <p>Select a category and statistic, then click Search.</p>
        )}
      </div>

    </div>
  );
}

export default App;