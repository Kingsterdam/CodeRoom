'use client';
import React from 'react';
import Navbar from '../../components/navbar';
import ErrorBoundary from '../../components/ErrorBoundry';

function Profile() {
  const user = {
    name: "John Doe",
    email: "johndoe@example.com",
    totalRoomsJoined: 15,
    totalRoomsCreated: 5,
    totalCodeRuns: 120,
  };

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
              JD
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mt-2">John Doe</h2>
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
