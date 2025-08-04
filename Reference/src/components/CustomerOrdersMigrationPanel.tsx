import React, { useState } from 'react';
import { ProgressLoader } from './ProgressLoader';
import { CustomerOrdersMigration } from '../migrations/customerOrdersMigration';
import './MigrationPanel.css';

export default function CustomerOrdersMigrationPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [dryRunResults, setDryRunResults] = useState<{
    customersToUpdate: number;
    totalCustomers: number;
    ordersToMigrate: number;
  } | null>(null);
  const [error, setError] = useState('');

  const handleDryRun = async () => {
    try {
      setError('');
      setMessage('Running dry run...');
      setIsRunning(true);
      
      const results = await CustomerOrdersMigration.dryRun();
      setDryRunResults(results);
      setMessage(`Dry run complete! Found ${results.customersToUpdate} customers needing updates with ${results.ordersToMigrate} orders to migrate.`);
    } catch (error) {
      console.error('Dry run failed:', error);
      setError(error instanceof Error ? error.message : 'Dry run failed');
    } finally {
      setIsRunning(false);
    }
  };

  const handleMigration = async () => {
    try {
      setError('');
      setIsRunning(true);
      setProgress(0);
      
      await CustomerOrdersMigration.runMigration((message, progress) => {
        setMessage(message);
        setProgress(progress);
      });
      
      // Reset dry run results after successful migration
      setDryRunResults(null);
    } catch (error) {
      console.error('Migration failed:', error);
      setError(error instanceof Error ? error.message : 'Migration failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="migration-panel">
      <div className="migration-header">
        <h3>Customer Orders Migration</h3>
        <p className="migration-description">
          This migration will create a customers_orders subcollection for each customer 
          and populate it with their orders. It will also update customer metrics including 
          order count, total spent, and payment performance.
        </p>
      </div>

      {error && (
        <div className="migration-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {!dryRunResults && !isRunning && (
        <div className="migration-actions">
          <button 
            className="btn btn-secondary" 
            onClick={handleDryRun}
            disabled={isRunning}
          >
            Run Dry Check
          </button>
          <p className="migration-info">
            Run a dry check first to see how many customers and orders need to be migrated.
          </p>
        </div>
      )}

      {dryRunResults && !isRunning && progress === 0 && (
        <div className="dry-run-results">
          <h4>Dry Run Results</h4>
          <div className="results-grid">
            <div className="result-item">
              <span className="result-label">Total Customers:</span>
              <span className="result-value">{dryRunResults.totalCustomers}</span>
            </div>
            <div className="result-item">
              <span className="result-label">Customers to Update:</span>
              <span className="result-value highlight">{dryRunResults.customersToUpdate}</span>
            </div>
            <div className="result-item">
              <span className="result-label">Orders to Migrate:</span>
              <span className="result-value highlight">{dryRunResults.ordersToMigrate}</span>
            </div>
          </div>
          
          {dryRunResults.customersToUpdate > 0 && (
            <div className="migration-actions">
              <button 
                className="btn btn-primary" 
                onClick={handleMigration}
              >
                Start Migration
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={handleDryRun}
              >
                Re-run Dry Check
              </button>
            </div>
          )}
          
          {dryRunResults.customersToUpdate === 0 && (
            <div className="migration-complete">
              <span className="success-icon">✓</span>
              <p>All customers are already up to date!</p>
            </div>
          )}
        </div>
      )}

      {isRunning && (
        <div className="migration-progress">
          <ProgressLoader
            progress={progress}
            messages={[
              'Fetching customers...',
              'Processing orders...',
              'Updating customer metrics...',
              'Creating subcollections...',
              'Finalizing migration...'
            ]}
          />
          <p className="progress-message">{message}</p>
        </div>
      )}

      {progress === 100 && !isRunning && (
        <div className="migration-complete">
          <span className="success-icon">✓</span>
          <p>{message}</p>
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              setProgress(0);
              setMessage('');
              setDryRunResults(null);
            }}
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
