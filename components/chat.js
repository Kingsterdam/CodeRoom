import React, { useState, useEffect } from 'react';
import { useRoomContext } from '/context/RoomContext';
import { connectSocket, joinRoom, sendMessage, onMessage, offMessage } from "../utils/socketCon";

function Chat() {
    const [activeTab, setActiveTab] = useState('chat');
    const { isRoomActive, setRoomCreated, stage, setStage, room, setRoom } = useRoomContext();
    const [muteStatus, setMuteStatus] = useState({});
    // const [room, setRoom] = useState("");
    const [isCreateRoomClicked, setIsCreateRoomClicked] = useState(false);
    const [isJoinRoomClicked, setIsJoinRoomClicked] = useState(false);
    const [chat, setChat] = useState([]); // State to store chat messages
    const [message, setMessage] = useState(""); // State to store input message 
    // const { stage, setStage } = useRoomContext();

    useEffect(() => {
        if (stage === 0) {
            setChat([])
        }
    }, [stage, isRoomActive])

    useEffect(() => {
        // Connect to the Socket.IO server
        connectSocket();

        // Listen for incoming messages
        onMessage((data) => {
            if (data.type !== "code") {
                setChat((prevChat) => [...prevChat, data]);
            }
        });

        return () => {
            // Clean up the message listener
            offMessage();
        };
    }, []);

    function generateRoomId(length = 8) {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let roomId = "";
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            roomId += characters[randomIndex];
        }
        return roomId;
    }

    const CreateRoom = () => {
        const roomId = generateRoomId();

        try {
            fetch("http://localhost:3300/api/v1/room", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_id: roomId
                })
            })
        } catch (e) {
            console.log("Error came while inserting room id", e)
        }
        setRoom(roomId);  // This sets the room state
        const newMsg = {
            type: "join",
            name: "You",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        joinRoom(roomId, newMsg)
        setRoomCreated(true);
        setIsCreateRoomClicked(true);
        setIsJoinRoomClicked(false);
        setRoomCreated(true)

        const currentUrl = window.location.href; // Get the current URL
        const baseUrl = currentUrl.split('?')[0]; // Remove any existing query params
        console.log("base url", baseUrl)
        const newUrl = `${baseUrl}?roomId=${roomId}`; // Append the roomId as a query parameter
        console.log("new url", newUrl)
        // Update the browser's URL without reloading the page
        window.history.pushState({ path: newUrl }, '', newUrl);
    };

    const handleJoinRoom = () => {
        setIsJoinRoomClicked(true);
        setIsCreateRoomClicked(false);
        setStage(1);
    };
    const handlingJoinRoom = async () => {
        const newMsg = {
            type: "join",
            name: "You",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        try {
            await fetch(`http://localhost:3300/api/v1/room/${room}/increment`, {
                method: "PATCH",
                headers: { 'Content-Type': 'application/json' },
            })
        }
        catch (e) {
            console.log("Unable to increase Members under this room", e)
        }
        joinRoom(room, newMsg);
        setIsJoinRoomClicked(false); // Ensure the input box doesn't stay visible after joining
        setRoomCreated(true)
        setStage(2)

        const currentUrl = window.location.href;
        const baseUrl = currentUrl.split('?')[0];
        console.log("base url", baseUrl)
        const newUrl = `${baseUrl}?roomId=${room}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
    };

    const handleSendMessage = () => {
        if (message.trim()) {
            const newMessage = {
                type: "chat",
                name: "You", // Replace this with the current user's name if available
                text: message,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setChat((prevChat) => [...prevChat, newMessage]); // Add the new message to the chat state
            sendMessage(room, newMessage); // Send the message to the server
            setMessage(""); // Clear the input field
        }
    };

    const toggleMute = (user) => {
        setMuteStatus((prevStatus) => ({
            ...prevStatus,
            [user]: !prevStatus[user],
        }));
    };

    const sendInvite = async () => {
        setLoading(true)
        if (!Email) {
            setEmailMessage("Please enter a valid email address.");
            setEmailMessageColor("bg-red-500"); // Error color
            return;
        }
        const url = window.location.href;
        try {
            const inviteMessage = await sendInviteCode(Email, url);
            console.log(url)
            if (inviteMessage) {
                setEmailMessage("Email sent successfully!");
                setEmailMessageColor("bg-green-600"); // Success color
            } else {
                setEmailMessage("Failed to send invite. Please try again.");
                setEmailMessageColor("bg-red-500"); // Error color
            }
        } catch (error) {
            setEmailMessage("An unexpected error occurred while sending the invite.");
            setEmailMessageColor("bg-red-500"); // Error color
        } finally {
            setEmail(""); // Clear the input field

            // Automatically hide the message after 5 seconds
            setTimeout(() => {
                setEmailMessage(""); // Clear the message
                setEmailMessageColor(""); // Reset message color
            }, 5000); // 5000ms = 5 seconds
        }
    };

    // Users data
    const users = ['Amit Mishra', 'Prasoon Saini', 'Abhinav Singh Pundir'];

    return (
        <div>
            {/* Tab Buttons */}
            <div className="flex justify-between text-black font-bold">
                <button
                    className={`w-full ${activeTab === 'chat' ? 'border-b border-black' : 'border-r'}`}
                    onClick={() => setActiveTab('chat')}
                >
                    Chat
                </button>
                <button
                    className={`w-full ${activeTab === 'users' ? 'border-b border-black' : 'border-l'}`}
                    onClick={() => setActiveTab('users')}
                >
                    Users
                </button>
            </div>
            <hr className="p-0 mt-1" />

            {/* Chat Section */}
            {activeTab === 'chat' && (
                <div className="flex-1 flex-col-reverse overflow-y-scroll scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 chat_messages py-4 px-1">
                    {chat.map((message, index) => (
                        <div
                            key={index}
                            className={`flex ${message.type === 'Join' || message.type === 'Leave'
                                ? 'justify-center'
                                : message.name === 'You'
                                    ? 'justify-end'
                                    : 'justify-start'
                                } mb-4`}
                        >
                            <div className={`flex flex-col max-w-[80%] ${message.name === 'You' ? 'items-end' : 'items-start'}`}>
                                {/* Check if message type is 'Join' */}
                                {message.type === 'Join' || message.type === 'Leave' ? (
                                    <div className="px-1 text-gray-800 name_size italic">
                                        <span className="text-sm text-gray-400">{message.text}</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="px-1 text-gray-400 name_size">
                                            {message.name || "Unknown"} <span className="text-gray-500">({message.time || "N/A"})</span>
                                        </div>
                                        <div
                                            className={`text-wrap p-2 ${message.name === 'You' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-black'
                                                } rounded-md border`}
                                        >
                                            {message.text || "No content"}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}


            {/* Users Section */}
            {activeTab === 'users' && (
                <div className="flex-1 px-1">
                    {isRoomActive ? (
                        <div>
                            <div className='flex gap-2 w-full mt-3'>
                                <input placeholder='Enter Users Email' value={Email} className='w-3/4 p-2 border' onChange={(e) => setEmail(e.target.value)} />
                                <button
                                    className={`w-1/4 p-2 rounded-sm border ${loading ? 'bg-white text-black cursor-not-allowed' : 'bg-gray-900 text-white'
                                        }`}
                                    onClick={sendInvite}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <div className="flex gap-1 justify-center">
                                            <img src="./invitation.gif" className="w-7 h-6" alt="Loading" />
                                            <div className="font-semibold">Inviting</div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-1 justify-center">
                                            <img
                                                src="./add-group.png"
                                                className="w-5 h-5 filter brightness-0 invert"
                                                alt="Add Group"
                                            />
                                            <div className="font-semibold">Invite</div>
                                        </div>
                                    )}
                                </button>

                            </div>
                            <div className='flex flex-col mt-5'>
                                <ul className="list-none px-3">
                                    {users.map((user, index) => (
                                        <div key={index} className='flex w-full'>
                                            <li className="text-black text-md w-2/4 mt-2">
                                                {user}
                                            </li>
                                            <div className='flex justify-end gap-1 w-2/4 mt-1'>
                                                <button className="text-white p-2 rounded-full" onClick={() => toggleMute(user)}>
                                                    <img
                                                        src={muteStatus[user] ? './volume.png' : './music.png'}
                                                        alt={muteStatus[user] ? 'Unmute' : 'Mute'}
                                                        width={17}
                                                    />
                                                </button>
                                                <button className='text-white py-2 px-2 rounded-full'>
                                                    <img src='./trash.png' width={17} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <p className="text-red-500 text-center flex flex-col chat_messages">Room not created yet.</p>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            {activeTab === 'chat' && (
                !isRoomActive && stage === 0 ? (
                    <div className="flex gap-4 justify-between mt-4">
                        <button
                            className="bg-gray-900 text-white rounded-sm p-2 w-full border"
                            onClick={CreateRoom}
                        >
                            Create Room
                        </button>
                        <button className="bg-white text-black rounded-sm p-2 w-full border" onClick={handleJoinRoom}>
                            Join Room
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-2 mt-2">
                        {stage === 1 && (
                            <>
                                <input
                                    type="text"
                                    className="w-full p-2 border"
                                    placeholder="Enter Room ID..."
                                    onChange={(e) => setRoom(e.target.value)}  // Update the room state when input changes
                                />
                                <button
                                    className="bg-gray-900 text-white p-2 px-4 rounded-md"
                                    onClick={handlingJoinRoom}  // Join the room when the button is clicked
                                >
                                    Join
                                </button>
                            </>
                        )}
                        {(isCreateRoomClicked || stage === 2) && (
                            <div className="flex gap-2 mt-2 w-full">
                                <textarea
                                    placeholder="Enter your message here"
                                    value={message} // Bind textarea to message state
                                    onChange={(e) => setMessage(e.target.value)} // Update message state on input change
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault(); // Prevent newlines
                                            handleSendMessage(); // Call the existing send function
                                        }
                                    }}
                                    className="w-3/4 rounded-sm border p-2 flex overflow-auto scrollbar-thin resize-none"
                                    rows={1} // Default height of 2 lines
                                />
                                <button
                                    className="bg-gray-900 text-white rounded-sm py-0 w-1/4 border"
                                    onClick={handleSendMessage} // Call handleSendMessage on button click
                                >
                                    Send
                                </button>
                            </div>
                        )}
                    </div>
                )
            )}

        </div>
    );
}

export default Chat;