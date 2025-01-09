import React, { useState, useEffect } from 'react';
import { useRoomContext } from '/context/RoomContext';
import { connectSocket, joinRoom, sendMessage, onMessage, offMessage } from "../utils/socketCon";
import { sendInviteCode } from '../utils/sendInvite';
import { createRoom, fetchMessagesForRoom, incrementRoomMembers, sendMessage as sendingMessage } from '../utils/postgresCon';
import { useLoader } from '../context/loadingContext';
import { getLoginUrl, logoutUser, getAuthStatus } from '../utils/googleAuth';
import MessageSkeleton from './MessageSkeleton';

function Chat() {
    const [activeTab, setActiveTab] = useState('chat');
    const { isRoomActive, setRoomCreated, stage, setStage, room, setRoom } = useRoomContext();
    const [muteStatus, setMuteStatus] = useState({});
    const [isCreateRoomClicked, setIsCreateRoomClicked] = useState(false);
    const [isJoinRoomClicked, setIsJoinRoomClicked] = useState(false);
    const [chat, setChat] = useState([]); // State to store chat messages
    const [message, setMessage] = useState(""); // State to store input message 
    const [Email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailMessage, setEmailMessage] = useState('');
    const [emailMessageColor, setEmailMessageColor] = useState('')
    const { showLoader, hideLoader } = useLoader();
    const [showPopup, setShowPopup] = useState(false);
    const [userLoggedIn, setUserLoggedIn] = useState(false);
    const [usersData, setUsersData] = useState(null);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);


    // const { stage, setStage  } = useRoomContext();
    useEffect(() => {
        const loadMessages = async () => {
            setIsLoadingMessages(true);
            try {
                if (room) {
                    const messages = await fetchMessagesForRoom(room);
                    console.log('Fetched messages:', messages);

                    const formattedMessages = messages.map(dbMsg => ({
                        type: dbMsg.message_type || "chat",
                        name: dbMsg.username || "Unknown",
                        text: dbMsg.message_text,
                        time: new Date(dbMsg.sent_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                        }),
                        email: dbMsg.user_email,
                        id: dbMsg.message_id
                    }));

                    setChat(formattedMessages);
                }
            } catch (e) {
                console.error("Error loading messages:", e);
            } finally {
                setIsLoadingMessages(false);
            }
        };

        if (room && (stage === 2 || isRoomActive)) {
            loadMessages();
        }
    }, [room, stage, isRoomActive]);


    useEffect(() => {
        const loadUserData = async () => {
            const userData = await getAuthStatus();
            if (userData) {
                setUsersData(userData);
                setUserLoggedIn(true);
            }
        };

        if (!isRoomActive) {
            loadUserData();
        }
    }, [])


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

    const handleLogin = async () => {
        try {
            setLoading(true);
            setTimeout(() => {
                window.location.href = getLoginUrl();
            }, 500);
        } catch (error) {
            console.error('Login failed:', error);
            setError('Failed to login');
            setLoading(false);
        }
    };
    const handleCancel = () => {
        setShowPopup(false); // Hide the popup
    };

    function generateRoomId(length = 8) {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let roomId = "";
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            roomId += characters[randomIndex];
        }
        return roomId;
    }

    const CreateRoom = async () => {
        const roomId = generateRoomId();

        // Update URL immediately
        const currentUrl = window.location.href;
        const baseUrl = currentUrl.split('?')[0];
        const newUrl = `${baseUrl}?roomId=${roomId}`;
        window.history.pushState({ path: newUrl }, '', newUrl);

        // Perform backend operations in the background
        try {
            showLoader();
            const responses = await Promise.allSettled([
                // Database operation in the background
                createRoom(roomId), // make sure the createRoom function returns the response
                // Socket operation
                new Promise((resolve, reject) => {
                    try {
                        joinRoom(roomId, {
                            type: "join",
                            name: "You",
                            time: new Date().toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            })
                        });
                        resolve(true);
                    } catch (error) {
                        reject(error);
                    }
                })
            ]);

            // Check if the createRoom API response was unauthorized
            const createRoomResponse = responses[0];
            console.log("Create room response:", createRoomResponse);
            if (createRoomResponse.value.error === 'Not authenticated' || createRoomResponse.value.status === 401) {
                setShowPopup(true);
                hideLoader();
                return;
            }

            setRoom(roomId);
            setRoomCreated(true);
            setIsCreateRoomClicked(true);
            setIsJoinRoomClicked(false);

        } catch (e) {
            console.error("Error in room creation:", e);
            setShowPopup(true);
        } finally {
            hideLoader(); // Hide loader once background operations complete
        }
    };



    const handleJoinRoom = async () => {
        if (!userLoggedIn) {
            setShowPopup(true);
        }
        else {
            setIsJoinRoomClicked(true);
            setIsCreateRoomClicked(false);
            setStage(1);
        }

    };
    // Modified handlingJoinRoom function
    const handlingJoinRoom = async () => {
        const newMsg = {
            type: "join",
            name: usersData.displayName,
            time: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            })
        };

        try {
            showLoader();
            const joinRoomResponse = await incrementRoomMembers(room);

            // Fetch existing messages when joining
            const messages = await fetchMessagesForRoom(room);
            const formattedMessages = messages.map(dbMessage => ({
                type: "chat",
                name: dbMessage.sender || "Unknown",
                text: dbMessage.content,
                time: new Date(dbMessage.sent_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                })
            }));

            console.log("Create room response:", joinRoomResponse);
            if (joinRoomResponse.value.error === 'Not authenticated' || joinRoomResponse.value.status === 401) {
                setShowPopup(true);
                hideLoader();
                return;
            }

            setChat(formattedMessages);
            joinRoom(room, newMsg);
            setIsJoinRoomClicked(false);
            setRoomCreated(true);
            setStage(2);

            const currentUrl = window.location.href;
            const baseUrl = currentUrl.split('?')[0];
            const newUrl = `${baseUrl}?roomId=${room}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
        } catch (e) {
            console.log("Error joining room:", e);
        } finally {
            hideLoader();
        }
    };
    // Modified handleSendMessage to include room_id
    const handleSendMessage = async () => {
        if (message.trim()) {
            const timestamp = new Date();
            const messageText = message.trim();

            const newMessage = {
                type: "chat",
                name: usersData.displayName,
                text: messageText,
                time: timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                email: usersData.emails?.[0]?.value || '',
                pending: true // Add a pending state
            };

            // Update UI immediately
            setChat((prevChat) => [...prevChat, newMessage]);
            setMessage(""); // Clear input right away

            // Send socket message
            try {
                await sendMessage(room, newMessage);
            } catch (socketError) {
                console.error('Socket send failed:', socketError);
                // Optionally show a warning that real-time delivery failed
            }

            // Save to database with retry logic
            const messageData = {
                room_id: room,
                message_type: "chat",
                username: usersData.displayName,
                message_text: messageText,
                user_email: usersData.emails?.[0]?.value || ''
            };

            const saveToDatabase = async (retries = 3) => {
                try {
                    const response = await sendingMessage(messageData);
                    // Update the message in chat to remove pending state
                    setChat((prevChat) =>
                        prevChat.map(msg =>
                            msg === newMessage
                                ? { ...msg, pending: false, id: response.id }
                                : msg
                        )
                    );
                } catch (error) {
                    console.error(`Database save attempt failed. Retries left: ${retries - 1}`);
                    if (retries > 1) {
                        // Wait for 1 second before retrying
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        return saveToDatabase(retries - 1);
                    } else {
                        // Final failure
                        console.error('Failed to save message to database after all retries');
                        // Optionally notify user
                        // toast.error('Message sent but not saved permanently');
                    }
                }
            };
            // Start database save process in background
            saveToDatabase();
        }
    };

    const toggleMute = (user) => {
        setMuteStatus((prevStatus) => ({
            ...prevStatus,
            [user]: !prevStatus[user],
        }));
    };

    const sendInvite = async () => {
        setLoading(true);
        if (!Email) {
            setEmailMessage("Please enter a valid email address.");
            setEmailMessageColor("bg-red-500");
            setLoading(false);
            return;
        }

        try {
            const url = 'http://localhost:3000';
            const response = await sendInviteCode(Email, url, room);

            if (response.includes("error") || response.includes("unexpected")) {
                setEmailMessage(response);
                setEmailMessageColor("bg-red-500");
            } else {
                setEmailMessage("Email sent successfully!");
                setEmailMessageColor("bg-green-600");
            }
        } catch (error) {
            setEmailMessage("An unexpected error occurred while sending the invite.");
            setEmailMessageColor("bg-red-500");
        } finally {
            setLoading(false);
            setEmail("");

            setTimeout(() => {
                setEmailMessage("");
                setEmailMessageColor("");
            }, 5000);
        }
    };

    // Users data
    const users = ['Amit Mishra', 'Prasoon Saini', 'Abhinav Singh Pundir'];

    return (
        <div className='relative h-full'>
            {/* Tab Buttons */}
            <div className="flex justify-between text-black dark:text-white font-bold">
                <button
                    className={`w-full ${activeTab === 'chat' ? 'border-b border-black dark:border-green-300' : 'border-r'}`}
                    onClick={() => setActiveTab('chat')}
                >
                    Chat
                </button>
                <button
                    className={`w-full ${activeTab === 'users' ? 'border-b border-black dark:border-green-300' : 'border-l'}`}
                    onClick={() => setActiveTab('users')}
                >
                    Users
                </button>
            </div>
            <hr className="p-0 mt-1" />

            {/* Chat Section */}
            {activeTab === 'chat' && (
                <div className="flex-1 flex-col-reverse overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 py-4 px-1 chat_messages">
                    {isLoadingMessages ? (
                        <MessageSkeleton />
                    ) : (
                        chat.map((message, index) => (
                            <div
                                key={index}
                                className={`flex ${message.type === 'join' || message.type === 'leave'
                                    ? 'justify-center'
                                    : message.email === usersData.emails?.[0]?.value
                                        ? 'justify-end'
                                        : 'justify-start'
                                    } mb-4`}
                            >
                                <div className={`flex flex-col max-w-[80%] ${message.email === usersData.emails?.[0]?.value ? 'items-end' : 'items-start'}`}>
                                    {/* Check if message type is 'Join' */}
                                    {message.type === 'join' || message.type === 'leave' ? (
                                        <div className="px-1 text-gray-800 name_size italic">
                                            <span className="text-sm text-gray-400">{message.text}</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="px-1 text-gray-400 name_size">
                                                {message.name || "Unknown"} <span className="text-gray-500">({message.time || "N/A"})</span>
                                            </div>
                                            <div
                                                className={`text-wrap p-2 ${message.email === usersData.emails?.[0]?.value ? 'bg-gray-800 dark:bg-green-300 dark:text-black text-white' : 'bg-gray-200 text-black'
                                                    } rounded-md border`}
                                            >
                                                {message.text || "No content"}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )))}
                </div>
            )}


            {/* Users Section */}
            {activeTab === 'users' && (
                <div className="flex-1 px-1">
                    {isRoomActive ? (
                        <div>
                            <div className='flex gap-2 w-full mt-3'>
                                <input placeholder='Enter Users Email' value={Email} className='w-3/4 p-2 border dark:text-black' onChange={(e) => setEmail(e.target.value)} />
                                <button
                                    className={`w-1/4 p-2 rounded-sm border ${loading ? 'bg-white text-black cursor-not-allowed' : 'bg-gray-900 dark:bg-green-300 dark:text-black text-white'
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
                                                className="w-5 h-5 filter brightness-0 invert dark:invert-0"
                                                alt="Add Group"
                                            />
                                            <div className="font-semibold sm:">Invite</div>
                                        </div>
                                    )}
                                </button>
                            </div>
                            {emailMessage && (
                                <div className={`mt-2 p-2 text-white rounded ${emailMessageColor}`}>
                                    {emailMessage}
                                </div>
                            )}
                            <div className='flex flex-col mt-5'>
                                <ul className="list-none px-3">
                                    {users.map((user, index) => (
                                        <div key={index} className='flex w-full'>
                                            <li className="text-black dark:text-white text-md w-2/4 mt-2">
                                                {user}
                                            </li>
                                            <div className='flex justify-end gap-1 w-2/4 mt-1'>
                                                <button className="text-white p-2 rounded-full dark:filter dark:brightness-0 dark:invert" onClick={() => toggleMute(user)}>
                                                    <img
                                                        src={muteStatus[user] ? './volume.png' : './music.png'}
                                                        alt={muteStatus[user] ? 'Unmute' : 'Mute'}
                                                        width={17}
                                                    />
                                                </button>
                                                <button className='text-white py-2 px-2 rounded-full dark:filter dark:brightness-0 dark:invert'>
                                                    <img src='./trash.png' width={17} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <p className="text-red-500 text-center flex flex-col ">Room not created yet.</p>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            {activeTab === 'chat' && (
                !isRoomActive && stage === 0 ? (
                    <div className="flex gap-4 justify-between mt-4">
                        <button
                            className="bg-gray-900 dark:bg-green-300 dark:text-black text-white rounded-lg p-2 w-full border"
                            onClick={CreateRoom}
                        >
                            Create Room
                        </button>
                        <button className="bg-white text-black rounded-lg p-2 w-full border" onClick={handleJoinRoom}>
                            Join Room
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-2 mt-2">
                        {stage === 1 && (
                            <>
                                <input
                                    type="text"
                                    className="w-full p-2 border text-black"
                                    placeholder="Enter Room ID..."
                                    onChange={(e) => setRoom(e.target.value)}  // Update the room state when input changes
                                />
                                <button
                                    className="bg-gray-900 dark:bg-green-300 dark:text-black text-white p-2 px-4 rounded-md"
                                    onClick={handlingJoinRoom}  // Join the room when the button is clicked
                                >
                                    Join
                                </button>
                            </>
                        )}
                        {(isCreateRoomClicked || stage === 2) && (
                            <div className="flex gap-2 mt-2 w-full text-black">
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
                                    className="bg-gray-900 dark:bg-green-300 dark:text-black text-white rounded-md py-0 w-1/4 border"
                                    onClick={handleSendMessage} // Call handleSendMessage on button click
                                >
                                    Send
                                </button>
                            </div>
                        )}
                    </div>
                )
            )}

            {showPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                        <p className="text-lg font-semibold mb-4">
                            Please Login to Join the Room
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-800"
                                onClick={handleLogin}
                            >
                                Login with Google
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

        </div>
    );
}

export default Chat;