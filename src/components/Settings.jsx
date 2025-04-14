import { useState } from 'react';

const Settings = ({ darkMode, toggleDarkMode, exportData, importData, saveToLocalStorage, loadFromLocalStorage }) => {
  const [statusMessage, setStatusMessage] = useState("");
  const [exportedData, setExportedData] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);

  const handleExport = () => {
    try {
      const data = exportData();
      const jsonStr = JSON.stringify(data, null, 2);
      setExportedData(jsonStr);
      setShowExportModal(true);
      setStatusMessage("Data ready for export");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      console.error('Export preparation failed:', error);
      setStatusMessage("Export failed");
      setTimeout(() => setStatusMessage(""), 3000);
    }
  };

  const handleImport = (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          importData(data);
          setStatusMessage("Data imported successfully");
          setTimeout(() => setStatusMessage(""), 3000);
        } catch (error) {
          console.error('Failed to parse import file:', error);
          setStatusMessage("Failed to parse import file");
          setTimeout(() => setStatusMessage(""), 3000);
        }
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Import failed:', error);
      setStatusMessage("Import failed");
      setTimeout(() => setStatusMessage(""), 3000);
    }
  };

  const downloadViaBlob = () => {
    try {
      const blob = new Blob([exportedData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `todo-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      // Some browsers need the element to be in the DOM
      a.style.display = 'none';
      document.body.appendChild(a);
      
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      setStatusMessage("Download initiated");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      console.error('Download via blob failed:', error);
      setStatusMessage("Download failed - use copy method instead");
      setTimeout(() => setStatusMessage(""), 3000);
    }
  };

  const handleManualSave = () => {
    const saved = saveToLocalStorage();
    if (saved) {
      setStatusMessage("Data saved to local storage");
      setTimeout(() => setStatusMessage(""), 3000);
    }
  };

  const handleManualLoad = () => {
    const loaded = loadFromLocalStorage();
    if (loaded) {
      setStatusMessage("Data loaded from local storage");
    } else {
      setStatusMessage("No data found in local storage");
    }
    setTimeout(() => setStatusMessage(""), 3000);
  };

  return (
    <div className="settings">
      {statusMessage && (
        <div className="status-message">{statusMessage}</div>
      )}
      
      <section className="settings-section">
        <h2>Appearance</h2>
        <div className="settings-card">
          <h3>Dark Mode</h3>
          <p className="settings-description">
            Toggle between light and dark mode for your preferred viewing experience.
          </p>
          <div className="settings-control">
            <label className="dark-mode-toggle">
              <input 
                type="checkbox" 
                checked={darkMode}
                onChange={toggleDarkMode}
              />
              <span className="slider"></span>
              <span className="toggle-label">{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
            </label>
          </div>
        </div>
      </section>
      
      <section className="settings-section">
        <h2>Data Management</h2>
        
        <div className="settings-card">
          <h3>Local Storage</h3>
          <p className="settings-description">
            Your data is automatically saved in your browser's local storage. 
            This means it will persist when you close the browser, but only on this device.
          </p>
          <div className="settings-actions">
            <button 
              onClick={handleManualSave}
              className="settings-button primary"
            >
              Save manually
            </button>
            <button 
              onClick={handleManualLoad}
              className="settings-button secondary"
            >
              Load from storage
            </button>
          </div>
        </div>
        
        <div className="settings-card">
          <h3>Portable Backup</h3>
          <p className="settings-description">
            Export your data as a JSON file that can be backed up or transferred to another device.
          </p>
          <div className="settings-actions">
            <button 
              onClick={handleExport}
              className="settings-button primary"
            >
              Export data
            </button>
            
            <label className="settings-button secondary file-input-label">
              Import data
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="file-input"
              />
            </label>
          </div>
        </div>
      </section>

      {/* Export data modal */}
      {showExportModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>Export Data</h3>
            <p className="settings-description">
              Copy the JSON data below or download directly:
            </p>
            
            <div className="modal-actions">
              <button 
                onClick={downloadViaBlob} 
                className="settings-button primary"
              >
                Download as file
              </button>
              
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(exportedData)
                    .then(() => {
                      setStatusMessage("Data copied to clipboard");
                      setTimeout(() => setStatusMessage(""), 3000);
                    })
                    .catch(err => {
                      console.error("Failed to copy: ", err);
                      setStatusMessage("Failed to copy to clipboard");
                      setTimeout(() => setStatusMessage(""), 3000);
                    });
                }}
                className="settings-button secondary"
              >
                Copy to clipboard
              </button>
              
              <button 
                onClick={() => setShowExportModal(false)}
                className="settings-button"
              >
                Close
              </button>
            </div>
            
            <div className="export-data-container">
              <pre>{exportedData}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;