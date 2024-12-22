import React, { useState } from "react";
import Toogle from "./toggle";
import { useRoomContext } from "../context/RoomContext";
import "../app/globals.css";

function Navbar() {
    const { isRoomActive, setRoomCreated } = useRoomContext(); // Destructure setRoomCreated
    const [showPopup, setShowPopup] = useState(false); // State to manage the popup visibility

    const handlePopup = () => {
        setShowPopup(true); // Show the popup
    };

    const handleCloseRoom = () => {
        setRoomCreated(false); // Close the room
        setShowPopup(false); // Hide the popup
    };

    const handleCancel = () => {
        setShowPopup(false); // Hide the popup
    };

    return (
        <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-black">
                CodeRoom
            </div>
            <div>
                {isRoomActive && (
                    <button
                        onClick={handlePopup} // Trigger the popup on click
                    >
                        <span className="green-dot">●</span>
                        <span className="hidden md:inline px-1.5 text-green-700">
                            Room Active
                        </span>
                    </button>
                )}
            </div>
            <Toogle />

            {/* Popup Modal */}
            {showPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                        <p className="text-lg font-semibold mb-4">
                            Are you sure you want to leave the room?
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                onClick={handleCloseRoom}
                            >
                                Leave Room
                            </button>
                            <button
                                className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Navbar;
