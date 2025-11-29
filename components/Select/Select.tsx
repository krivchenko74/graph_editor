"use client";

import { useState, useRef, useEffect } from "react";
import { BsChevronDown } from "react-icons/bs";
import Portal from "../Portal/Portal";
import styles from "./Select.module.css";

type Option = { value: string; label: string };

type Props = {
  options: Option[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
};

export default function Select({
  options,
  onChange,
  value,
  placeholder = "Выберите...",
}: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentLabel =
    options.find((o) => o.value === value)?.label || placeholder;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        dropdownRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        !dropdownRef.current.contains(e.target as Node) // ← проверяем дропдаун!
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.wrapper}>
      <div
        ref={triggerRef}
        className={`${styles.trigger} ${open ? styles.open : ""}`}
        onClick={() => setOpen(!open)}
      >
        <span className={styles.label}>{currentLabel}</span>
        <BsChevronDown className={styles.arrow} />
      </div>

      {open && (
        <Portal>
          <div
            ref={dropdownRef}
            className={styles.dropdown}
            style={{
              position: "fixed",
              top: triggerRef.current
                ? triggerRef.current.getBoundingClientRect().bottom + 4
                : 0,
              left: triggerRef.current
                ? triggerRef.current.getBoundingClientRect().left
                : 0,
              width: "fit-content",
            }}
          >
            {options.map((opt) => (
              <div
                key={opt.value}
                className={styles.option}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </Portal>
      )}
    </div>
  );
}
