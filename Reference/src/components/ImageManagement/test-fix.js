// Test file to verify the ImageManagement fix
// Run this from the browser console to check the issue is resolved

console.log('=== ImageManagement Fix Test ===');

// 1. Check if fetchImages is being called multiple times
let fetchCount = 0;
const originalFetch = window.fetch;
window.fetch = function(...args) {
  if (args[0].includes('/api/imagekit/images')) {
    fetchCount++;
    console.log(`Fetch #${fetchCount} to ImageKit API:`, args[0]);
    if (fetchCount > 2) {
      console.error('❌ Too many requests! Infinite loop detected.');
    }
  }
  return originalFetch.apply(this, args);
};

// 2. Monitor for rate limiting (429 errors)
window.addEventListener('unhandledrejection', event => {
  if (event.reason?.message?.includes('429')) {
    console.error('❌ Rate limited! 429 error detected:', event.reason);
  }
});

// 3. Reset after 10 seconds
setTimeout(() => {
  window.fetch = originalFetch;
  console.log(`✅ Test complete. Total ImageKit requests: ${fetchCount}`);
  if (fetchCount <= 2) {
    console.log('✅ No infinite loop detected!');
  }
}, 10000);

console.log('Monitoring for 10 seconds...');
