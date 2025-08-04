// migrateCustomerAccounts.js
// Script to create Firebase Auth accounts for existing customer contacts
// and set up the users/user_accounts structure

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

// Helper function to generate a random password
function generatePassword() {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Helper function to create a safe email-based username
function createUsername(email) {
  return email.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

async function migrateCustomerAccounts() {
  console.log('Starting customer account migration...');
  
  const processedEmails = new Set();
  const migrationResults = {
    successful: [],
    failed: [],
    skipped: []
  };

  try {
    // Get all customers
    const customersSnapshot = await db.collection('customers').get();
    console.log(`Found ${customersSnapshot.size} customers to process`);

    for (const customerDoc of customersSnapshot.docs) {
      const customerData = customerDoc.data();
      const customerId = customerDoc.id;
      
      console.log(`\nProcessing customer: ${customerData.customer_name} (${customerId})`);
      
      // Skip if no contacts
      if (!customerData.contacts || !Array.isArray(customerData.contacts)) {
        console.log('  No contacts found, skipping...');
        continue;
      }

      // First, check if a users document already exists for this customer
      let userDocRef = db.collection('users').doc(customerId);
      let userDoc = await userDocRef.get();
      
      if (!userDoc.exists) {
        // Create the main user document with company info
        const userData = {
          customer_id: customerId,
          customer_name: customerData.customer_name,
          company_name: customerData.company_name || customerData.customer_name,
          email: customerData.email || customerData.contacts[0]?.email,
          address: customerData.address || {},
          invoice_count: customerData.invoice_count || 0,
          order_count: customerData.order_count || 0,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          migrated: true
        };
        
        await userDocRef.set(userData);
        console.log(`  Created users document for ${customerData.customer_name}`);
      }

      // Process each contact
      for (const contact of customerData.contacts) {
        if (!contact.email) {
          console.log(`  Skipping contact without email: ${contact.contact_name}`);
          continue;
        }

        // Skip if we've already processed this email
        if (processedEmails.has(contact.email.toLowerCase())) {
          console.log(`  Email already processed: ${contact.email}`);
          migrationResults.skipped.push({
            customer: customerData.customer_name,
            contact: contact.contact_name,
            email: contact.email,
            reason: 'Duplicate email'
          });
          continue;
        }

        try {
          let firebaseUser;
          let isNewUser = false;
          
          // Check if Firebase Auth user already exists
          try {
            firebaseUser = await auth.getUserByEmail(contact.email);
            console.log(`  Firebase user already exists for ${contact.email}`);
          } catch (error) {
            if (error.code === 'auth/user-not-found') {
              // Create new Firebase Auth user
              const password = generatePassword();
              
              firebaseUser = await auth.createUser({
                email: contact.email,
                password: password,
                displayName: contact.contact_name || customerData.customer_name,
                emailVerified: false
              });
              
              isNewUser = true;
              console.log(`  Created Firebase auth user for ${contact.email}`);
              
              // Store password temporarily (you should send this via email instead)
              migrationResults.successful.push({
                customer: customerData.customer_name,
                customerId: customerId,
                contact: contact.contact_name,
                email: contact.email,
                uid: firebaseUser.uid,
                temporaryPassword: password,
                isNewUser: true
              });
            } else {
              throw error;
            }
          }

          // Create or update user_accounts subcollection document
          const userAccountRef = db.collection('users')
            .doc(customerId)
            .collection('user_accounts')
            .doc(firebaseUser.uid);

          const userAccountData = {
            email: contact.email,
            customer_id: customerId,
            contact_name: contact.contact_name,
            mobile: contact.mobile || '',
            primary: contact.primary || false,
            active: true,
            firebase_uid: firebaseUser.uid,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            migrated: true
          };

          await userAccountRef.set(userAccountData, { merge: true });
          console.log(`  Created/updated user_accounts document for ${contact.email}`);

          // Also create/update a record in the customer_data collection for backwards compatibility
          const customerDataRef = db.collection('customer_data').doc(firebaseUser.uid);
          await customerDataRef.set({
            firebaseUID: firebaseUser.uid,
            firebase_uid: firebaseUser.uid,
            customer_id: customerId,
            email: contact.email,
            contact_name: contact.contact_name,
            contactName: contact.contact_name,
            company_name: customerData.company_name,
            companyName: customerData.company_name,
            lastLogin: null,
            isOnline: false,
            created_at: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          processedEmails.add(contact.email.toLowerCase());
          
          if (!isNewUser) {
            migrationResults.successful.push({
              customer: customerData.customer_name,
              customerId: customerId,
              contact: contact.contact_name,
              email: contact.email,
              uid: firebaseUser.uid,
              isNewUser: false
            });
          }

        } catch (error) {
          console.error(`  Error processing contact ${contact.email}:`, error.message);
          migrationResults.failed.push({
            customer: customerData.customer_name,
            contact: contact.contact_name,
            email: contact.email,
            error: error.message
          });
        }
      }
    }

    // Generate report
    console.log('\n\n=== MIGRATION REPORT ===');
    console.log(`Total customers processed: ${customersSnapshot.size}`);
    console.log(`Successful migrations: ${migrationResults.successful.length}`);
    console.log(`Failed migrations: ${migrationResults.failed.length}`);
    console.log(`Skipped (duplicates): ${migrationResults.skipped.length}`);

    // Write detailed results to file
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFilename = `migration_report_${timestamp}.json`;
    
    fs.writeFileSync(reportFilename, JSON.stringify(migrationResults, null, 2));
    console.log(`\nDetailed report saved to: ${reportFilename}`);

    // Save passwords to secure file
    if (migrationResults.successful.some(r => r.isNewUser)) {
      savePasswordsToFile(migrationResults);
      
      console.log('\n=== NEW USER ACCOUNTS CREATED ===');
      console.log(`Created ${migrationResults.successful.filter(r => r.isNewUser).length} new accounts`);
      console.log('\nPasswords have been saved to a CSV file.');
      console.log('Please distribute these passwords securely to customers.');
    }

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Helper function to securely store passwords for distribution
function savePasswordsToFile(results) {
  const fs = require('fs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const passwordFile = `customer_passwords_${timestamp}.csv`;
  
  // Create CSV with passwords
  let csvContent = 'Customer,Contact Name,Email,Temporary Password\n';
  
  results.successful
    .filter(result => result.isNewUser && result.temporaryPassword)
    .forEach(result => {
      csvContent += `"${result.customer}","${result.contact}","${result.email}","${result.temporaryPassword}"\n`;
    });
  
  fs.writeFileSync(passwordFile, csvContent);
  console.log(`\nPasswords saved to: ${passwordFile}`);
  console.log('IMPORTANT: This file contains sensitive passwords. Share securely and delete after distribution.');
}

// Run the migration
migrateCustomerAccounts()
  .then(() => {
    console.log('\nMigration completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration error:', error);
    process.exit(1);
  });
