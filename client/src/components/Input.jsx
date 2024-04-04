import React from "react";

export default function Input({
  label = "",
  name = "",
  type = "",
  className = "",
  boxClass = "",
  isRequired = true,
  value = "",
  placeholder = "",
  onChange = () => {},
}) {
  return (
    <>
      <div className={`w-[100%] ${boxClass}`}>
        <label
          htmlFor={name}
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300"
        >
          {label}
        </label>

        <input
          type={type}
          id={name}
          className={`bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-700 block w-full p-2.5 dark:focus:ring-blue-500 dark:focus:border-blue-700 outline-none ${className}`}
          placeholder={placeholder}
          required={isRequired}
          value={value}
          onChange={onChange}
        />
      </div>
    </>
  );
}
