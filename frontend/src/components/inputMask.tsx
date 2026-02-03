type CodeInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
};

export function CodeInput({ length = 6, value, onChange }: CodeInputProps) {
  const boxes = Array.from({ length });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyDigits = e.target.value.replace(/\D/g, "");
    const trimmed = onlyDigits.slice(0, length);
    onChange(trimmed);
  };

  return (
    <div className="relative w-fit mx-auto">
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        maxLength={length}
        autoFocus
        className="absolute inset-0 w-full h-full opacity-0 cursor-text"
      />

      <div className="flex gap-2">
        {boxes.map((_, index) => (
          <div
            key={index}
            className={`
              w-10 h-12 
              rounded-lg
              flex items-center justify-center
              text-2xl font-semibold
              transition-all duration-200
              ${value[index] 
                ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-white' 
                : 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-500'
              }
            `}
          >
            {value[index] || ""}
          </div>
        ))}
      </div>
    </div>
  );
}
