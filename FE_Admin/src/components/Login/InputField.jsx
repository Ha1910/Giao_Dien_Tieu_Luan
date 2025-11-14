
import React from "react";

const InputField = ({
    label,
    type = "text",
    name,
    value,
    onChange,
    placeholder = "",
    required = false,
    autoFocus = false,
    className = "",
}) => {
    return (
        <div className={`mb-4 ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                autoFocus={autoFocus}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                   focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                   transition duration-200 outline-none"
            />
        </div>
    );
};

export default InputField;