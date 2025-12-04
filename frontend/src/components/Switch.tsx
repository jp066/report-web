import React from "react";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  id?: string;
}

export default function Switch({ checked, onChange, label, description, id }: SwitchProps) {
  return (
    <label htmlFor={id} className="flex items-center mb-2 cursor-pointer select-none">
      <div className="relative w-11 h-6">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`}
        ></div>
        <span
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`}
          style={{ willChange: 'transform' }}
        ></span>
      </div>
      {label && (
        <span className="ml-3 text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</span>
      )}
      {description && (
        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{description}</span>
      )}
    </label>
  );
}
