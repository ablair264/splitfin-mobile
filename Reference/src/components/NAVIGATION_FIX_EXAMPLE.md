// Example fix for SalesAgentOverviewView navigation
// Replace these onClick handlers in SalesAgentOverviewView.tsx:

// OLD (incorrect):
onClick={() => updateDashboardState({ activeView: 'orders' })}

// NEW (correct):
onClick={() => navigate('/dashboard/orders')}

// Similarly for invoices:
// OLD:
onClick={() => updateDashboardState({ activeView: 'invoices' })}

// NEW:
onClick={() => navigate('/dashboard/invoices')}

// The navigate function is already available from useOutletContext, 
// so no additional imports are needed.
