import React, { useState, useEffect } from 'react'
import { Users } from 'lucide-react' // You can use Radio for an online indicator
import { onOnlineUsersCount, offOnlineUsersCount, connectSocket } from '../utils/socketCon'

function OnlineUsers() {
    const [onlineUsers, setOnlineUsers] = useState(0)

    useEffect(() => {
        connectSocket()

        onOnlineUsersCount((count) => {
            setOnlineUsers(count)
        })

        return () => {
            offOnlineUsersCount()
        }
    }, [])

    return (
        <div className="bg-blue-50 px-3 py-1.5 rounded-lg shadow-sm inline-flex items-center space-x-2">
            <Users className="text-green-600 w-5 h-5" /> {/* Change to a green color for an "online" feel */}
            <span className="text-sm font-bold text-blue-900">
                {onlineUsers}
            </span>
        </div>
    )
}

export default OnlineUsers
