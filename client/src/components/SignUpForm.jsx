import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';

const SignUpForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [genderPreference, setGenderPreference] = useState("");
  const [interests, setInterests] = useState([]);
  const [customInterest, setCustomInterest] = useState("");

  const recommendedInterests = [
    "Travel",
    "Music",
    "Movies",
    "Fitness",
    "Food",
    "Photography",
    "Art",
    "Reading",
    "Gaming",
    "Sports"
  ];
  
  const { signup, loading } = useAuthStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (interests.length === 0) {
      toast.error("Please select at least one interest");
      return;
    }
    signup({
      name, 
      email, 
      password, 
      gender, 
      age: parseInt(age), 
      genderPreference,
      interests
    });
  };

  const handleInterestChange = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const addCustomInterest = (e) => {
    e?.preventDefault(); // Handle both button click and form submit
    if (!customInterest.trim()) {
      return;
    }
    
    const formatted = customInterest.trim();
    
    if (interests.includes(formatted)) {
      toast.error("This interest already exists!");
      return;
    }
    
    if (formatted.length < 2) {
      toast.error("Interest must be at least 2 characters long");
      return;
    }
    
    setInterests(prev => [...prev, formatted]);
    setCustomInterest("");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomInterest(e);
    }
  };

  return (
    <form className='space-y-6'
      onSubmit={handleSubmit}
    >

      {/* NAME */}
      <div>
        <label htmlFor='name' className='block text-sm font-medium text-gray-700'>
          Name
        </label>
        <div className='mt-1'>
          <input 
            id='name'
            name='name'
            type='text'
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
            placeholder-gray-400 focus:outline-none focus:ring-pink-300 focus:border-pink-300 sm:text-sm'
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor='email' className='block text-sm font-medium text-gray-700'>
          Email
        </label>
        <div className='mt-1'>
          <input 
            id='email'
            name='email'
            type='email'
            autoComplete='email'
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
            placeholder-gray-400 focus:outline-none focus:ring-pink-300 focus:border-pink-300 sm:text-sm'
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label htmlFor='password' className='block text-sm font-medium text-gray-700'>
          Password
        </label>
        <div className='mt-1'>
          <input 
            id='password'
            name='password'
            type='password'
            autoComplete='new-password'
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
            placeholder-gray-400 focus:outline-none focus:ring-pink-300 focus:border-pink-300 sm:text-sm'
          />
        </div>
      </div>

      {/* Age */}
      <div>
        <label htmlFor='age' className='block text-sm font-medium text-gray-700'>
          Age
        </label>
        <div className='mt-1'>
          <input 
            id='age'
            name='age'
            type='number'
            required
            value={age}
            onChange={(e) => setAge(e.target.value)}
            min='18'
            max='120'
            className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
            placeholder-gray-400 focus:outline-none focus:ring-pink-300 focus:border-pink-300 sm:text-sm'
          />
        </div>
      </div>

      {/* GENDER */}
      <div>
        <label className='block text-sm font-medium text-gray-700'>
          Your Gender
        </label>
        <div className='mt-2 flex gap-2'>
          <div className='flex items-center'>
            <input 
              id='male'
              name='gender'
              type='radio'
              checked={gender === "male"}
              onChange={() => setGender("male")}
              className='h-4 w-4 text-purple-600 focus:ring-pink-300 border-gray-300 rounded'
            
            />
            <label htmlFor='male' className='ml-2 block text-sm text-gray-900'>
              Male
            </label>
          </div>
          <div className='flex items-center'>
            <input 
              id='female'
              name='gender'
              type='radio'
              checked={gender === "female"}
              onChange={() => setGender("female")}
              className='h-4 w-4 text-purple-600 focus:ring-pink-300 border-gray-300 rounded'
            />
            <label htmlFor='female' className='ml-2 block text-sm text-gray-900'>
              Female
            </label>
          </div>
        </div>
      </div>

      {/* GENDER PREFERENCE */}
      <div>
        <label className='block text-sm font-medium text-gray-700'>
          Preferred Gender
        </label>
        <div className='mt-2 space-y-2'>
          <div className='flex items-center'>
            <input 
              id='prefer-male'
              name='gender-preference'
              type='radio'
              value='male'
              checked={genderPreference === "male"}
              onChange={(e) => setGenderPreference(e.target.value)}
              className='h-4 w-4 text-purple-600 focus:ring-pink-300 border-gray-300 rounded'
            
            />
            <label htmlFor='prefer-male' className='ml-2 block text-sm text-gray-900'>
              Male
            </label>
          </div>
          <div className='flex items-center'>
            <input 
              id='prefer-female'
              name='gender-preference'
              type='radio'
              value='female'
              checked={genderPreference === "female"}
              onChange={(e) => setGenderPreference(e.target.value)}
              className='h-4 w-4 text-purple-600 focus:ring-pink-300 border-gray-300 rounded'
            />
            <label htmlFor='prefer-female' className='ml-2 block text-sm text-gray-900'>
              Female
            </label>
          </div>
          <div className='flex items-center'>
            <input 
              id='prefer-both'
              name='gender-preference'
              type='radio'
              value='both'
              checked={genderPreference === "both"}
              onChange={(e) => setGenderPreference(e.target.value)}
              className='h-4 w-4 text-purple-600 focus:ring-pink-300 border-gray-300 rounded'
            />
            <label htmlFor='prefer-any' className='ml-2 block text-sm text-gray-900'>
              Both
            </label>
          </div>
        </div>
      </div>

      {/* INTERESTS SECTION */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Interests
        </label>
        
        {/* Recommended Interests */}
        <div className='grid grid-cols-2 gap-2 mb-4'>
          {recommendedInterests.map(interest => (
            <label key={interest} className='flex items-center space-x-2'>
              <input
                type='checkbox'
                checked={interests.includes(interest)}
                onChange={() => handleInterestChange(interest)}
                className='rounded border-gray-300 text-pink-400 focus:ring-pink-300'
              />
              <span className='text-sm text-gray-700'>{interest}</span>
            </label>
          ))}
        </div>

        {/* Custom Interest Input */}
        <div className='flex space-x-2'>
          <input
            type='text'
            value={customInterest}
            onChange={(e) => setCustomInterest(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder='Add custom interest'
            className='flex-1 appearance-none px-3 py-2 border border-gray-300 rounded-md shadow-sm 
              placeholder-gray-400 focus:outline-none focus:ring-pink-300 focus:border-pink-300 sm:text-sm'
          />
          <button
            type='button'
            onClick={addCustomInterest}
            className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium 
              text-white bg-pink-400 hover:bg-pink-500 focus:outline-none focus:ring-2 
              focus:ring-offset-2 focus:ring-pink-300'
          >
            Add
          </button>
        </div>

        {/* Selected Interests */}
        {interests.length > 0 && (
          <div className='mt-2'>
            <div className='flex flex-wrap gap-2'>
              {interests.map(interest => (
                <span
                  key={interest}
                  className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    bg-pink-100 text-pink-800'
                >
                  {interest}
                  <button
                    type='button'
                    onClick={() => handleInterestChange(interest)}
                    className='ml-1 text-pink-600 hover:text-pink-800'
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <button 
          type='submit'
          className={`w-full flex justify-center py-2 px-4 border border-transparent
            rounded-md shadow-sm text-sm font-medium text-white ${
              loading
                ? "bg-pink-400 cursor-not-allowed"
                : "bg-pink-400 hover:bg-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
          }`}
          disabled={loading}
        >
          Create Account
        </button>
      </div>

    </form>
  );
};

export default SignUpForm