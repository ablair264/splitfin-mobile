import React, { useState } from 'react';
import { CustomerMigration } from '../migrations/customerMigration';
import './MigrationPanel.css';

interface MigrationProgress {
  message: string;
  progress: number;
}

export default function CustomerMigrationPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [dryRunResult, setDryRunResult] = useState<{ 
    customersNeedingUpdate: number; 
    totalAssignedCustomers: number;
    salesAgentsToUpdate: number;
  } | null>(null);
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
    if (!window.confirm('This will update assigned customers data. Are you sure you want to proceed?')) {
      return;
    }
    
    setIsRunning(true);
    setError(null);
    setSuccess(false);
    setProgress({ message: 'Starting migration...', progress: 0 });
    
    try {
      await CustomerMigration.runMigration((message, progressValue) => {
        setProgress({ message, progress: progressValue });
      });
      
      setSuccess(true);
      setProgress({ message: 'Migration completed successfully!', progress: 100 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Migration failed');
      setProgress(null);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="migration-panel">
      <div className="migration-header">
        <h2>Customer Data Migration</h2>
        <p>This migration will add last_order_date and created_date fields to assigned customers in sales agents' subcollections.</p>
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
                  <h4>All assigned customers are up to date!</h4>
                  <p>All {dryRunResult.totalAssignedCustomers} assigned customers have the required fields.</p>
                </>
              ) : (
                <>
                  <div className="result-icon">⚠️</div>
                  <h4>Migration needed</h4>
                  <p>{dryRunResult.customersNeedingUpdate} out of {dryRunResult.totalAssignedCustomers} assigned customers need updating.</p>
                  <p>This affects {dryRunResult.salesAgentsToUpdate} sales agents.</p>
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
              <li>Add last_order_date field to {dryRunResult.customersNeedingUpdate} assigned customers</li>
              <li>Add created_date field to assigned customers</li>
              <li>Fetch data from main customers collection and orders</li>
              <li>Update {dryRunResult.salesAgentsToUpdate} sales agents' subcollections</li>
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
            <h4>Migration Completed Successfully!</h4>
            <p>The assigned customers data has been updated with last_order_date and created_date fields.</p>
          </div>
        )}

        {error && (
          <div className="migration-result error">
            <div className="result-icon">❌</div>
            <h4>Migration Failed</h4>
            <p>{error}</p>
            <p>Please check the console for more details.</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="migration-instructions">
        <h3>Important Notes:</h3>
        <ul>
          <li>This migration updates the assigned_customers subcollection for each sales agent</li>
          <li>It fetches data from the main customers collection and orders to populate missing fields</li>
          <li>The migration is safe to run multiple times - it will skip already updated records</li>
          <li>Make sure you have proper Firestore permissions before running</li>
          <li>For large databases, the migration may take several minutes</li>
        </ul>
      </div>
    </div>
  );
}