// Frondend Controller //

import { useEffect, useState } from "react";
import Select from "react-select";
import ReactECharts from "echarts-for-react"

function App() {
  const [folder, setFolder] = useState("");
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedStat, setSelectedStat] = useState(null);

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

  const filteredStats = stats.filter(stat => 
    (!selectedCategory || stat.category === selectedCategory.value) &&
    (!selectedStat || stat.statistic === selectedStat.value)
  );

  
  async function importFolder(selectedFolder) { // import folder function
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

  async function selectFolder() { // function for selecting a folder
    try {
      const selectedFolder =
        await window.minecraftAPI.selectStatsFolder();

      if (selectedFolder) {
        await importFolder(selectedFolder);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { //listener for user selecting a folder
    const unsubscribe =
      window.minecraftAPI.onStatsFolderSelected((selectedFolder) => {
        importFolder(selectedFolder);
      });

    return unsubscribe;
  }, []);

  return ( // App Display
    <div className="app">
      <h1>Minecraft Statistics</h1>

      <button onClick={() => window.minecraftAPI.restartApp()} disabled={loading}>
        Restart App
      </button>

      {loading && <p>Importing statistics...</p>}

      {error && <p className="error">{error}</p>}

      {folder && (
        <p>
          Current world: {folder.split(/[\\/]/).filter(Boolean).at(-1)}
        </p>
      )}

      <p>Loaded {stats.length} statistics</p>

      <div className="category-selector">
        <Select
          options={categoryOptions}
          value={selectedCategory}
          onChange={setSelectedCategory}
          placeholder="Search categories..."
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
          placeholder="Search statistics..."
          isSearchable
          isClearable
          isDisabled={!selectedCategory}
        />
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Player</th>
            <th>Category</th>
            <th>Statistic</th>
            <th>Value</th>
          </tr>
        </thead>

        <tbody>
          {filteredStats.map((stat) => (
            <tr
              key={`${stat.player_uuid}-${stat.category}-${stat.statistic}`}
            >
              <td>{stat.player_name}</td>
              <td>{stat.category}</td>
              <td>{stat.statistic}</td>
              <td>{stat.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;