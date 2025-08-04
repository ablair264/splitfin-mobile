#Background

We are replicating a react web project 'Splitfin' into a React Native mobile app. We are being very careful to mirror the design, style and colour schemes of the reference files in /SplitMobile/Reference folder
'Splitfin' is broken up into two parts: 

Front-end (/Users/alastairblair/Desktop/SplitMobile/Rerence/src):

/layout - Main layout of Splitfin web with sidebar and container (Sidebar should only be replicated for iPad view in React Native project and should be collapsable)
/components 
- BrandManagerDashboard & SalesAgentDashboard both use the /components/shared components and /components/views components. It is imperative that we replicate the design exactly of the components in /components/shared/

This is a B2B mobile app that should utilise all of the following components in /src/components: 

- AgentManagement
- AllProducts
- CustomersManagement
- CustomerDetail
- AIInsightModal
- BrandSelector
- CatalogueBuilder
- CreateCustomer
- CustomerMapGoogle
- Dashboard
- InvoiceManagement
- Login (Has already been generated - needs to look identical but factored size for mobile)
- NewCustomer
- NewInvoice
- OrderConfirmation
- OrderSummary
- ProductCard
- ProductList
- ProductListItem
- ProgressBar
- ProgressLoader
- QuickViewModal
- Settings
- ViewInvoice
- ViewOrder
- ViewOrders

Any files in folders starting with Customer{x} can be ignored for now

The 'server' folder /Reference/server contains all of my current files for my backend render server

There are hooks and types in the /Reference/src folder that link to my server files

#Workflow
PLease test the build regularly for linter errors
Please ensure correct setup of Firebase 

#Production
This is for final production, so should use my actual firebase data NOT mock data anywhere
