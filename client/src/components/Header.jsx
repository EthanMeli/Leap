import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Link } from 'react-router-dom';
import { User, LogOut, Menu, HeartHandshake } from 'lucide-react';

export const Header = () => {
  const {authUser, logout} = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  },[])
  return (
    <header className='bg-gradient-to-r from-orange-300 via-orange-200 to-pink-300 shadow-lg'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center py-4'>
          <div className='flex items-center'>
            <Link to="/" className='flex items-center space-x-2'>
              <HeartHandshake className="w-8 h-8 text-white hover:cursor-pointer" />
              <span className='text-2xl text-white hidden sm:inline'>Leap</span>
            </Link>
          </div>

          <div className='hidden md:flex items-center space-x-4'>
            {authUser ? (
              <div className='relative' ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className='flex items-center space-x-2 focus:outline-none'
                >
                  <img 
                    src={authUser.image?.[0] || "/avatar.png"}
                    className='h-10 w-10 object-cover rounded-full border-2 border-white hover:cursor-pointer'
                    alt='User image'
                  />
                  <span className='text-white font-medium hover:cursor-pointer'>
                    {authUser.name}
                  </span>

                </button>
                {dropdownOpen && (
                  <div className='absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10'>
                    <Link
                      to='/profile'
                      className='px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 flex items-center hover:cursor-pointer'
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User className='mr-2' size={16} />
                      Profile
                    </Link>
                    <button
                      onClick={logout}
                      className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 flex items-center hover:cursor-pointer'
                    >
                      <LogOut className='mr-2' size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to='/auth'
                  className='text-white hover:text-pink-200 transition duration-150 ease-in-out'
                >
                  Login
                </Link>
                <Link
                  to='/auth'
                  className='bg-white text-pink-300 px-4 py-2 rounded-full font-medium 
                  hover:bg-purple-100 transition duration-150 ease-in-out'
                >
                  Sign Up
                </Link>
              </>
            )}

          </div>

          <div className='md:hidden'>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className='text-white focus:outline-none'
            >
              <Menu className='size-6 hover:cursor-pointer' />
            </button>
          </div>

        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className='md:hidden bg-gradient-to-r from-orange-300 via-orange-200 to-pink-300'>
          <div className='px-2 pt-2 pb-3 space-y-1 sm:px-3'>
            {authUser ? (
              <>
                <Link
                  to='/profile'
                  className='block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gradient-to-r from-orange-400 via-orange-300 to-pink-400'
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    logout()
                    setMobileMenuOpen(false)
                  }}
                  className='block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white
                  hover:bg-gradient-to-r from-orange-400 via-orange-300 to-pink-400 hover:cursor-pointer'
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to='/auth'
                  className='block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gradient-to-r from-orange-400 via-orange-300 to-pink-400'
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to='/auth'
                  className='block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gradient-to-r from-orange-400 via-orange-300 to-pink-400'
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

        </div>
      
      )}
    </header>
  )
}

export default Header