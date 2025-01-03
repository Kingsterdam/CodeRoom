import React, { useState, useEffect } from 'react';
import { useRoomContext } from '/context/RoomContext';
import { connectSocket, joinRoom, sendMessage, onMessage, offMessage } from "../utils/socketCon";
import { sendInviteCode } from '@/utils/sendInvite';

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
    const [Email, setEmail] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [messageColor, setEmailMessageColor] = useState('');
    const [timer, setTimer] = useState(5); // Start the timer at 5 seconds
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        // Connect to the Socket.IO server
        connectSocket();

        // Listen for incoming messages
        onMessage((data) => {
            setChat((prevChat) => [...prevChat, data]);
        });

        return () => {
            // Clean up the message listener
            offMessage();
        };
    }, []);

    useEffect(() => {
        let timerInterval;

        if (emailMessage) {
            setLoading(false)
            setTimer(5); // Reset the timer to 5 seconds whenever a new message is set
            timerInterval = setInterval(() => {
                setTimer((prevTimer) => {
                    if (prevTimer <= 1) {
                        clearInterval(timerInterval); // Stop the interval when time is up
                        setEmailMessage(""); // Hide the message
                        setEmailMessageColor(""); // Reset color
                    }
                    return prevTimer - 1;
                });
            }, 1000); // Decrement the timer every second
        }

        // Cleanup the interval on component unmount or when the message disappears
        return () => clearInterval(timerInterval);
    }, [emailMessage]);

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
        setRoom(roomId);  // This sets the room state
        const newMsg = {
            type: "Join",
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
        console.log("this is the stage", stage)
        setStage(1);
        console.log("this is the stage", stage)
    };
    const handlingJoinRoom = () => {
        const newMsg = {
            type: "Join",
            name: "You",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

        try {
            const inviteMessage = await sendInviteCode(Email);
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

    // Messages data with fixed timestamps
    const messages = [
        { name: 'Amit Mishra', text: 'Hi Prasoon, What are you doing ?', time: '10:00 AM' },
        { name: 'Prasoon Saini', text: 'Nothing just coding, what are you doing ?', time: '10:02 AM' },
        { name: 'Amit Mishra', text: 'I am implementing a website for my simple project.', time: '10:03 AM' },
        { name: 'Prasoon Saini', text: 'Where is Abhinav ? Do you live together?', time: '10:05 AM' },
        { name: 'Abhinav Singh Pundir', text: 'Hey Prasoon & Amit, Here I am, where you both are?', time: '10:07 AM' },
        { name: 'Amit Mishra', text: 'Hey Abhinav, Yes I am coming in January.', time: '10:10 AM' },
        { name: 'Abhinav Singh Pundir', text: 'Hey Prasoon & Amit, Here I am, where you both are? I am currently in Bangalore looking for both of you. Are you coming to Bangalore to meet me?', time: '10:10 AM' },
        { name: 'Amit Mishra', text: 'Hey Abhinav, Yes I am coming in January.', time: '10:15 AM' },
        { name: 'Prasoon Saini', text: 'Hey Abhinav, I am also coming in last December.', time: '10:16 AM' },
        { name: 'Abhinav Singh Pundir', text: 'Living in Electronic City Phase 1, please come.', time: '10:18 AM' },
        { name: 'Amit Mishra', text: 'Okay Abhinav, will meet.', time: '10:20 AM' },
        { name: 'Abhinav Singh Pundir', text: 'I am leaving, bye.', time: '10:21 AM' },
        { name: 'Prasoon Saini', text: 'Bye, leaving.', time: '10:25 AM' }
    ];

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
                        <div key={index} className={`flex ${message.name === 'You' ? 'justify-end' : 'justify-start'} mb-4`}>
                            <div className={`flex flex-col max-w-[80%] ${message.name === 'You' ? 'items-end' : 'items-start'}`}>
                                <div className="px-1 text-gray-400 name_size">
                                    {message.name || "Unknown"} <span className="text-gray-500">({message.time || "N/A"})</span>
                                </div>
                                <div
                                    className={`text-wrap p-2 ${message.name === 'You' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-black'
                                        } rounded-md border`}
                                >
                                    {message.text || "No content"}
                                </div>
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
                                <button className='w-1/4 p-2 bg-gray-900 text-white rounded-sm border' onClick={sendInvite} disabled={loading}>
                                    {loading ? (
                                        <div className='flex gap-1 text-white justify-center'>
                                            <img src='./invitation.gif' className='w-5 h-5 filter backdrop-invert' />
                                            <div className='text-white'>Inviting</div>
                                        </div>
                                    ) : (
                                        <div className='flex gap-1 text-white justify-center rounded-sm'>
                                            <img src='./add-group.png' className='w-5 h-5 filter brightness-0 invert' />
                                            <div className='text-white font-semibold'>Invite</div>
                                        </div>
                                    )}
                                </button>
                            </div>
                            {emailMessage && (
                                <div className={`mt-3 font-semibold flex justify-between ${messageColor} text-white rounded-md border p-2`}>
                                    <p>{emailMessage}</p>
                                    <p>{`${timer}s`}</p>
                                </div>
                            )}
                            <div className='font-bold py-2 border-b px-2 mt-5'>
                                Participants (3)
                            </div>
                            <div className='flex flex-col mt-1'>
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
                                <input
                                    placeholder="Enter your message here"
                                    value={message} // Bind input to message state
                                    onChange={(e) => setMessage(e.target.value)} // Update message state on input change
                                    className="w-3/4 rounded-md border p-2 flex overflow-auto scrollbar-thin"
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
