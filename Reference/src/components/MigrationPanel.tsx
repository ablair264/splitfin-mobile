import React, { useState } from 'react';
import { CustomerMigration } from '../migrations/customerMigration';
import './MigrationPanel.css';

interface MigrationProgress {
  message: string;
  progress: number;
}

export default function MigrationPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [dryRunResult, setDryRunResult] = useState<{ customersNeedingUpdate: number; totalAssignedCustomers: number; salesAgentsToUpdate: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDryRun = async () => {
    setIsDryRunning(true);
    setError(null);
    setDryRunResult(null);
    
    try {
      const result = await CustomerMigration.dryRun();
      setDryRunResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dry run failed');
    } finally {
      setIsDryRunning(false);
    }
  };

  const handleRunMigration = async () => {
    if (!window.confirm('This will update your customer database. Are you sure you want to proceed?')) {
      return;
    }
    
    setIsRunning(true);
    setError(null);
    setSuccess(false);
    setProgress({ message: 'Starting customer migration...', progress: 0 });
    
    try {
      await CustomerMigration.runMigration((message, progressValue) => {
        setProgress({ message, progress: progressValue });
      });
      
      setSuccess(true);
      setProgress({ message: 'Customer migration completed successfully!', progress: 100 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Customer migration failed');
      setProgress(null);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="migration-panel">
      <div className="migration-header">
        <h2>Customer Database Migration</h2>
        <p>This migration will add missing date fields to assigned customers for improved data consistency.</p>
      </div>

      <div className="migration-content">
        {/* Dry Run Section */}
        <div className="migration-section">
          <h3>Step 1: Check Migration Status</h3>
          <p>Run a dry run to see what changes would be made without modifying any data.</p>
          
          <button 
            className="btn btn-secondary"
            onClick={handleDryRun}
            disabled={isDryRunning || isRunning}
          >
            {isDryRunning ? 'Checking...' : 'Run Dry Check'}
          </button>

          {dryRunResult && (
            <div className={`dry-run-result ${dryRunResult.customersNeedingUpdate === 0 ? 'up-to-date' : 'needs-update'}`}>
              {dryRunResult.customersNeedingUpdate === 0 ? (
                <>
                  <div className="result-icon">✅</div>
                  <h4>Database is up to date!</h4>
                  <p>All {dryRunResult.totalAssignedCustomers} assigned customers have the required fields.</p>
                </>
              ) : (
                <>
                  <div className="result-icon">⚠️</div>
                  <h4>Migration needed</h4>
                  <p>{dryRunResult.customersNeedingUpdate} out of {dryRunResult.totalAssignedCustomers} assigned customers need updating across {dryRunResult.salesAgentsToUpdate} sales agents.</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Migration Section */}
        {dryRunResult && dryRunResult.customersNeedingUpdate > 0 && (
          <div className="migration-section">
            <h3>Step 2: Run Migration</h3>
            <p>This will:</p>
            <ul>
              <li>Add missing last_order_date to {dryRunResult.customersNeedingUpdate} assigned customers</li>
              <li>Add missing created_date to assigned customers</li>
              <li>Update data across {dryRunResult.salesAgentsToUpdate} sales agents</li>
            </ul>

            <button 
              className="btn btn-primary"
              onClick={handleRunMigration}
              disabled={isRunning}
            >
              {isRunning ? 'Running Migration...' : 'Run Migration'}
            </button>
          </div>
        )}

        {/* Progress Section */}
        {progress && (
          <div className="migration-progress">
            <div className="progress-message">{progress.message}</div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
            <div className="progress-percentage">{progress.progress}%</div>
          </div>
        )}

        {/* Results Section */}
        {success && (
          <div className="migration-result success">
            <div className="result-icon">✅</div>
            <h4>Customer Migration Completed Successfully!</h4>
            <p>Your customer database has been updated with missing date fields.</p>
          </div>
        )}

        {error && (
          <div className="migration-result error">
            <div className="result-icon">❌</div>
            <h4>Customer Migration Failed</h4>
            <p>{error}</p>
            <p>Please check the console for more details.</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="migration-instructions">
        <h3>Important Notes:</h3>
        <ul>
          <li>Run this migration during off-peak hours for best performance</li>
          <li>The migration is safe to run multiple times - it will skip already updated customers</li>
          <li>Make sure you have proper Firestore permissions before running</li>
          <li>For large databases (10,000+ assigned customers), the migration may take several minutes</li>
          <li>This migration updates the assigned_customers subcollections for each sales agent</li>
        </ul>
      </div>
    </div>
  );
}