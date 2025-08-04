import React from 'react';
import styles from './Pagination.module.css';

interface PaginationProps {
  imagesPerPage: number;
  totalImages: number;
  currentPage: number;
  paginate: (pageNumber: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ imagesPerPage, totalImages, currentPage, paginate }) => {
  const pageNumbers = [];
  const totalPages = Math.ceil(totalImages / imagesPerPage);

  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  if (totalPages <= 1) {
    return null; // Don't render pagination if there's only one page
  }

  return (
    <nav>
      <ul className={styles.pagination}>
        <li>
          <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className={styles.pageLink}>
            &laquo; Prev
          </button>
        </li>
        {pageNumbers.map(number => (
          <li key={number} className={styles.pageItem}>
            <button
              onClick={() => paginate(number)}
              className={`${styles.pageLink} ${currentPage === number ? styles.active : ''}`}
            >
              {number}
            </button>
          </li>
        ))}
        <li>
          <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className={styles.pageLink}>
            Next &raquo;
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;