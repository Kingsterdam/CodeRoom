// components/ChatButtons.js
import React from 'react';

function room() {
    return (
        <div className="flex gap-4 justify-between">
        <button className="bg-green-600 text-white rounded-sm px-2 w-full">
          Create Room
        </button>
        <button className="bg-blue-600 text-white rounded-sm px-2 w-full">
          Join Room
        </button>
      </div>
    );
}

export default room;
