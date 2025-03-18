export const RadioCard = ({ id, value, checked, onChange, label, icon }) => (
  <label 
    htmlFor={id}
    className={`
      relative block w-full p-4 mb-2 cursor-pointer rounded-lg border-2 
      transition-all duration-200 ease-in-out
      ${checked 
        ? 'border-pink-400 bg-pink-50 shadow-md transform -translate-y-1' 
        : 'border-gray-200 bg-white hover:border-pink-200'
      }
    `}
  >
    <input
      type="radio"
      id={id}
      name="gender-preference"
      value={value}
      checked={checked}
      onChange={onChange}
      className="hidden"
    />
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        {icon && <span className="mr-3">{icon}</span>}
        <span className={`font-medium ${checked ? 'text-pink-600' : 'text-gray-700'}`}>
          {label}
        </span>
      </div>
      <div className={`
        w-5 h-5 border-2 rounded-full flex items-center justify-center
        ${checked 
          ? 'border-pink-400 bg-pink-400' 
          : 'border-gray-300'
        }
      `}>
        {checked && (
          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
        )}
      </div>
    </div>
  </label>
);
