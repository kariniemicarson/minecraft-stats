# Initial Data Processing #

# imports
import json
import sqlite3
import sys
from pathlib import Path

# function for getting stats from a world
def extract_stats(stats_folder):
    stats_path = Path(stats_folder)

    # Verify the folder exists
    if not stats_path.is_dir():
        print("No statistic folders found.")
        return

    # Find all player statistics files
    files = list(stats_path.glob("*.json"))

    if not files:
        print("No JSON stat files found.")
        return

    # Connect to SQLite
    conn = sqlite3.connect("minecraft_stats.db")
    cursor = conn.cursor()

    # Create the table if it doesn't exist
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS player_stats (
            player_uuid TEXT,
            category TEXT,
            statistic TEXT,
            value INTEGER,
            PRIMARY KEY (player_uuid, category, statistic)
        )
    """)

    # Remove stats from prev world, try import new one
    try:
        cursor.execute("DELETE FROM player_stats")
        import_stats(stats_folder, cursor, conn)

    except Exception as e:
        conn.rollback()
        print(f"Import failed: {e}")
        raise

    finally:
        conn.close()

# function for moving stats from a world into the db
def import_stats(stats_folder, cursor, conn):

    stats_path = Path(stats_folder)
    
    # Find all player statistics files
    files = list(stats_path.glob("*.json"))
    
    # Import all players from the selected world
    for file in files:
        with open(file, encoding="utf-8") as f:
            data = json.load(f)
    
        player_uuid = file.stem
    
        for category, statistics in data.get("stats", {}).items():
            for statistic, value in statistics.items():
                cursor.execute("""
                    INSERT INTO player_stats
                    (player_uuid, category, statistic, value)
                    VALUES (?, ?, ?, ?)
                """, (player_uuid, category, statistic, value))
    
        print(f"Imported statistics for {player_uuid}")
    
    conn.commit()
    print("Database updated successfully!")

# main function
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python stats_extract.py <stats_folder>")
        sys.exit(1)

    extract_stats(sys.argv[1])