# View Components Fix Pattern

All view components should follow this pattern to fix the TypeScript errors:

## Before (incorrect):
```typescript
interface ViewProps {
  data: any;
  // ... other props
}

const SomeView: React.FC<ViewProps> = ({ data, ...otherProps }) => {
  // component code
};
```

## After (correct):
```typescript
import { useOutletContext } from 'react-router-dom';

interface ViewProps {
  data: any;
  // ... other props
  getMetricCardColor: (index?: number) => string;
}

const SomeView: React.FC = () => {
  const { data, ...otherProps } = useOutletContext<ViewProps>();
  // component code
};
```

## Views that need updating:
1. ✅ OrdersView.tsx - Fixed
2. ❌ RevenueView.tsx - Needs fix
3. ❌ InvoicesView.tsx - Needs fix
4. ❌ BrandsView.tsx - Needs fix
5. ❌ ForecastingView.tsx - Needs fix

## Quick fix for each:

### RevenueView.tsx:
- Remove props from function signature
- Add `useOutletContext` import
- Use `const { ...props } = useOutletContext<RevenueViewProps>()`
- Add `getMetricCardColor` to interface

### InvoicesView.tsx:
- Remove props from function signature
- Add `useOutletContext` import
- Use `const { ...props } = useOutletContext<InvoicesViewProps>()`
- Add `getMetricCardColor` to interface

### BrandsView.tsx:
- Remove props from function signature
- Add `useOutletContext` import
- Use `const { ...props } = useOutletContext<BrandsViewProps>()`

### ForecastingView.tsx:
- Remove props from function signature
- Add `useOutletContext` import
- Use `const { ...props } = useOutletContext<ForecastingViewProps>()`
