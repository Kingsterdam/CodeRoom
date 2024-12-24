import React, { useState, useEffect } from 'react';
import { useRoomContext } from '/context/RoomContext';
import { connectSocket, joinRoom, sendMessage, onMessage, offMessage } from "../utils/socketCon";

function Chat() {
    const [activeTab, setActiveTab] = useState('chat');
    const { isRoomActive, setRoomCreated } = useRoomContext();
    const [muteStatus, setMuteStatus] = useState({});
    const [room, setRoom] = useState("");
    const [isCreateRoomClicked, setIsCreateRoomClicked] = useState(false);
    const [isJoinRoomClicked, setIsJoinRoomClicked] = useState(false);

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
        // Whenever `room` changes, join the room
        if (room) {
            joinRoom(room);
            alert(`Joined room: ${room}`);
        }
    }, [room]); 


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
        setRoomCreated(true);
        setIsCreateRoomClicked(true)
    };

    const handleJoinRoom = () => {
        setIsCreateRoomClicked(false);
        setIsJoinRoomClicked(true);
        console.log(isJoinRoomClicked)
    };
    
    


    const toggleMute = (user) => {
        setMuteStatus((prevStatus) => ({
            ...prevStatus,
            [user]: !prevStatus[user], // Toggle the mute status for the specific user
        }));
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
                    {messages.map((message, index) => (
                        <div key={index} className={`flex ${message.name === 'Amit Mishra' ? 'justify-end' : 'justify-start'} mb-4`}>
                            <div className={`flex flex-col max-w-[80%] ${message.name === 'Amit Mishra' ? 'items-end' : 'items-start'}`}>
                                <div className="px-1 text-gray-400 name_size">
                                    {message.name} <span className="text-gray-500">({message.time})</span>
                                </div>
                                <div
                                    className={`text-wrap p-2 ${message.name === 'Amit Mishra' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-black'
                                        } rounded-md border`}
                                >
                                    {message.text}
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
                                <input placeholder='Enter Users Email' className='w-3/4 p-2 border' />
                                <button className='w-1/4 p-2 bg-gray-900 text-white rounded-sm'>+Invite</button>
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
                !isRoomActive ? (
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
                        {isJoinRoomClicked && (
                            <>
                                <input
                                    type="text"
                                    className="w-full p-2 border"
                                    placeholder="Enter Room ID..."
                                    onChange={(e) => setRoom(e.target.value)}  // Update the room state when input changes
                                />
                                <button
                                    className="bg-green-500 text-white p-2 rounded-md"
                                    onClick={() => joinRoom(room)}  // Join the room when the button is clicked
                                >
                                    Invite
                                </button>
                            </>
                        )}
                        {isCreateRoomClicked && (
                            <>
                                <textarea
                                    placeholder="Enter your message here"
                                    className="w-3/4 rounded-md border p-0 flex justify-items-center overflow-auto scrollbar-thin"
                                />
                                <button className="bg-gray-900 text-white rounded-sm py-0 w-1/4 border">
                                    Send
                                </button>
                            </>
                        )}
                        
                    </div>
                )
            )}

        </div>
    );
}

export default Chat;
