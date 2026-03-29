import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import docIcon1 from "@/assets/images/docicon1.png";
// import docIcon2 from "@/assets/images/docicon2.png";
import docIcon3 from "@/assets/images/docicon3.png";
import { IoMic, IoSearch } from 'react-icons/io5';
import { Page } from '@/components/Page';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  experience: string;
  rating: number;
  availability: string;
  imageUrl: string;
  active: boolean;
}

const dummyDoctors: Doctor[] = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    specialty: "General Physician",
    experience: "10 years",
    rating: 4.8,
    availability: "Mon-Fri, 9AM-5PM",
    imageUrl: docIcon1,
    active: true
  },
  {
    id: 2,
    name: "Dr. Michael Chen",
    specialty: "Cardiologist",
    experience: "15 years",
    rating: 4.9,
    availability: "Mon-Wed, 10AM-6PM",
    imageUrl: docIcon1,
    active: true
  },
  {
    id: 3,
    name: "Dr. Emily Williams",
    specialty: "Nutritionist",
    experience: "8 years",
    rating: 4.7,
    availability: "Tue-Sat, 9AM-4PM",
    imageUrl: docIcon3,
    active: false
  }
];

const DoctorsConsultationPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBookConsultation = (doctorId: number) => {
    navigate(`/consultation/${doctorId}`);
  };
  const [search, setSearch] = useState("");

  return (
     <Page back={true}>
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Doctor Consultations</h1>
       {/* Search */}
            <div className="relative px-4">
              <input
                type="text"
                placeholder="Search a Doctor"
                className="w-full p-2 pl-10 pr-10 bg-gray-600 rounded-md outline-none text-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <IoSearch className="absolute left-6 top-3 text-gray-300 text-lg" />
              <IoMic className="absolute right-6 top-3 text-gray-300 text-lg" />
            </div>
            <div className="px-4 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="flex space-x-3">
    {dummyDoctors.map((doc, index) => (
      <div key={index} className="relative flex-shrink-0">
        <img 
          src={doc.imageUrl} 
          alt={doc.name} 
          className="w-12 h-12 rounded-full border-2 border-white" 
        />
        {doc.active && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#032f48]"></span>
        )}
      </div>
    ))}
  </div>
        {dummyDoctors.map((doctor) => (
          <div key={doctor.id} className="border rounded-lg p-4 shadow-sm">
            <img
              src={doctor.imageUrl}
              alt={doctor.name}
              className="w-full h-40 object-cover rounded-lg mb-4"
            />
            <h2 className="text-xl font-semibold">{doctor.name}</h2>
            <p className="text-gray-600">{doctor.specialty}</p>
            <p className="text-sm text-gray-500">Experience: {doctor.experience}</p>
            <div className="flex items-center mt-2">
              <span className="text-yellow-400">★</span>
              <span className="ml-1">{doctor.rating}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">{doctor.availability}</p>
            <button 
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg w-full"
              onClick={() => handleBookConsultation(doctor.id)}
            >
              Book Consultation
            </button>
          </div>
        ))}
      </div>
      </div>
    </div>
    </Page>
  );
};

export default DoctorsConsultationPage; 