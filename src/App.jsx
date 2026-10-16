// Frondend Controller //

import { useEffect, useState } from "react";

function App() {
  const [folder, setFolder] = useState("");
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function importFolder(selectedFolder) {
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
          Current world: {folder.replace(/[\\/]+$/, "").split(/[\\/]/).at(-3)}
        </p>
      )}

      <p>Loaded {stats.length} statistics</p>

      <table>
        <thead>
          <tr>
            <th>Player UUID</th>
            <th>Category</th>
            <th>Statistic</th>
            <th>Value</th>
          </tr>
        </thead>

        <tbody>
          {stats.map((stat) => (
            <tr
              key={`${stat.player_uuid}-${stat.category}-${stat.statistic}`}
            >
              <td>{stat.player_uuid}</td>
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