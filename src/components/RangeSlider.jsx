import { useState } from 'react';
import styles from './RangeSlider.module.css'; // Or keep it in your main module file

export default function RangeSlider({ min = 1, max = 10, initialValue = 5, label, onSubmit }) {
  const [value, setValue] = useState(initialValue);

  return (
    <div className={styles.sliderWrapper}>
      {label && (
        <div className={styles.sliderLabel}>
          {label}: <strong>{value}</strong> / {max}
        </div>
      )}
      <div className={styles.sliderContainer}>
        <span className={styles.rangeLimit}>{min}</span>
        <input 
          type="range" 
          min={min} 
          max={max} 
          value={value} 
          onChange={(e) => setValue(e.target.value)}
          className={styles.cleanSlider}
        />
        <span className={styles.rangeLimit}>{max}</span>
      </div>
      <button 
        className={styles.sliderSubmitBtn}
        onClick={() => onSubmit(value.toString())}
      >
        Confirm Rating ✓
      </button>
    </div>
  );
}