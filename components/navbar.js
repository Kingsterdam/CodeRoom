import React, { useState } from "react";
import Toogle from "./toggle";
import { useRoomContext } from "../context/RoomContext";
import { leaveRoom } from "@/utils/socketCon";
import "../app/globals.css";
import AuthButtons from "./authButtons";
import ThemeToggle from "./themeToggle";
import { useLoader } from '../context/loadingContext'; // Import the useLoader hook
import { useWebRTCAudio } from '@/hooks/webRTCAudio';
import AudioIndicator from "./audioIndicator";

function Navbar() {
    const { isRoomActive, setRoomCreated, stage, setStage, room, setRoom } = useRoomContext(); // Destructure setRoomCreated
    const [showPopup, setShowPopup] = useState(false); // State to manage the popup visibility
    const { showLoader, hideLoader } = useLoader(); // Destructure the showLoader function
    const handlePopup = () => {
        setShowPopup(true); // Show the popup
    };
    const {
        isMuted,
        isConnected,
        audioLevel,
        connectedPeers,
        handleToggleMute,
        userInteracted
    } = useWebRTCAudio(room, isRoomActive);

    const handleCloseRoom = async () => {
        const newMsg = {
            type: "leave",
            name: "You",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }

        setRoomCreated(false); // Close the room
        setShowPopup(false); // Hide the popup
        leaveRoom(room, newMsg)
        setStage(0);
        setRoom(false);
        const currentUrl = window.location.href;
        const baseUrl = currentUrl.split('?')[0];
        const newUrl = baseUrl;

        window.history.pushState({ path: newUrl }, '', newUrl);
        try {
            const response = await fetch(`http://localhost:9090/api/v1/room/${room}/decrement`, {
                method: "PATCH",
                headers: { 'Content-Type': 'application/json' },
            })
            if (response.ok) {
                const room_data = await response.json()
                console.log("Members", room_data)
                if (room_data.updatedRoom.Members === 0) {
                    console.log("Delete called")
                    await fetch(`http://localhost:9090/api/v1/room/${room}`, {
                        method: "DELETE",
                        headers: { 'Content-Type': 'application/json' },
                    })
                }
            }
        }
        catch (e) {
            console.log("Unable to decrease Members under this room", e)
        }
    };

    const handleCancel = () => {
        setShowPopup(false); // Hide the popup
    };

    return (
        <div className="flex items-center justify-between ">
            <div className="text-xl font-bold text-black dark:text-white">
                <div className="relative group cursor-pointer">
                    <div className="text-xl font-bold flex items-center">
                        {/* First part - Code with enhanced gradient */}
                        <span className="text-black font-bold dark:text-white transition-all duration-300">
                            Code
                        </span>

                        {/* Second part - Room with complementary gradient */}
                        <span className="bg-gray-900 text-white p-1 rounded-md dark:bg-white dark:text-black transition-all duration-300">
                            Room
                        </span>
                    </div>

                </div>
            </div>
            <div>
                {isRoomActive && (
                    <div className="flex">
                        <button
                            onClick={handlePopup} // Trigger the popup on click
                        >
                            <span className="green-dot dark:text-green-400">●</span>
                            <span className="hidden md:inline px-1.5 text-green-700 font-semibold dark:text-green-400">
                                Room Active
                            </span>
                        </button>
                        <AudioIndicator />
                    </div>

                )}
            </div>
            <div className="flex items-center p-2 gap-3">
                <ThemeToggle />
                <AuthButtons />
            </div>

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
            )
            }
        </div >
    );
}

export default Navbar;