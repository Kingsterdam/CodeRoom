import React, { useState } from "react";
import Toogle from "./toggle";
import { useRoomContext } from "../context/RoomContext";
import { leaveRoom } from "@/utils/socketCon";
import "../app/globals.css";
import AuthButtons from "./authButtons";
import ThemeToggle from "./themeToggle";

function Navbar() {
    const { isRoomActive, setRoomCreated, stage, setStage, room, setRoom } = useRoomContext(); // Destructure setRoomCreated
    const [showPopup, setShowPopup] = useState(false); // State to manage the popup visibility

    const handlePopup = () => {
        setShowPopup(true); // Show the popup
    };

    const handleCloseRoom = () => {
        setRoomCreated(false); // Close the room
        setShowPopup(false); // Hide the popup
        const newMsg = {
            type: "Leave",
            name: "You",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        leaveRoom(room, newMsg)
        setStage(0);
        const currentUrl = window.location.href;
        const baseUrl = currentUrl.split('?')[0];
        const newUrl = baseUrl;
        window.history.pushState({ path: newUrl }, '', newUrl);
    };

    const handleCancel = () => {
        setShowPopup(false); // Hide the popup
    };

    return (
        <div className="flex items-center justify-between ">
            <div className="text-xl font-bold text-black">
                CodeRoom
            </div>
            <div>
                {isRoomActive && (
                    <button
                        onClick={handlePopup} // Trigger the popup on click
                    >
                        <span className="green-dot">●</span>
                        <span className="hidden md:inline px-1.5 text-green-700 font-semibold">
                            Room Active
                        </span>
                    </button>
                )}
            </div>
            <div className="flex items-center p-2 gap-3">
                <ThemeToggle/>
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
