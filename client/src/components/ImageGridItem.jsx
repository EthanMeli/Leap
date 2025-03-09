import { forwardRef } from 'react';

const ImageGridItem = forwardRef(({ image, index, isTouch, onImageClick, onRemove, provided, isDragging }, ref) => {
  return (
    <div 
      ref={ref}
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      className='relative w-full'
      style={{
        transform: isDragging ? provided?.draggableProps?.style?.transform : 'translate(0, 0)',
      }}
    >
      <div 
        className={`
          relative w-full pb-[150%] border-2 
          ${isDragging 
            ? 'border-pink-400 ring-2 ring-pink-400 shadow-xl' 
            : image 
              ? 'border-solid border-gray-300 hover:border-pink-300 transition-colors duration-200' 
              : 'border-dashed border-gray-300'
          } 
          rounded-lg overflow-hidden
        `}
      >
        <div className='absolute inset-0'>
          {image ? (
            <div className={`group relative h-full ${isTouch ? 'active:opacity-80' : ''}`}>
              <img 
                src={image} 
                alt={`Profile ${index + 1}`}
                className='w-full h-full object-cover'
                onClick={() => isTouch && onImageClick()}
              />
              {isTouch ? (
                <button
                  type='button'
                  onClick={onRemove}
                  className='absolute top-2 right-2 p-2 bg-black bg-opacity-50 rounded-full'
                >
                  <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
                  </svg>
                </button>
              ) : (
                <div className='absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 
                  transition-opacity flex flex-col items-center justify-center gap-4'>
                  <button
                    type='button'
                    onClick={onImageClick}
                    className='p-3 bg-white rounded-full hover:bg-gray-100'
                  >
                    <svg className='w-6 h-6 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' 
                        d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
                      />
                    </svg>
                  </button>
                  <button
                    type='button'
                    onClick={onRemove}
                    className='p-3 bg-white rounded-full hover:bg-gray-100'
                  >
                    <svg className='w-6 h-6 text-red-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' 
                        d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type='button'
              onClick={onImageClick}
              className='w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-gray-500'
            >
              <svg className='w-10 h-10 mb-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 4v16m8-8H4' />
              </svg>
              <span className='text-sm'>{isTouch ? 'Tap to add' : 'Add Image'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

ImageGridItem.displayName = 'ImageGridItem';
export default ImageGridItem;
