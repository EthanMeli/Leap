export const InterestCard = ({ interest, isSelected, onToggle }) => (
  <label 
    className={`
      relative block w-full p-3 cursor-pointer rounded-lg border-2
      transition-all duration-200 ease-in-out
      ${isSelected
        ? 'border-pink-400 bg-pink-50 shadow-md transform -translate-y-1'
        : 'border-gray-200 bg-white hover:border-pink-200'
      }
    `}
  >
    <input
      type="checkbox"
      className="hidden"
      checked={isSelected}
      onChange={onToggle}
    />
    <div className="flex items-center justify-between">
      <span className={`font-medium ${isSelected ? 'text-pink-600' : 'text-gray-700'}`}>
        {interest}
      </span>
      <div className={`
        w-5 h-5 border-2 rounded flex items-center justify-center
        ${isSelected
          ? 'border-pink-400 bg-pink-400'
          : 'border-gray-300'
        }
      `}>
        {isSelected && (
          <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </div>
  </label>
);
