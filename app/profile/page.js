'use client';
import React, { useState, useEffect } from 'react';
import Navbar from '../../components/navbar';
import ErrorBoundary from '../../components/ErrorBoundry';

function Profile() {
  const [user, setUser] = useState({
    name: 'Guest',
    email: 'guest@example.com',
    picture: './man.png',
    totalRoomsJoined: 0,
    totalRoomsCreated: 0,
    totalCodeRuns: 0,
  });

  useEffect(() => {
    const userData = {
      name: localStorage.getItem('userName') || 'Guest',
      email: localStorage.getItem('userEmail') || 'guest@example.com',
      picture: localStorage.getItem('userPicture') || './man.png',
      totalRoomsJoined: localStorage.getItem('totalRoomsJoined') || 0,
      totalRoomsCreated: localStorage.getItem('totalRoomsCreated') || 0,
      totalCodeRuns: localStorage.getItem('totalCodeRuns') || 0,
    };
    setUser(userData);
  }, []); // Empty dependency array ensures this runs only once after the component mounts.

  return (
    <div className="h-screen flex flex-col">
      <header className="w-full px-4 font-bold">
        <ErrorBoundary>
          <Navbar />
        </ErrorBoundary>
      </header>
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300">
        <div className="bg-white shadow-xl rounded-md p-6 w-11/12 max-w-md">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-3xl font-bold">
              <img src={user.picture} alt="User" className="w-16 h-16 rounded-full" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mt-2">{user.name}</h2>
            <p className="text-gray-600 text-sm">{user.email}</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600 font-medium">Rooms Joined</span>
              <span className="text-gray-800 font-semibold">{user.totalRoomsJoined}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600 font-medium">Rooms Created</span>
              <span className="text-gray-800 font-semibold">{user.totalRoomsCreated}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Code Runs</span>
              <span className="text-gray-800 font-semibold">{user.totalCodeRuns}</span>
            </div>
          </div>

          <button className="bg-gray-800 text-white py-3 px-6 rounded-lg hover:bg-gray-900 w-full mt-6">
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
