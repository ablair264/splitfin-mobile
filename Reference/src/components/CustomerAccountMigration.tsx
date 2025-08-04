import React, { useState } from 'react';
import { collection, doc, setDoc, getDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { FaSync, FaCheckCircle, FaExclamationTriangle, FaDownload, FaTrashAlt, FaSpinner } from 'react-icons/fa';
import styles from './CustomerAccountMigration.module.css';

interface MigrationResult {
  customer: string;
  customerId: string;
  email: string;
  uid?: string;
  status: 'success' | 'failed' | 'skipped';
  message: string;
}

export default function CustomerAccountMigration() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentCustomer, setCurrentCustomer] = useState('');
  const [results, setResults] = useState<MigrationResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [sendEmails, setSendEmails] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('https://splitfin-zoho-api.onrender.com'); // Your Render server URL

  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const runMigration = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);
    setShowResults(false);

    const processedEmails = new Set<string>();
    const migrationResults: MigrationResult[] = [];

    try {
      // Get all customers
      const customersSnapshot = await getDocs(collection(db, 'customers'));
      const totalCustomers = customersSnapshot.size;
      let processedCount = 0;

      for (const customerDoc of customersSnapshot.docs) {
        const customerData = customerDoc.data();
        const customerId = customerDoc.id;

        setCurrentCustomer(customerData.customer_name);

        // Determine the primary email for this customer
        let primaryEmail = '';
        let primaryContactName = '';
        
        // First, try to use the customer's main email
        if (customerData.email && typeof customerData.email === 'string' && customerData.email.trim() !== '') {
          primaryEmail = customerData.email;
          primaryContactName = customerData.customer_name || customerData.company_name || 'Customer';
        } 
        // Otherwise, look for a primary contact or the first contact with an email
        else if (customerData.contacts && Array.isArray(customerData.contacts) && customerData.contacts.length > 0) {
          // Find primary contact or first contact with email
          const primaryContact = customerData.contacts.find((c: any) => c.is_primary === true) || 
                               customerData.contacts.find((c: any) => c.email && c.email.trim() !== '');
          
          if (primaryContact && primaryContact.email) {
            primaryEmail = primaryContact.email;
            const firstName = primaryContact.first_name || '';
            const lastName = primaryContact.last_name || '';
            primaryContactName = [firstName, lastName].filter(n => n).join(' ').trim() || 
                               customerData.customer_name || 
                               'Customer';
          }
        }

        // Skip if no email found
        if (!primaryEmail) {
          console.warn(`Skipping customer ${customerData.customer_name} (${customerId}) - no email found`);
          migrationResults.push({
            customer: customerData.customer_name,
            customerId: customerId,
            email: 'No email',
            status: 'skipped',
            message: 'No email address found for customer'
          });
          processedCount++;
          setProgress((processedCount / totalCustomers) * 100);
          continue;
        }

        // Skip if email already processed
        if (processedEmails.has(primaryEmail.toLowerCase())) {
          console.warn(`Skipping customer ${customerData.customer_name} - duplicate email ${primaryEmail}`);
          migrationResults.push({
            customer: customerData.customer_name,
            customerId: customerId,
            email: primaryEmail,
            status: 'skipped',
            message: 'Email already processed for another customer'
          });
          processedCount++;
          setProgress((processedCount / totalCustomers) * 100);
          continue;
        }

        // Create or update users document
        const userDocRef = doc(db, 'users', customerId);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          const userData: any = {
            customer_id: customerId,
            customer_name: customerData.customer_name,
            email: primaryEmail,
            created_at: serverTimestamp(),
            migrated: true
          };

          // Add optional fields only if they exist
          if (customerData.company_name !== undefined && customerData.company_name !== null) {
            userData.company_name = customerData.company_name;
          }
          if (customerData.address !== undefined && customerData.address !== null) {
            userData.address = customerData.address;
          }
          if (customerData.invoice_count !== undefined && customerData.invoice_count !== null) {
            userData.invoice_count = customerData.invoice_count;
          }
          if (customerData.order_count !== undefined && customerData.order_count !== null) {
            userData.order_count = customerData.order_count;
          }

          try {
            await setDoc(userDocRef, userData);
            console.log(`Created users document for ${customerId}`);
          } catch (error) {
            console.error(`Error creating users document for ${customerId}:`, error);
          }
        }

        // Create Firebase Auth user via server
        try {
          const password = generatePassword();

          const serverResponse = await fetch(`${apiEndpoint}/migrate-single-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Add your admin token here in production
              // 'Authorization': `Bearer ${yourAdminToken}`
            },
            body: JSON.stringify({
              email: primaryEmail,
              password: password,
              customerId: customerId,
              contactName: primaryContactName,
              customerName: customerData.customer_name || '',
              companyName: customerData.company_name || '',
              sendEmail: sendEmails
            }),
          });

          if (!serverResponse.ok) {
            const errorData = await serverResponse.json();
            throw new Error(errorData.message || `Server error: ${serverResponse.status}`);
          }

          const responseData = await serverResponse.json();
          const firebaseUserUid = responseData.uid;

          // Update customer document with firebase_uid
          const customerDocRef = doc(db, 'customers', customerId);
          await setDoc(customerDocRef, {
            firebase_uid: firebaseUserUid,
            auth_email: primaryEmail
          }, { merge: true });

          processedEmails.add(primaryEmail.toLowerCase());

          migrationResults.push({
            customer: customerData.customer_name,
            customerId: customerId,
            email: primaryEmail,
            uid: firebaseUserUid,
            status: 'success',
            message: sendEmails
              ? 'Account created, password reset email sent'
              : `Account created with password: ${password}`
          });

        } catch (error: any) {
          console.error(`Error creating auth for ${primaryEmail}:`, error);
          migrationResults.push({
            customer: customerData.customer_name,
            customerId: customerId,
            email: primaryEmail,
            status: 'failed',
            message: error.message || 'Unknown error'
          });
        }

        processedCount++;
        setProgress((processedCount / totalCustomers) * 100);
      }

      setResults(migrationResults);
      setShowResults(true);

    } catch (error) {
      console.error('Migration failed:', error);
      alert('Migration failed. Check console for details.');
    } finally {
      setIsRunning(false);
      setCurrentCustomer('');
    }
  };

  const deleteUsersCreatedYesterday = async () => {
    if (!window.confirm("Are you sure you want to delete ALL Firebase Auth users AND their Firestore documents created YESTERDAY? This action is irreversible.")) {
      return;
    }

    setIsDeleting(true);
    setDeleteMessage('Initiating server-side deletion of users created yesterday...');

    try {
      const serverResponse = await fetch(`${apiEndpoint}/delete-yesterday-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add your admin token here in production
          // 'Authorization': `Bearer ${yourAdminToken}`
        }
      });

      if (!serverResponse.ok) {
        const errorData = await serverResponse.json();
        throw new Error(errorData.message || `Server error: ${serverResponse.status}`);
      }

      const responseData = await serverResponse.json();
      setDeleteMessage(responseData.message || `Deletion completed: ${responseData.deletedCount} users deleted.`);
      console.log('Deletion response:', responseData);

    } catch (error: any) {
      console.error('Error during deletion:', error);
      setDeleteMessage(`Deletion failed: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const downloadResults = () => {
    const dataStr = JSON.stringify(results, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `migration_results_${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;

  return (
    <div className={styles.migrationContainer}>
      <div className={styles.header}>
        <h2>Customer Account Migration</h2>
        <p>Create ONE Firebase Auth account per customer</p>
      </div>

      {!isRunning && !showResults && (
        <div className={styles.startSection}>
          <div className={styles.apiConfig}>
            <label htmlFor="apiEndpoint">Server API Endpoint:</label>
            <input
              type="text"
              id="apiEndpoint"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              placeholder="e.g., http://localhost:3001"
              className={styles.apiInput}
            />
          </div>

          <div className={styles.warning}>
            <FaExclamationTriangle />
            <div>
              <h4>Important Notes:</h4>
              <ul>
                <li>Creates <strong>ONE login per customer</strong> (not per contact)</li>
                <li>Uses customer email first, then primary contact email</li>
                <li>Temporary passwords will be generated</li>
                <li>Existing accounts will be skipped</li>
                <li>Updates customer document with firebase_uid and auth_email</li>
              </ul>
            </div>
          </div>

          <div className={styles.emailOption}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={sendEmails}
                onChange={(e) => setSendEmails(e.target.checked)}
                className={styles.checkbox}
              />
              <span>Send password reset emails</span>
            </label>
            <p className={styles.emailNote}>
              {sendEmails
                ? 'Customers will receive an email to set their password'
                : 'Temporary passwords will be shown in results'}
            </p>
          </div>

          <button onClick={runMigration} className={styles.startButton}>
            <FaSync /> Start Migration
          </button>

          <div className={styles.deleteSection}>
            <div className={styles.warning}>
              <FaExclamationTriangle />
              <div>
                <h4>Delete Yesterday's Users</h4>
                <p>Delete all users created <strong>yesterday</strong> (Auth + Firestore)</p>
              </div>
            </div>
            <button
              onClick={deleteUsersCreatedYesterday}
              className={styles.deleteButton}
              disabled={isDeleting}
            >
              {isDeleting ? <FaSpinner className={styles.spinner} /> : <FaTrashAlt />}
              {isDeleting ? 'Deleting...' : 'Delete Yesterday\'s Users'}
            </button>
            {deleteMessage && <p className={styles.deleteMessage}>{deleteMessage}</p>}
          </div>
        </div>
      )}

      {isRunning && (
        <div className={styles.progressSection}>
          <h3>Migration in Progress...</h3>
          <p>Processing: {currentCustomer}</p>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p>{Math.round(progress)}% Complete</p>
        </div>
      )}

      {showResults && (
        <div className={styles.resultsSection}>
          <h3>Migration Complete</h3>

          <div className={styles.summary}>
            <div className={styles.summaryCard}>
              <FaCheckCircle className={styles.successIcon} />
              <div className={styles.summaryCount}>{successCount}</div>
              <div className={styles.summaryLabel}>Successful</div>
            </div>

            <div className={styles.summaryCard}>
              <FaExclamationTriangle className={styles.warningIcon} />
              <div className={styles.summaryCount}>{failedCount}</div>
              <div className={styles.summaryLabel}>Failed</div>
            </div>

            <div className={styles.summaryCard}>
              <FaSync className={styles.skipIcon} />
              <div className={styles.summaryCount}>{skippedCount}</div>
              <div className={styles.summaryLabel}>Skipped</div>
            </div>
          </div>

          <div className={styles.resultsList}>
            <h4>Detailed Results:</h4>
            <div className={styles.resultsTable}>
              <div className={styles.tableHeader}>
                <div>Customer</div>
                <div>Email</div>
                <div>Status</div>
                <div>Message</div>
              </div>
              {results.map((result, index) => (
                <div key={index} className={`${styles.tableRow} ${styles[result.status]}`}>
                  <div>{result.customer}</div>
                  <div>{result.email}</div>
                  <div>
                    <span className={styles.statusBadge}>{result.status}</span>
                  </div>
                  <div>{result.message}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.actions}>
            <button onClick={downloadResults} className={styles.downloadButton}>
              <FaDownload /> Download Results
            </button>
            <button onClick={() => setShowResults(false)} className={styles.resetButton}>
              Run Another Migration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}