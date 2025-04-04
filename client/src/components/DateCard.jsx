import { MapPin, Calendar, Clock, ExternalLink } from 'lucide-react';

// Create simple date formatting functions to replace date-fns until it's installed
const formatDate = (date) => {
  if (!date) return '';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];
  const dayNumber = date.getDate();
  
  return `${dayName}, ${monthName} ${dayNumber}`;
};

const formatTime = (date) => {
  if (!date) return '';
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  
  return `${hours}:${minutes} ${ampm}`;
};

const formatDistanceToNow = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const diffTime = date - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0) {
    return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  } else if (diffDays < 0) {
    return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} ago`;
  } else {
    return 'today';
  }
};

const DateCard = ({ dateCard }) => {
  // Removed unused state variable
  
  if (!dateCard) return null;
  
  const scheduledDate = new Date(dateCard.scheduled_date);
  const timeFromNow = formatDistanceToNow(scheduledDate);
  const formattedDate = formatDate(scheduledDate);
  const formattedTime = formatTime(scheduledDate);
  
  // Generate Google Maps link
  const mapsUrl = dateCard.latitude && dateCard.longitude 
    ? `https://www.google.com/maps/search/?api=1&query=${dateCard.latitude},${dateCard.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dateCard.location_name)}`;
  
  return (
    <div className="w-full rounded-lg overflow-hidden border border-pink-200 shadow-md mb-4 bg-white">
      <div className="relative">
        <img 
          src={dateCard.image_url || "/date-placeholder.jpg"} 
          alt={dateCard.title} 
          className="w-full h-40 object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <h3 className="text-xl font-bold text-white">{dateCard.title}</h3>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <p className="text-gray-700">{dateCard.description}</p>
        
        <div className="flex items-center text-gray-600">
          <MapPin className="w-5 h-5 mr-2 text-pink-500" />
          <div>
            <p className="font-medium">{dateCard.location_name}</p>
            <p className="text-sm text-gray-500">{dateCard.location_address}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-5 h-5 mr-2 text-pink-500" />
            <span>{formattedDate}</span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <Clock className="w-5 h-5 mr-2 text-pink-500" />
            <span>{formattedTime}</span>
          </div>
        </div>
        
        <div className="mt-2 text-center space-y-2">
          <p className="text-sm font-medium text-pink-600">{timeFromNow}</p>
          
          <a 
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm bg-pink-500 text-white px-3 py-1.5 rounded-full hover:bg-pink-600 transition-colors"
          >
            <MapPin className="w-4 h-4 mr-1" />
            View on Map
            <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default DateCard;
