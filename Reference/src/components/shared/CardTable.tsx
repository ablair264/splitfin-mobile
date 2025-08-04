import React from 'react';
import styles from './CardTable.module.css';

interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string;
  width?: string;
}

interface CardTableProps {
  id: string;
  title: string;
  subtitle?: string;
  columns: TableColumn[];
  data: Array<any>;
  maxRows?: number;
  onRowClick?: (row: any) => void;
  onViewAll?: () => void;
  onOptionsClick?: () => void;
  showIndex?: boolean;
  highlightRows?: boolean;
}

const CardTable: React.FC<CardTableProps> = ({
  id,
  title,
  subtitle,
  columns,
  data,
  maxRows = 5,
  onRowClick,
  onViewAll,
  onOptionsClick,
  showIndex = false,
  highlightRows = false
}) => {
  const displayData = data.slice(0, maxRows);
  const hasMore = data.length > maxRows;

  const defaultFormat = (value: any) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      return new Intl.NumberFormat('en-GB').format(value);
    }
    return String(value);
  };

  return (
    <div className={styles.cardTableContainer}>
      <div className={styles.cardTableHeader}>
        <div className={styles.tableHeaderLeft}>
          <h3 className={styles.tableTitle}>{title}</h3>
          {subtitle && <p className={styles.tableSubtitle}>{subtitle}</p>}
        </div>
        <div className={styles.tableHeaderActions}>
          {hasMore && onViewAll && (
            <button className={styles.viewAllButton} onClick={onViewAll}>
              View All
            </button>
          )}
          {onOptionsClick && (
            <button className={styles.tableOptionsButton} onClick={onOptionsClick}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <circle cx="10" cy="4" r="1.5" />
                <circle cx="10" cy="10" r="1.5" />
                <circle cx="10" cy="16" r="1.5" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className={styles.cardTableContent}>
        <table className={styles.cardTable}>
          <thead>
            <tr>
              {showIndex && <th className={styles.indexColumn}>#</th>}
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{ textAlign: column.align || 'left', width: column.width }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, index) => (
              <tr
                key={`${id}-row-${index}`}
                onClick={() => onRowClick?.(row)}
                className={`${onRowClick ? styles.clickable : ''} ${highlightRows && index === 0 ? styles.highlighted : ''}`}
              >
                {showIndex && <td className={styles.indexColumn}>{index + 1}</td>}
                {columns.map((column) => (
                  <td
                    key={`${column.key}-${index}`}
                    style={{ textAlign: column.align || 'left' }}
                  >
                    {column.format 
                      ? column.format(row[column.key]) 
                      : defaultFormat(row[column.key])
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        {displayData.length === 0 && (
          <div className={styles.emptyState}>
            <p>No data available</p>
          </div>
        )}
      </div>
      
      {hasMore && (
        <div className={styles.cardTableFooter}>
          <span className={styles.moreItemsText}>
            +{data.length - maxRows} more items
          </span>
        </div>
      )}
    </div>
  );
};

export default CardTable;