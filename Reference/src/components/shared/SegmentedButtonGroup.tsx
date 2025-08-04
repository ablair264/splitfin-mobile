import React from 'react';
import styles from './SegmentedButtonGroup.module.css';

interface SegmentedButtonGroupProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  size?: 'small' | 'medium';
}

const SegmentedButtonGroup: React.FC<SegmentedButtonGroupProps> = ({
  value,
  options,
  onChange,
  size = 'small'
}) => (
  <div className={`${styles.segmentedGroup} ${size === 'small' ? styles.small : ''}`}>
    {options.map(opt => (
      <button
        key={opt.value}
        className={`${styles.segmentedBtn} ${value === opt.value ? styles.active : ''}`}
        onClick={e => {
          e.stopPropagation();
          onChange(opt.value);
        }}
        type="button"
        aria-label={opt.label}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export default SegmentedButtonGroup;