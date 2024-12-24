import { io } from "socket.io-client";

let socket;

/**
 * Connects to the Socket.IO server and initializes the connection.
 */
export const connectSocket = () => {
    if (!socket) {
        socket = io("http://localhost:3002", {
            transports: ["websocket"],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        socket.on("connect", () => {
            console.log("Connected to Socket.IO server:", socket.id);
        });

        socket.on("disconnect", () => {
            console.log("Disconnected from Socket.IO server");
        });
    }
    return socket;
};

/**
 * Retrieves the current socket instance.
 * Throws an error if the socket is not initialized.
 */
export const getSocket = () => {
    if (!socket) {
        throw new Error("Socket not initialized. Call `connectSocket` first.");
    }
    return socket;
};

/**
 * Joins a specified room on the server.
 * @param {string} room - The name of the room to join.
 */
export const joinRoom = (room) => {
    const socket = getSocket();
    if (room) {
        socket.emit("joinRoom", room);
        console.log(`Joined room: ${room}`);
    } else {
        console.error("Room name is required to join a room.");
    }
};

/**
 * Sends a message to a specified room.
 * @param {string} room - The name of the room to send the message to.
 * @param {string} message - The message content.
 */
export const sendMessage = (room, message) => {
    const socket = getSocket();
    if (room && message) {
        socket.emit("message", { room, message });
        console.log(`Message sent to room ${room}: ${message}`);
    } else {
        console.error("Room and message are required to send a message.");
    }
};

/**
 * Listens for incoming messages from the server.
 * @param {function} callback - A function to handle incoming messages.
 */
export const onMessage = (callback) => {
    const socket = getSocket();
    socket.on("message", callback);
};

/**
 * Stops listening for incoming messages.
 */
export const offMessage = () => {
    const socket = getSocket();
    socket.off("message");
};
